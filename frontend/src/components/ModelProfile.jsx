import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ModelProfile = () => {
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null); // Backend se aaya real data
  const [streamTitle, setStreamTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('nirochart_user');
    const token = localStorage.getItem('nirochart_token');

    if (!storedUser || !token) {
      navigate('/login');
      return;
    }
    
    setUser(JSON.parse(storedUser));

    // Backend se latest profile aur Wallet Balance fetch karna
    const fetchProfile = async () => {
      try {
        const response = await fetch('${import.meta.env.VITE_API_URL}/api/models/profile', {
          headers: {
            'Authorization': `Bearer ${token}` // Secure API call
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setProfileData(data);
        } else {
          console.error("Failed to fetch profile");
        }
      } catch (error) {
        console.error("Network error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
    
    // Har 10 second me balance update karna (Agar wo stream end karke aaya hai toh refresh ho jaye)
    const interval = setInterval(fetchProfile, 10000);
    return () => clearInterval(interval);

  }, [navigate]);

  const handleGoLive = (e) => {
    e.preventDefault();
    if (!streamTitle.trim()) {
      alert("Please enter a stream title before going live!");
      return;
    }
    navigate(`/room/${user.id}`, { state: { title: streamTitle, isBroadcaster: true } });
  };

  if (loading || !user) return <div className="text-center mt-20 text-white">Loading Dashboard...</div>;

  return (
    <div className="flex-grow bg-gray-100 dark:bg-gray-800 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header / Welcome Banner */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user.display_name}!</h1>
            <p className="mt-2 text-purple-100">Your profile is approved and you are ready to broadcast.</p>
          </div>
          <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center text-purple-700 text-3xl font-bold shadow-inner">
            {user.display_name.charAt(0).toUpperCase()}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Stream Control Center (Left Column) */}
          <div className="md:col-span-2 bg-white dark:bg-gray-900 rounded-2xl shadow-md p-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Stream Control Center</h2>
            <form onSubmit={handleGoLive} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Stream Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g., Chilling and chatting! Come say hi 👋"
                  value={streamTitle}
                  onChange={(e) => setStreamTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button type="submit" className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                <span className="animate-pulse h-3 w-3 bg-white rounded-full"></span>
                <span>GO LIVE NOW</span>
              </button>
            </form>
          </div>

          {/* Quick Stats / Earnings (Right Column) */}
          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 border border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <span className="text-2xl mr-2">💰</span> My Earnings
              </h3>
              
              <div className="space-y-6">
                {/* Real-time Wallet Balance */}
                <div className="bg-gradient-to-br from-yellow-100 to-yellow-50 dark:from-yellow-900/30 dark:to-yellow-800/10 rounded-xl p-6 border border-yellow-200 dark:border-yellow-700/50 relative overflow-hidden">
                  <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-500 mb-1">Total Coins Earned</p>
                  <p className="text-4xl font-extrabold text-yellow-600 dark:text-yellow-400">
                    {profileData?.wallet_balance || 0} <span className="text-lg font-medium text-yellow-700 dark:text-yellow-500">Coins</span>
                  </p>
                  {/* Decorative Icon */}
                  <div className="absolute -right-4 -bottom-4 opacity-20 text-8xl">💎</div>
                </div>

                <button className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold py-3 rounded-lg transition-colors border border-gray-300 dark:border-gray-600">
                  Withdraw Funds
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ModelProfile;