import React, { useState } from 'react';
import { 
  Languages,
  Package,
  Scale,
  Truck,
  Users,
  Share,
  UserCircle,
  MapIcon
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
  const t = translations[language];
  const isRTL = language === 'he';

  // Define base menu items
  const baseMenuItems = [
    {
      icon: Package,
      label: t.productsDashboard,
      view: "products",
      description: t.productsDashboardDesc
    },
    {
      icon: Share, // Import Share from lucide-react
      label: t.sharedProducts, // Add translation
      view: "sharedProducts",
      description: t.sharedProductsDesc
    },
    {
      icon: Users,
      label: t.customersTable,
      view: "customersTable",
      description: t.customersTableDesc
    },
    {
      icon: Scale,
      label: t.scalesManagement,
      view: 'scalesManagement',
      description: 'Manage and monitor all scales in the system'
    },
    {
      icon: Package,
      label: t.productsManagement,
      view: "productsMng",
      description: t.productsDesc
    },
    {
      icon: UserCircle, // Import UserCircle from lucide-react
      label: "My Account",
      view: "myAccount",
      description: "Manage your account settings"
    },
    {
      icon: MapIcon,
      label: "Customers Map",
      view: "customersMap",
      description: "View customers and products on a map"
    }
    
  ];

  // Add vendors tab only for admin users
  const menuItems = isAdmin ? [
    ...baseMenuItems,
    {
      icon: Truck,
      label: t.vendors.title,
      view: "vendors",
      description: t.vendors.description
    }
  ] : baseMenuItems;

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
              {t.signIn}
            </button>
          )}
        </div>

        {/* Rest of your menu code... */}
        <div className="p-6">
          <h2 className={`text-xl font-bold text-white mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
            {t.menuTitle}
          </h2>
          <p className={`text-sm text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}>
            {t.menuSubtitle}
          </p>
        </div>

        <nav className="flex-1 px-4">
          <div className="space-y-1">
            {menuItems.map((item) => (
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
            <p>{t.version}: 1.0.0</p>
            <p>{t.copyright}</p>
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