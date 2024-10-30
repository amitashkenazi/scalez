import React from 'react';
import { 
  Bell, 
  Users, 
  LayoutDashboard, 
  Database, 
  Home, 
  Scale,
  Languages,
  List as ListIcon
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';


const MenuItem = ({ icon: Icon, label, isActive, onClick, language }) => {
  const isRTL = language === 'he';
  
  return (
    <button
      onClick={onClick}
      className={`
        w-full px-3 py-2.5 rounded-lg transition-colors
        flex items-center gap-3
        ${isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
        ${isRTL ? 'flex-row-reverse justify-end text-right' : 'flex-row justify-start text-left'}
      `}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );
};

const SideMenu = ({ activeView, onViewChange }) => {
  const { language, toggleLanguage } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'he';

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
      icon: ListIcon,  // Import this from lucide-react
      label: t.customersTable,
      view: "customersTable",
      description: t.customersTableDesc
    },
    {
      icon: Bell,
      label: t.notifications,
      view: "notifications",
      description: t.notificationsDesc
    },
    // In SideMenu.jsx, add to your menuItems array:
  {
    icon: Scale, // Import Scale from lucide-react
    label: 'Scales Management',
    view: 'scalesManagement',
    description: 'Manage and monitor all scales in the system'
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
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="p-6">
        <h2 className={`text-xl font-bold text-white mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
          {t.menuTitle}
        </h2>
        <p className={`text-sm text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}>
          {t.menuSubtitle}
        </p>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4">
        <div className="space-y-1">
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

      {/* Language Toggle */}
      <div className="px-4 py-3 border-t border-gray-700">
        <button
          onClick={toggleLanguage}
          className={`
            w-full px-3 py-2.5 rounded-lg
            flex items-center gap-3 text-gray-300 hover:bg-gray-700 hover:text-white
            ${isRTL ? 'flex-row-reverse justify-end text-right' : 'flex-row justify-start text-left'}
          `}
        >
          <Languages size={20} />
          <span className="font-medium">
            {language === 'en' ? 'עברית' : 'English'}
          </span>
        </button>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-700">
        <div className={`text-sm text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}>
          <p>{t.version}: 1.0.0</p>
          <p>{t.copyright}</p>
        </div>
      </div>
    </div>
  );
};

export default SideMenu;