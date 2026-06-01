import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [liveModels, setLiveModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Backend API se sirf active/live rooms fetch karna
    const fetchLiveStreams = async () => {
      try {
        const response = await fetch('${import.meta.env.VITE_API_URL}/api/streams/live');
        if (response.ok) {
          const data = await response.json();
          setLiveModels(data);
        }
      } catch (error) {
        console.error("Failed to fetch live streams:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveStreams();
    
    // Har 10 second me list update karna taki naye models turant dikh jaye
    const interval = setInterval(fetchLiveStreams, 10000);
    return () => clearInterval(interval);
  }, []);

  const joinRoom = (roomId, modelName) => {
  navigate(`/room/${roomId}`, {
    state: {
      title: roomId,
      modelName: modelName,
      isBroadcaster: false
    }
  });
};

  return (
    <main className="flex-grow bg-gray-100 dark:bg-gray-800 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          <span className="animate-pulse text-red-500 mr-2">●</span>Live Now
        </h1>
        
        {loading ? (
          <div className="text-white">Loading live streams...</div>
        ) : liveModels.length === 0 ? (
          <div className="text-center bg-gray-900 p-12 rounded-xl text-gray-400">
            No models are currently live. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {liveModels.map((model) => (
              <div 
                key={model.id} 
                onClick={() => joinRoom(model.room_id, model.display_name)}
                className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer group"
              >
                <div className="relative">
                  {/* Backend se aaya hua real-time screenshot thumbnail */}
                  <img 
                    src={model.thumbnail_url || 'https://via.placeholder.com/400x225/1f2937/ffffff?text=Camera+Starting...'} 
                    alt={`${model.display_name} stream`} 
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-lg flex items-center">
                    <span className="h-2 w-2 bg-white rounded-full mr-1 animate-pulse"></span>
                    LIVE
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {model.display_name}
                  </h3>
                  <p className="text-sm text-gray-500">{model.stream_title}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default Home;