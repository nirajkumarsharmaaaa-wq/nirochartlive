import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ViewerProfile = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const coinPackages = [
    { coins: 500, price: 5.00, label: "Starter Pack" },
    { coins: 1200, price: 10.00, label: "Popular Pack (20% Extra)" },
    { coins: 5000, price: 40.00, label: "Whale Pack (Best Value)" }
  ];

  useEffect(() => {
    const token = localStorage.getItem('nirochart_viewer_token');

    if (!token) {
      navigate('/viewer-auth');
      return;
    }

    const fetchViewerProfile = async () => {
      try {
        const response = await fetch(
          '${import.meta.env.VITE_API_URL}/api/viewers/profile',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setProfileData(data);
        } else {
          localStorage.removeItem('nirochart_viewer_token');
          localStorage.removeItem('nirochart_viewer');
          navigate('/viewer-auth');
        }
      } catch (error) {
        console.error('Error fetching viewer profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchViewerProfile();
  }, [navigate]);

  const handleBuyCoins = async (pkg) => {
    const token = localStorage.getItem('nirochart_viewer_token');

    try {
      const response = await fetch(
        '${import.meta.env.VITE_API_URL}/api/payments/create-epoch-session',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            coins: pkg.coins,
            price_usd: pkg.price,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.checkout_url;
      } else {
        alert('Failed to initiate payment.');
      }
    } catch (error) {
      console.error(error);
      alert('Network Error');
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-20 text-white font-bold text-xl">
        Loading your profile...
      </div>
    );
  }

  if (!profileData) return null;

  return (
    <div className="flex-grow bg-gray-100 dark:bg-gray-800 p-8 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="bg-gray-900 rounded-2xl p-8 text-white shadow-xl flex items-center justify-between border border-gray-700">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Hello, {profileData.username}!
            </h1>
            <p className="text-gray-400">
              Manage your account and coin balance here.
            </p>
          </div>

          <div className="h-20 w-20 bg-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-inner border-4 border-purple-400">
            {profileData.username?.charAt(0).toUpperCase()}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Account Details */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 border-b border-gray-700 pb-2">
              Account Details
            </h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Username
                </p>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {profileData.username}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Email Address
                </p>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {profileData.email}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Wallet Balance
                </p>
                <p className="text-2xl font-bold text-yellow-500">
                  💎 {profileData.wallet_balance} Coins
                </p>
              </div>
            </div>
          </div>

          {/* Buy Coins */}
          <div className="bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-6">
              Buy Coins
            </h2>

            <div className="space-y-4">
              {coinPackages.map((pkg, idx) => (
                <div
                  key={idx}
                  className="bg-gray-800 rounded-xl p-4 flex justify-between items-center border border-gray-700 hover:border-purple-500 transition-colors"
                >
                  <div>
                    <h3 className="text-white font-bold text-lg">
                      {pkg.label}
                    </h3>

                    <p className="text-yellow-400 font-bold">
                      💎 {pkg.coins} Coins
                    </p>
                  </div>

                  <button
                    onClick={() => handleBuyCoins(pkg)}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-transform hover:scale-105"
                  >
                    ${pkg.price.toFixed(2)}
                  </button>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              Payments are securely processed by Epoch.com
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ViewerProfile;