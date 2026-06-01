import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import {
  LiveKitRoom,
  VideoTrack,
  RoomAudioRenderer,
  useTracks,
  useParticipants,
  useChat,
  useRoomContext
} from '@livekit/components-react';
import { Track, VideoQuality } from 'livekit-client';
import '@livekit/components-styles';

// --- 1. CUSTOM CHAT COMPONENT (FIXED AUTO-SCROLL & OVERLAY) ---
function CustomChat({ roomId, isFullscreen }) {
  const { chatMessages, send } = useChat();
  const [message, setMessage] = useState('');
  
  // Auto-scroll ke liye Ref
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const viewerStr = localStorage.getItem('nirochart_viewer');
  const viewer = viewerStr ? JSON.parse(viewerStr) : null;
  const token = localStorage.getItem('nirochart_viewer_token');
  const isModel = location.state?.isBroadcaster || false;

  // FIX: Accurate Auto-scroll 
  // setTimeout use kiya taaki DOM update hone ke baad scroll ho
  useEffect(() => {
    if (messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    }
  }, [chatMessages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (message.trim() !== '') {
      send(message);
      setMessage('');
    }
  };

  const handleTipClick = async () => {
    if (isModel) { alert("You cannot tip your own stream!"); return; }
    if (!viewer || !token) { navigate('/viewer-auth', { state: { from: location.pathname } }); return; }
    
    const amount = parseInt(prompt(`Your balance is ${viewer.wallet_balance} coins. Tip amount:`));
    if (amount > 0) {
      try {
        const response = await fetch('${import.meta.env.VITE_API_URL}/api/tips/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ room_id: roomId, amount: amount }),
        });
        const data = await response.json();
        if (response.ok) {
          viewer.wallet_balance = data.new_balance;
          localStorage.setItem('nirochart_viewer', JSON.stringify(viewer));
          send(`💎 ${viewer.username} just tipped ${amount} coins! 💎`);
        } else { alert(`Failed: ${data.detail}`); }
      } catch (err) { alert("Network error."); }
    }
  };

  return (
    // FIX: Flex container setup to prevent layout breaking (min-h-0 is the magic class here)
    <div className={`flex flex-col h-full bg-gray-950 transition-all duration-300 ${isFullscreen ? 'bg-opacity-70' : ''}`}>
      <div className="p-4 border-b border-gray-800 flex justify-between items-center shrink-0">
        <h2 className="text-xl font-bold text-white">Live Chat</h2>
        {!isModel && (
          <button onClick={handleTipClick} className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-1 px-3 rounded shadow text-sm transition-transform hover:scale-105">
            💎 Tip
          </button>
        )}
      </div>
      
      {/* FIX: flex-1 aur overflow-y-auto ensures it scrolls inside its box without expanding */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 custom-scrollbar">
        {chatMessages.map((msg, idx) => {
          const isTipMessage = msg.message.includes("💎");
          return (
            <div key={idx} className="flex flex-col">
              <span className={`text-xs font-bold ${isTipMessage ? 'text-yellow-400' : 'text-purple-400'}`}>
                {msg.from?.identity || 'User'}
              </span>
              <span className={`text-sm p-2 rounded-lg mt-1 w-fit max-w-[90%] break-words ${isTipMessage ? 'bg-yellow-900/30 text-yellow-200 border border-yellow-700/50' : 'bg-gray-800 text-gray-200'}`}>
                {msg.message}
              </span>
            </div>
          );
        })}
        {/* Invisible div for auto-scroll target */}
        <div ref={messagesEndRef} className="h-1" />
      </div>

      <div className="p-4 border-t border-gray-800 bg-gray-900 shrink-0">
        <form onSubmit={handleSend} className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-800 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-700 text-sm"
          />
          <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold transition-colors">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

// --- 2. MODEL VIDEO COMPONENT (WITH QUALITY CONTROL) ---
function ModelVideo({ isModel, roomId }) {
  const tracks = useTracks([Track.Source.Camera]);
  
  useEffect(() => {
    if (!isModel || tracks.length === 0) return;
    const interval = setInterval(async () => {
      const videoElement = document.querySelector('video');
      if (videoElement) {
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const frameData = canvas.toDataURL('image/jpeg', 0.8);
        try {
          await fetch('${import.meta.env.VITE_API_URL}/api/room/thumbnail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ room_id: roomId, image: frameData })
          });
        } catch (e) { console.error(e); }
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [isModel, tracks, roomId]);
  
  if (tracks.length === 0) {
    return (
      <div className="text-gray-400 flex flex-col items-center">
        <div className="animate-pulse h-16 w-16 mb-4 rounded-full bg-gray-800"></div>
        <p>{isModel ? "Starting your camera..." : "Waiting for model to start video..."}</p>
      </div>
    );
  }

  // LiveKit automatically adapts video quality (Simulcast) based on the viewer's network
  // and the size of the video element.
  return <VideoTrack trackRef={tracks[0]} className="w-full h-full object-contain" />;
}

// --- 3. MAIN ROOM COMPONENT ---
const LiveRoom = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isModel = location.state?.isBroadcaster || false; 
  const streamTitle = location.state?.title || `Live Stream`;

  const [token, setToken] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Fullscreen container ke liye ref
  const roomContainerRef = useRef(null);
  
  const serverUrl = 'wss://fastchat-sxbx8466.livekit.cloud';

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('nirochart_user'));
    const participantName = storedUser ? storedUser.display_name : `Guest${Math.floor(Math.random() * 1000)}`;

    const fetchToken = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/room/token?room_name=${id}&participant_name=${participantName}&is_model=${isModel}`);
        const data = await response.json();
        setToken(data.token);
      } catch (error) { console.error(error); }
    };
    fetchToken();
  }, [id, isModel]);

  // Handle Fullscreen Toggling
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      roomContainerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Listen for ESC key or browser native fullscreen exits
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!token) return <div className="flex h-screen items-center justify-center bg-gray-900 text-white">Connecting...</div>;

  return (
    <div ref={roomContainerRef} className="h-screen w-screen bg-black overflow-hidden relative">
      <LiveKitRoom
        video={isModel}
        audio={isModel}
        token={token}
        serverUrl={serverUrl}
        onDisconnected={() => { if (!isModel) navigate('/'); }}
        className="flex h-full w-full overflow-hidden"
      >
        {/* LEFT SIDE / MAIN VIDEO */}
        <div className="flex-1 flex flex-col relative min-w-0">
          
          {/* Header Overlay */}
          <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-start p-6 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
            <div>
              <h1 className="text-2xl font-bold text-white shadow-sm pointer-events-auto">{streamTitle}</h1>
              
              {/* Optional: Video Quality Indicator (LiveKit handles it natively) */}
              {!isModel && (
                <span className="text-xs font-semibold text-green-400 bg-green-900/40 px-2 py-1 rounded mt-2 inline-block">
                  Auto Quality (Simulcast)
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-4 pointer-events-auto">
              <ViewerCount />
              
              {/* Fullscreen Toggle Button */}
              <button 
                onClick={toggleFullScreen}
                className="bg-gray-800/80 hover:bg-gray-700 text-white p-2 rounded shadow transition-colors"
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? "↙️ Exit" : "↗️ Fullscreen"}
              </button>

              {isModel && <RoomDisconnectButton onDisconnect={() => navigate('/profile')} id={id} />}
            </div>
          </div>
          
          {/* Main Video Box */}
          <div className="flex-1 flex items-center justify-center bg-black h-full w-full">
            <ModelVideo isModel={isModel} roomId={id} />
          </div>
          <RoomAudioRenderer />
        </div>

        {/* RIGHT SIDE / CHAT */}
        {/* Agar Fullscreen hai toh chat absolute ho jayega (overlay), warna normal side panel */}
        <div 
          className={`
            border-l border-gray-800 bg-gray-950 flex flex-col transition-all duration-300 z-30
            ${isFullscreen 
              ? 'absolute bottom-0 right-0 h-[70vh] w-80 sm:w-96 rounded-tl-xl shadow-2xl border-t border-gray-700' 
              : 'relative w-80 sm:w-96 h-full'
            }
          `}
        >
          <CustomChat roomId={id} isFullscreen={isFullscreen} />
        </div>
      </LiveKitRoom>
    </div>
  );
};

function ViewerCount() {
  const participants = useParticipants();
  const viewerCount = Math.max(0, participants.length - 1);
  return (
    <div className="flex items-center space-x-2 bg-red-600 text-white px-3 py-1.5 rounded-full font-bold text-sm shadow-lg">
      <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span></span>
      <span>{viewerCount} Live</span>
    </div>
  );
}

function RoomDisconnectButton({ onDisconnect, id }) {
  const room = useRoomContext();
  const handleClick = async () => {
    if (!window.confirm("End stream?")) return;
    try { await fetch(`${import.meta.env.VITE_API_URL}/api/streams/end/${id}`, { method: 'POST' }); } catch (e) {}
    room.disconnect();
    onDisconnect();
  };
  return <button onClick={handleClick} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">End Stream</button>;
}

export default LiveRoom;