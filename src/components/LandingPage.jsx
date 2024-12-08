import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';

import {
  Scale,
  ChevronRight,
  BarChart3,
  Bell,
  Smartphone,
  ArrowRight,
  Languages,
  CheckCircle2
} from 'lucide-react';
import ScaleBuyButton from './scaleBuyButton';
import FunOutOfStockMessage from './outOfStock';

const LandingPage = ({ onAuthClick }) => {
  const { language, toggleLanguage } = useLanguage();
  const [showMessage, setShowMessage] = useState(false);
  // Helper function to get translation
  const t = (key) => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return `Missing translation: ${key}`;
  };
  const isRTL = language === 'he';
  const features = [
    {
      icon: Scale,
      title: "Weight-Based Monitoring",
      description: "Accurate real-time inventory tracking using precision scales"
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      description: "Instant alerts when stock levels reach custom thresholds"
    },
    {
      icon: BarChart3,
      title: "Data Analytics",
      description: "Comprehensive reporting and trend analysis tools"
    },
    {
      icon: Smartphone,
      title: "Mobile Access",
      description: "Monitor your inventory from anywhere, anytime"
    }
  ];

  const useCases = [
    
    {
      title: "Warehouses",
      description: "Track inventory across multiple locations in real-time",
      metrics: ["99.9% inventory accuracy", "Automated reporting", "Multi-location support"]
    },
    {
      title: "Restaurants",
      description: "Monitor ingredient levels and automate reordering",
      metrics: ["Reduce waste by 30%", "Save 5 hours per week", "Prevent stockouts"]
    },
    {
      title: "Manufacturing",
      description: "Optimize production with precise material tracking",
      metrics: ["Just-in-time inventory", "Reduce carrying costs", "Streamline production"]
    }
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Nav Bar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Scale className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold">Quantifyz</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleLanguage}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center gap-2"
                type="button"
              >
                <Languages size={20} />
                {language === 'en' ? 'עברית' : 'English'}
              </button>
              <button
                onClick={onAuthClick}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                  transition-colors flex items-center gap-2"
              >
                {t('signIn')}
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl font-bold text-gray-900 mb-8">
              Quntifyz - Weight It
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Take control of your inventory with real-time weight-based monitoring. 
              Know exactly what you have, when you need more, and optimize your stock levels automatically.
            </p>
            <div className="flex justify-center items-center gap-4">
              <button
                onClick={onAuthClick}
                className="px-8 py-4 bg-blue-600 text-white rounded-lg text-lg 
                  hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                Get Started for Free
                <ArrowRight size={20} />
              </button>
              <ScaleBuyButton
                onClick={() => setShowMessage(true)}
                className="px-8 py-4 bg-green-600 text-white rounded-lg text-lg 
                  hover:bg-green-700 transition-colors flex items-center gap-2"
              />
            </div>
            {showMessage && <FunOutOfStockMessage onClose={() => setShowMessage(false)} />}
          </div>

          {/* Dashboard Preview Section */}
          <div className="mt-16 flex justify-center">
            <div className="w-full max-w-4xl rounded-lg shadow-2xl bg-white p-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" className="w-full h-auto">
                <rect width="800" height="400" fill="#F3F4F6" rx="8"/>
                <g transform="translate(20, 20)">
                  {/* Header */}
                  <rect width="760" height="60" fill="#FFFFFF" rx="6"/>
                  <rect x="20" y="20" width="120" height="20" fill="#E5E7EB" rx="4"/>
                  <circle cx="720" cy="30" r="15" fill="#E5E7EB"/>
                  
                  {/* Stats Cards */}
                  <g transform="translate(0, 80)">
                    {/* Card 1 */}
                    <rect width="180" height="100" fill="#FFFFFF" rx="6"/>
                    <rect x="20" y="20" width="80" height="16" fill="#E5E7EB" rx="4"/>
                    <rect x="20" y="50" width="120" height="24" fill="#60A5FA" rx="4"/>
                    
                    {/* Card 2 */}
                    <g transform="translate(200, 0)">
                      <rect width="180" height="100" fill="#FFFFFF" rx="6"/>
                      <rect x="20" y="20" width="80" height="16" fill="#E5E7EB" rx="4"/>
                      <rect x="20" y="50" width="120" height="24" fill="#34D399" rx="4"/>
                    </g>
                    
                    {/* Card 3 */}
                    <g transform="translate(400, 0)">
                      <rect width="180" height="100" fill="#FFFFFF" rx="6"/>
                      <rect x="20" y="20" width="80" height="16" fill="#E5E7EB" rx="4"/>
                      <rect x="20" y="50" width="120" height="24" fill="#F87171" rx="4"/>
                    </g>
                  </g>
                  
                  {/* Chart Area */}
                  <g transform="translate(0, 200)">
                    <rect width="760" height="160" fill="#FFFFFF" rx="6"/>
                    <polyline 
                      points="40,120 160,80 280,100 400,60 520,40 640,70 720,30"
                      stroke="#60A5FA"
                      fill="none"
                      strokeWidth="3"
                    />
                    <g fill="#6B7280" fontSize="12">
                      <circle cx="40" cy="120" r="4"/>
                      <circle cx="160" cy="80" r="4"/>
                      <circle cx="280" cy="100" r="4"/>
                      <circle cx="400" cy="60" r="4"/>
                      <circle cx="520" cy="40" r="4"/>
                      <circle cx="640" cy="70" r="4"/>
                      <circle cx="720" cy="30" r="4"/>
                    </g>
                  </g>
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-16">
            Everything you need to manage inventory efficiently
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="p-6 bg-gray-50 rounded-xl hover:shadow-lg transition-all">
                <feature.icon className="h-12 w-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Use Cases Section */}
      <div className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-16">
            Trusted by businesses of all sizes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-lg">
                <h3 className="text-2xl font-bold mb-4">{useCase.title}</h3>
                <p className="text-gray-600 mb-6">{useCase.description}</p>
                <ul className="space-y-3">
                  {useCase.metrics.map((metric, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-gray-700">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                      {metric}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-8">
            Ready to transform your inventory management?
          </h2>
          <button
            onClick={onAuthClick}
            className="px-8 py-4 bg-white text-blue-600 rounded-lg text-lg font-semibold 
              hover:bg-gray-100 transition-colors flex items-center gap-2 mx-auto"
          >
            Start Your Free Trial
            <ArrowRight size={20} />
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 text-white mb-4">
                <Scale className="h-6 w-6" />
                <span className="text-xl font-bold">Quantifyz</span>
              </div>
              <p className="text-sm">
                Smart inventory management through precision weight monitoring
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="#integrations" className="hover:text-white">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#about" className="hover:text-white">About Us</a></li>
                <li><a href="#careers" className="hover:text-white">Careers</a></li>
                <li><a href="#contact" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#privacy" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#terms" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p>© 2024 Quantifyz. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;