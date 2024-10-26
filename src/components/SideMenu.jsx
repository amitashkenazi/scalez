import React from 'react';
import { Bell, Users, LayoutDashboard, Database, Home } from 'lucide-react';

const MenuItem = ({ icon: Icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`
      w-full flex items-center space-x-3 p-3 rounded-lg transition-colors
      ${isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
    `}
  >
    <Icon size={20} />
    <span>{label}</span>
  </button>
);

const SideMenu = ({ activeView, onViewChange }) => {
  const menuItems = [
    {
      icon: Home,
      label: "Home",
      view: "landing"
    },
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      view: "dashboard"
    },
    {
      icon: Users,
      label: "Customers",
      view: "customers"
    },
    {
      icon: Bell,
      label: "Notifications",
      view: "notifications"
    },
    {
      icon: Database,
      label: "All Scales",
      view: "allScales"
    }
  ];

  return (
    <div className="h-full pt-16">
      <div className="flex flex-col space-y-2 p-4">
        {menuItems.map((item) => (
          <MenuItem
            key={item.view}
            icon={item.icon}
            label={item.label}
            isActive={activeView === item.view}
            onClick={() => onViewChange(item.view)}
          />
        ))}
      </div>
    </div>
  );
};

export default SideMenu;