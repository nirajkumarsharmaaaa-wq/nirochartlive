import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center space-y-4">
        <p className="text-sm">© {new Date().getFullYear()} Nirochart. All rights reserved.</p>
        <Link 
          to="/become-model" 
          className="text-purple-400 hover:text-purple-300 font-semibold underline transition-colors"
        >
          Become a Model
        </Link>
      </div>
    </footer>
  );
};

export default Footer;