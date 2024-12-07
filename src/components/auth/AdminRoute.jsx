// src/components/auth/AdminRoute.jsx

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AlertCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations/translations';

const AdminRoute = ({ children }) => {
  const { isAdmin, isLoading } = useAuth();
  const { language } = useLanguage();
  // Helper function to get translation
  const t = (key) => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return `Missing translation: ${key}`;
  };
  const isRTL = language === 'he';

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div 
        className="flex flex-col items-center justify-center h-64 p-6 text-center"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">
            Access Denied
          </h3>
          <p className="text-red-600">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default AdminRoute;