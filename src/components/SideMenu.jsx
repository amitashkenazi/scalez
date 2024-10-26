import React from 'react';
import { Bell, Users, LayoutDashboard, Database, Home } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';

const MenuItem = ({ icon: Icon, label, isActive, onClick, language }) => {
  // Adjust the flexbox order for RTL layout
  const rtlStyles = language === 'he' ? 'flex-row-reverse' : '';
  
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center p-3 rounded-lg transition-colors
        ${rtlStyles}
        ${isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
        ${language === 'he' ? 'space-x-reverse' : 'space-x-3'}
      `}
    >
      <Icon size={20} className={language === 'he' ? 'ml-3' : 'mr-3'} />
      <span className="font-medium">{label}</span>
    </button>
  );
};

const SideMenu = ({ activeView, onViewChange }) => {
  const { language } = useLanguage();
  const t = translations[language];

  const menuItems = [
    {
      icon: Home,
      label: t.home,
      view: "landing",
      description: t.homeDesc
    },
    {
      icon: LayoutDashboard,
      label: t.dashboard,
      view: "dashboard",
      description: t.dashboardDesc
    },
    {
      icon: Users,
      label: t.customers,
      view: "customers",
      description: t.customersDesc
    },
    {
      icon: Bell,
      label: t.notifications,
      view: "notifications",
      description: t.notificationsDesc
    },
    {
      icon: Database,
      label: t.allScales,
      view: "allScales",
      description: t.allScalesDesc
    }
  ];

  return (
    <div 
      className="h-full flex flex-col bg-gray-800"
      dir={language === 'he' ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="p-6">
        <h2 className={`text-xl font-bold text-white mb-2 ${language === 'he' ? 'text-right' : 'text-left'}`}>
          {t.menuTitle}
        </h2>
        <p className={`text-sm text-gray-400 ${language === 'he' ? 'text-right' : 'text-left'}`}>
          {t.menuSubtitle}
        </p>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4">
        <div className="space-y-2">
          {menuItems.map((item) => (
            <MenuItem
              key={item.view}
              icon={item.icon}
              label={item.label}
              isActive={activeView === item.view}
              onClick={() => onViewChange(item.view)}
              language={language}
            />
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-gray-700">
        <div className={`text-sm text-gray-400 ${language === 'he' ? 'text-right' : 'text-left'}`}>
          <p>{t.version}: 1.0.0</p>
          <p>{t.copyright}</p>
        </div>
      </div>
    </div>
  );
};

export default SideMenu;