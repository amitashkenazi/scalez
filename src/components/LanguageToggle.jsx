import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Languages } from 'lucide-react';

const LanguageToggle = () => {
  const { language, toggleLanguage } = useLanguage();
  
  return (
    <button
      onClick={toggleLanguage}
      className="fixed top-4 right-4 z-50 p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 flex items-center gap-2"
    >
      <Languages size={24} />
      <span>{language === 'en' ? 'עברית' : 'English'}</span>
    </button>
  );
};

export default LanguageToggle;