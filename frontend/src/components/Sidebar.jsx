import React from 'react';

const Sidebar = ({ isOpen }) => {
  const menuItems = [
    { name: 'Home', icon: '🏠' },
    { name: 'Recommended', icon: '🔥' },
    { name: 'My Favorites', icon: '❤️' },
    { name: 'Watch History', icon: '⏱️' },
  ];

  return (
    <aside 
      className={`bg-gray-800 text-gray-300 transition-all duration-300 ease-in-out flex-shrink-0 border-r border-gray-700
        ${isOpen ? 'w-64' : 'w-0'} overflow-hidden`}
    >
      <div className="p-4 w-64">
        <ul className="space-y-2">
          {menuItems.map((item, index) => (
            <li key={index}>
              <a 
                href={`#${item.name.toLowerCase().replace(' ', '-')}`}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 hover:text-white transition-colors cursor-pointer"
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.name}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;