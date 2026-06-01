import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Home from './components/Home';
import Footer from './components/Footer';
import BecomeModel from './components/BecomeModel';
import AdminPanel from './components/AdminPanel';
import ModelLogin from './components/ModelLogin';
import ModelProfile from './components/ModelProfile';
import LiveRoom from './components/LiveRoom';
import ViewerAuth from './components/ViewerAuth';
import ViewerProfile from './components/ViewerProfile';
import AdminLogin from './components/AdminLogin';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-800">
        <Navbar toggleSidebar={toggleSidebar} />
        
        <div className="flex flex-1 overflow-hidden">
          <Sidebar isOpen={isSidebarOpen} />
          
          <div className="flex flex-col flex-1 overflow-y-auto">
            {/* Define the page routes here */}
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/become-model" element={<BecomeModel />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/login" element={<ModelLogin />} />
              <Route path="/profile" element={<ModelProfile />} />
              <Route path="/room/:id" element={<LiveRoom />} />
              <Route path="/viewer-auth" element={<ViewerAuth />} />
              <Route path="/viewer/profile" element={<ViewerProfile />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              {/* Future routes like /room/:modelName will go here */}  
            </Routes>
            <Footer />
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;