import React from 'react';
import { Users, Bell, LayoutDashboard, Database } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';

const MenuCard = ({ icon: Icon, title, description, onClick, isRTL }) => (
  <div 
    className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
    onClick={onClick}
  >
    <div className="aspect-square flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <Icon size={64} className="text-gray-700" />
    </div>
    <div className={`p-6 ${isRTL ? 'text-right' : 'text-left'}`}>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  </div>
);

const StatsCard = ({ value, label, trend, isRTL }) => (
  <div className={`bg-white rounded-lg p-6 shadow-lg ${isRTL ? 'text-right' : 'text-left'}`}>
    <p className="text-4xl font-bold text-gray-900 mb-2">{value}</p>
    <p className="text-sm text-gray-500">{label}</p>
    {trend && (
      <div className={`mt-2 ${trend.type === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
        {trend.value}
      </div>
    )}
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
      icon: LayoutDashboard,
      title: t.dashboard,
      description: t.dashboardDesc,
      view: 'dashboard'
    },
    {
      icon: Users,
      title: t.customers,
      description: t.customersDesc,
      view: 'customers'
    },
    {
      icon: Bell,
      title: t.notifications,
      description: t.notificationsDesc,
      view: 'notifications'
    },
    {
      icon: Database,
      title: t.allScales,
      description: t.allScalesDesc,
      view: 'allScales'
    }
  ];

  // Example statistics
  const stats = [
    {
      value: '12',
      label: t.stats.activeScales,
      trend: { type: 'increase', value: '+2 ' + t.stats.thisWeek }
    },
    {
      value: '4',
      label: t.stats.customers,
      trend: { type: 'increase', value: '+1 ' + t.stats.thisMonth }
    },
    {
      value: '3',
      label: t.stats.alerts,
      trend: { type: 'decrease', value: '-2 ' + t.stats.today }
    }
  ];

  return (
    <div 
      className="w-full max-w-6xl mx-auto px-4"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Welcome Section */}
      <div className="mb-12">
        <WelcomeMessage
          name={t.userName}
          time={getTimeBasedGreeting()}
          t={t}
          isRTL={isRTL}
        />
        
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {stats.map((stat, index) => (
            <StatsCard
              key={index}
              value={stat.value}
              label={stat.label}
              trend={stat.trend}
              isRTL={isRTL}
            />
          ))}
        </div>
      </div>

      {/* Menu Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {menuItems.map((item) => (
          <MenuCard
            key={item.view}
            icon={item.icon}
            title={item.title}
            description={item.description}
            onClick={() => onViewChange(item.view)}
            isRTL={isRTL}
          />
        ))}
      </div>

      {/* Quick Actions */}
      <div className={`mt-12 bg-white rounded-lg p-6 shadow-lg ${isRTL ? 'text-right' : 'text-left'}`}>
        <h3 className="text-lg font-bold mb-4">{t.quickActions.title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {t.quickActions.items.map((action, index) => (
            <button
              key={index}
              className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-gray-700"
            >
              {action}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;