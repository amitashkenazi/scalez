// src/components/pricing/PricingView.jsx
import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations/translations';
import { Check, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const PricingTier = ({ tier, isPopular, onSelect }) => {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${isPopular ? 'border-2 border-blue-500 relative' : ''}`}>
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm">
            Most Popular
          </span>
        </div>
      )}
      
      <div className="text-center">
        <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
        <p className="text-gray-600 mb-4">{tier.description}</p>
        
        <div className="mb-6">
          <span className="text-4xl font-bold">${tier.price}</span>
          {tier.price > 0 && <span className="text-gray-500">/user/month</span>}
        </div>
        
        <button
          onClick={() => onSelect(tier)}
          className={`w-full py-2 px-4 rounded-lg font-medium mb-6
            ${isPopular 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
        >
          {t.pricing.selectPlan}
        </button>
        
        <div className="space-y-3 text-left">
          {tier.features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2">
              {feature.included ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <X className="h-5 w-5 text-red-500" />
              )}
              <span>{feature.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const PricingView = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const t = translations[language];
  const isRTL = language === 'he';

  const tiers = [
    {
      name: 'Basic',
      description: 'Perfect for getting started',
      price: 0,
      features: [
        { text: 'Up to 5 users', included: true },
        { text: 'Scale monitoring', included: true },
        { text: 'Basic analytics', included: true },
        { text: 'Real-time notifications', included: true },
        { text: 'Route optimization', included: false },
        { text: 'Maps integration', included: false },
        { text: 'Order management', included: false },
        { text: 'Unlimited users', included: false },
      ]
    },
    {
      name: 'Advanced',
      description: 'Best for growing businesses',
      price: 20,
      features: [
        { text: 'Unlimited users', included: true },
        { text: 'Scale monitoring', included: true },
        { text: 'Advanced analytics', included: true },
        { text: 'Real-time notifications', included: true },
        { text: 'Route optimization', included: true },
        { text: 'Maps integration', included: true },
        { text: 'Order management', included: true },
        { text: 'Priority support', included: true },
      ]
    }
  ];

  const handleSelectPlan = (tier) => {
    // Here you would implement the actual subscription logic
    console.log('Selected tier:', tier);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">{t.pricing.title}</h1>
        <p className="text-xl text-gray-600">{t.pricing.subtitle}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {tiers.map((tier, index) => (
          <PricingTier
            key={tier.name}
            tier={tier}
            isPopular={index === 1}
            onSelect={handleSelectPlan}
          />
        ))}
      </div>

      <div className="mt-12 text-center">
        <h2 className="text-2xl font-bold mb-4">{t.pricing.faq.title}</h2>
        <div className="max-w-3xl mx-auto space-y-6 text-left">
          {t.pricing.faq.items.map((item, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold mb-2">{item.q}</h3>
              <p className="text-gray-600">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PricingView;
