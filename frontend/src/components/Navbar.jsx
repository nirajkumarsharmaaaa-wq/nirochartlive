import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = ({ toggleSidebar }) => {
  const [user, setUser] = useState(null);
  const [viewer, setViewer] = useState(null);
  const navigate = useNavigate();

  // Check for logged-in user on component mount
  useEffect(() => {
  const storedUser = localStorage.getItem('nirochart_user');
    if (storedUser) setUser(JSON.parse(storedUser));
  
    const storedViewer = localStorage.getItem('nirochart_viewer');
    if (storedViewer) setViewer(JSON.parse(storedViewer));
}, []);



  const handleLogout = () => {
    localStorage.clear(); // Saare tokens clear kar do
    setUser(null);
    setViewer(null);
    navigate('/');
};
  return (
    <nav className="sticky top-0 z-50 bg-gray-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex justify-between items-center h-16">
          
          <div className="flex items-center space-x-4">
            <button onClick={toggleSidebar} className="text-gray-400 hover:text-white focus:outline-none p-2 rounded-md hover:bg-gray-800 transition-colors">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link to="/" className="flex-shrink-0 flex items-center cursor-pointer">
              <span className="font-bold text-2xl tracking-wider text-purple-500">
                Nirochart
              </span>
            </Link>
          </div>
          
          <div className="flex space-x-4 items-center">
  {user ? (
    <>
      <span className="text-gray-300 text-sm font-medium mr-4">
        Model: {user.display_name}
      </span>

      <Link
        to="/profile"
        className="text-purple-400 hover:text-purple-300 px-3 py-2 rounded-md text-sm font-bold transition-colors"
      >
        Dashboard
      </Link>

      <button
        onClick={handleLogout}
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
      >
        Logout
      </button>
    </>
  ) : viewer ? (
    <>
      <span className="text-yellow-400 text-sm font-bold mr-4">
        💎 {viewer.wallet_balance} Coins
      </span>

      <Link
        to="/viewer/profile"
        className="text-purple-400 hover:text-purple-300 px-3 py-2 rounded-md text-sm font-bold transition-colors"
      >
        My Profile
      </Link>

      <button
        onClick={handleLogout}
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
      >
        Logout
      </button>
    </>
  ) : (
    <>
      <Link
        to="/viewer-auth"
        className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
      >
        Login
      </Link>

      <Link
        to="/viewer-auth/"
        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
      >
        Sign Up
      </Link>
    </>
  )}
</div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;