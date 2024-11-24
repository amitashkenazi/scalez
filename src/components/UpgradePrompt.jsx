// src/components/maps/UpgradePrompt.jsx
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { Map, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

const UpgradePrompt = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'he';

  return (
    <div className="p-6 max-w-7xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <Map className="h-16 w-16 text-gray-400" />
            <Lock className="h-8 w-8 text-blue-600 absolute -bottom-2 -right-2" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold mb-4">
          {t.upgrade.mapsFeatureTitle}
        </h2>
        
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          {t.upgrade.mapsFeatureDescription}
        </p>

        <Link
          to="/pricing"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg 
            hover:bg-blue-700 transition-colors font-medium"
        >
          {t.upgrade.viewPricingPlans}
        </Link>
      </div>
    </div>
  );
};

export default UpgradePrompt;
