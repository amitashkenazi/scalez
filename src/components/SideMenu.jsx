import React, { useState } from 'react';
import { 
  Languages,
  Package,
  Scale,
  Truck,
  Users,
  Share,
  UserCircle,
  MapIcon,
  Database,
  Plug,
  LayoutDashboard,
  Settings,
  FileText
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import AuthModal from './auth/AuthModal';
import { useAuth } from '../contexts/AuthContext';
import UserAccountButton from './auth/UserAccountButton';


const SideMenu = ({ activeView, onViewChange }) => {
  const { user, isAdmin } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  // Helper function to get translation
  const t = (key) => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return `Missing translation: ${key}`;
  };
  const isRTL = language === 'he';

  // Define menu sections
  const dashboardItems = [
    {
      icon: Package,
      label: t('productsDashboard'),
      view: "products",
      description: t('productsDashboardDesc')
    },
    // {
    //   icon: MapIcon,
    //   label: t('mapLabel'),
    //   view: "customersMap",
    //   description: "View customers and products on a map"
    // },
    
    {
      icon: Share,
      label: t('sharedProducts'),
      view: "sharedProducts",
      description: t('sharedProductsDesc')
    }
  ];

  const setupItems = [
    
    {
      icon: Users,
      label: t('customersTable'),
      view: "customersTable",
      description: t('customersTableDesc')
    },
    {
      icon: Database,
      label: t("items"),
      view: "items",
      description: "Manage system items and generate products"
    },
    {
      icon: Scale,
      label: t('scalesManagement'),
      view: 'scalesManagement',
      description: 'Manage and monitor all scales in the system'
    },
    {
      icon: FileText,
      label: t('invoices'),
      view: "invoices",
      description: "Track and manage product invoices"
    },
    {
      icon: Plug,
      label: t("integrations"),
      view: "integrations",
      description: "Connect external services and tools"
    },
    {
      icon: UserCircle,
      label: t("myaccount"),
      view: "myAccount",
      description: "Manage your account settings"
    },
  ];

  // Add vendors to setup items if user is admin
  if (isAdmin) {
    setupItems.push({
      icon: Truck,
      label: t('vendors').title,
      view: "vendors",
      description: t('vendors').description
    });
  }

  const renderMenuSection = (title, items, icon) => (
    <div className="mb-6">
      <div className={`px-4 mb-2 flex items-center ${isRTL ? 'justify-end' : 'justify-start'} gap-2 text-gray-400`}>
        {isRTL ? (
          <>
            <span className="text-sm font-medium uppercase">{title}</span>
            {icon}
          </>
        ) : (
          <>
            {icon}
            <span className="text-sm font-medium uppercase">{title}</span>
          </>
        )}
      </div>
      <div className="space-y-1">
        {items.map((item) => (
          <button
            key={item.view}
            onClick={() => onViewChange(item.view)}
            className={`
              w-full px-3 py-2.5 rounded-lg transition-colors
              flex items-center gap-3
              ${activeView === item.view ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
              ${isRTL ? 'flex-row-reverse justify-end text-right' : 'flex-row justify-start text-left'}
            `}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <div className="h-full flex flex-col bg-gray-800">
        {/* User Profile Section */}
        <div className="p-4 border-b border-gray-700">
          {user ? (
            <UserAccountButton />
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('signIn')}
            </button>
          )}
        </div>

        {/* Menu Title */}
        <div className="p-6">
          <h2 className={`text-xl font-bold text-white mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('menuTitle')}
          </h2>
          <p className={`text-sm text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('menuSubtitle')}
          </p>
        </div>

        {/* Menu Sections */}
        <nav className={`flex-1 px-4 overflow-y-auto ${isRTL ? 'text-right' : 'text-left'}`}>
          {renderMenuSection(t('dashboardsLabel'), dashboardItems, <LayoutDashboard size={18} />)}
          <div className={`mx-2 my-4 border-t border-gray-700`} />
          {renderMenuSection(t('setup'), setupItems, <Settings size={18} />)}
        </nav>

        {/* Language Toggle */}
        <div className="px-4 py-3 border-t border-gray-700">
          <button
            onClick={toggleLanguage}
            className={`
              w-full px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white
              flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}
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
            <p>{t('version')}: 1.0.0</p>
            <p>{t('copyright')}</p>
          </div>
        </div>
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </>
  );
};

export default SideMenu;