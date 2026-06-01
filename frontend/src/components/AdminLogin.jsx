import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';


const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('${import.meta.env.VITE_API_URL}/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('nirochart_admin_token', data.access_token);
        navigate('/admin'); // Login success pe panel me bhejo
      } else {
        setError(data.detail);
      }
    } catch (err) {
      setError('Network Error');
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-red-500/30 max-w-md w-full">
        <h2 className="text-3xl font-bold text-white text-center mb-6">
          <span className="text-red-500">Admin</span> Portal
        </h2>
        {error && <p className="text-red-400 bg-red-900/20 p-3 rounded mb-4 text-center">{error}</p>}
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="text" placeholder="Admin Username" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-3 bg-gray-900 text-white rounded border border-gray-700 focus:border-red-500 focus:outline-none" />
          <input type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 bg-gray-900 text-white rounded border border-gray-700 focus:border-red-500 focus:outline-none" />
          <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded transition">Secure Login</button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;