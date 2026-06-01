import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const ViewerAuth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  // Agar user room se redirect hoke aaya hai (Tipping ke liye), toh hum use wapas wahi bhejenge
  const location = useLocation(); 
  const returnUrl = location.state?.from || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const endpoint = isLogin ? '/api/viewers/login' : '/api/viewers/signup';
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        if (!isLogin) {
          // If signup successful, switch to login
          alert("Account created successfully! Please log in.");
          setIsLogin(true);
        } else {
          // If login successful, save token
          localStorage.setItem('nirochart_viewer_token', data.access_token);
          localStorage.setItem('nirochart_viewer', JSON.stringify(data.user));
          
          // Wapas usi room me bhej do jaha se wo aaya tha
          navigate(returnUrl);
          window.location.reload();
        }
      } else {
        setError(data.detail);
      }
    } catch (err) {
      setError("Network Error");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-900 px-4">
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-xl shadow-2xl text-white border border-gray-700">
        <h2 className="text-3xl font-bold text-center mb-2">
          {isLogin ? 'Viewer Login' : 'Create Account'}
        </h2>
        <p className="text-gray-400 text-center mb-6">
          {isLogin ? 'Log in to tip your favorite models!' : 'Join to interact and send tips!'}
        </p>

        {error && <div className="bg-red-500/20 text-red-400 p-3 rounded mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
              <input type="text" required value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
            <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
            <input type="password" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500" />
          </div>
          <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 font-bold py-3 rounded-lg transition-colors mt-4">
            {isLogin ? 'Log In' : 'Sign Up'}
          </button>
        </form>

        <div className="text-center mt-6">
          <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-purple-400 hover:underline">
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewerAuth;