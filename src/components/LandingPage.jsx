import React from 'react';
import {
  Scale,
  Package,
  Truck,
  List as ListIcon
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';

const MenuCard = ({ icon: Icon, title, description, onClick, isRTL }) => (
  <div 
    className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transform transition-all duration-200 hover:scale-102 hover:shadow-lg"
    onClick={onClick}
  >
    <div className="p-4 flex gap-4 items-start">
      <div className="rounded-lg bg-gray-50 p-3">
        <Icon size={24} className="text-gray-700" />
      </div>
      <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
        <h3 className="text-lg font-semibold mb-1">{title}</h3>
        <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
      </div>
    </div>
  </div>
);

const WelcomeMessage = ({ name, time, t, isRTL }) => {
  return (
    <div className={`mb-8 ${isRTL ? 'text-right' : 'text-left'}`}>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        {t.welcomeMessage.replace('{time}', time).replace('{name}', name)}
      </h2>
      <p className="text-gray-600">{t.welcomeSubtitle}</p>
    </div>
  );
};

const LandingPage = ({ onViewChange }) => {
  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'he';

  // Get time-based greeting
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t.timeGreetings.morning;
    if (hour < 17) return t.timeGreetings.afternoon;
    return t.timeGreetings.evening;
  };

  const menuItems = [
    {
      icon: Package,
      label: t.productsDashboard,
      view: "products",
      description: t.productsDashboardDesc
    },
    {
      icon: Truck,
      label: t.vendors.title,
      view: "vendors",
      description: t.vendors.description
    },
    {
      icon: ListIcon,
      label: t.customersTable,
      view: "customersTable",
      description: t.customersTableDesc
    },
    {
      icon: Scale,
      label: 'Scales Management',
      view: 'scalesManagement',
      description: 'Manage and monitor all scales in the system'
    },
    {
      icon: Package,
      label: t.productsManagement,
      view: "productsMng",
      description: t.productsDesc
    },
  ];

  return (
    <div 
      className="w-full max-w-4xl mx-auto px-4"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Welcome Section */}
      <div className="mb-8">
        <WelcomeMessage
          name={t.userName}
          time={getTimeBasedGreeting()}
          t={t}
          isRTL={isRTL}
        />
      </div>

      {/* Menu Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {menuItems.map((item) => (
          <MenuCard
            key={item.view}
            icon={item.icon}
            title={item.label}
            description={item.description}
            onClick={() => onViewChange(item.view)}
            isRTL={isRTL}
          />
        ))}
      </div>
    </div>
  );
};

export default LandingPage;