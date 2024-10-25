import React from 'react';
import { Bell, Users } from 'lucide-react';

const SideMenu = ({ activeView, onViewChange }) => {
  return (
    <div className="h-full pt-16">
      <div className="flex flex-col space-y-2 p-4">
        <button
          onClick={() => onViewChange('customers')}
          className={`
            w-full flex items-center space-x-2 p-3 rounded-lg transition-colors
            ${activeView === 'customers' ? 'bg-blue-600' : 'hover:bg-gray-700'}
          `}
        >
          <Users size={20} />
          <span className="text-white">Customers</span>
        </button>
        
        <button
          onClick={() => onViewChange('notifications')}
          className={`
            w-full flex items-center space-x-2 p-3 rounded-lg transition-colors
            ${activeView === 'notifications' ? 'bg-blue-600' : 'hover:bg-gray-700'}
          `}
        >
          <Bell size={20} />
          <span className="text-white">Notifications</span>
        </button>
      </div>
    </div>
  );
};

export default SideMenu;