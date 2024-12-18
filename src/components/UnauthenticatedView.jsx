import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import LoginForm from './auth/LoginForm';
import RegisterForm from './auth/RegisterForm';
import VerifyEmailForm from './auth/VerifyEmailForm';
import { Scale, Languages } from 'lucide-react';
import LandingPage from './LandingPage';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const UnauthenticatedView = () => {
  const [view, setView] = useState('landing');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const { language, toggleLanguage } = useLanguage();
  const navigate = useNavigate(); 

  const t = (key) => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return `Missing translation: ${key}`;
  };

  // Add useEffect at the top level
  useEffect(() => {
    console.log('View state changed to:', view);
  }, [view]);

  const handleAuthClick = useCallback(() => {
    console.log('Setting view to login');
    console.log('Current view before:', view);
    setView('login');
  }, []);


  const handleRegisterSuccess = (email) => {
    setRegisteredEmail(email);
    setView('verify');
  };

  const handleLoginSuccess = () => {
    navigate('/dashboard');
  };

  const isRTL = language === 'he';

  // If we're showing the landing page
  if (view === 'landing') {
    console.log('Rendering landing page');
    return <LandingPage onAuthClick={handleAuthClick} />;
  }

  // Otherwise show the auth forms
  return (
    <div 
      className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 relative"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Language Selector */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
        >
          <Languages size={20} className="text-gray-600" />
          <span className="text-gray-700 font-medium">
            {language === 'en' ? 'עברית' : 'English'}
          </span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full">
          {/* Logo and Welcome Message */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="bg-blue-600 p-3 rounded-full">
                <Scale size={32} className="text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2 text-gray-900">
              {t('welcomeTitle')}
            </h1>
            <h2 className="text-xl font-semibold mb-2 text-gray-800">
              {t('welcomeBack')}
            </h2>
            <p className="text-gray-600">
              {view === 'login' 
                ? "Please sign in to your account to continue"
                : view === 'register'
                ? "Create an account to get started"
                : "Verify your email to continue"}
            </p>
          </div>

          {/* Auth Forms Container */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            {view === 'login' && (
              <LoginForm 
                onSuccess={handleLoginSuccess}
                onSwitch={() => setView('register')}
              />
            )}

            {view === 'register' && (
              <RegisterForm 
                onSuccess={handleRegisterSuccess}
                onSwitch={() => setView('login')}
              />
            )}

            {view === 'verify' && (
              <VerifyEmailForm 
                email={registeredEmail}
                onSuccess={() => setView('login')}
              />
            )}

            {/* Back to Landing button */}
            <button
              onClick={() => setView('landing')}
              className="mt-4 text-blue-600 hover:text-blue-800 text-sm"
            >
              ← Back to home
            </button>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>© 2024 Quantifyz. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnauthenticatedView;