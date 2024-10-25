// components/SideMenu.jsx
import React from 'react';
import { Bell, Users } from 'lucide-react';

export const SideMenu = ({ activeView, onViewChange }) => {
  return (
    <div className="w-64 min-h-screen bg-gray-800 text-white p-4">
      <div className="space-y-2">
        <button
          onClick={() => onViewChange('customers')}
          className={`w-full flex items-center space-x-2 p-3 rounded-lg transition-colors ${
            activeView === 'customers' ? 'bg-blue-600' : 'hover:bg-gray-700'
          }`}
        >
          <Users size={20} />
          <span>Customers</span>
        </button>
        <button
          onClick={() => onViewChange('notifications')}
          className={`w-full flex items-center space-x-2 p-3 rounded-lg transition-colors ${
            activeView === 'notifications' ? 'bg-blue-600' : 'hover:bg-gray-700'
          }`}
        >
          <Bell size={20} />
          <span>Notifications</span>
        </button>
      </div>
    </div>
  );
};

export default SideMenu;