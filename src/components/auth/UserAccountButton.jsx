import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations/translations';
import { LogOut, User, ChevronDown } from 'lucide-react';

const UserAccountButton = () => {
  const { user, signOut } = useAuth();
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  // Helper function to get translation
  // Safely check if the user exists and has a valid email
  const userName = user?.name || 'Guest';
  const userEmail = user?.email || 'No Email Provided';

  const t = (key) => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return `Missing translation: ${key}`;
  };
  const isRTL = language === 'he';

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.reload();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user) return null;

  // Get the most appropriate display name
const displayName = userEmail.length > 10 ? `${userEmail.substring(0, 10)}...` : userEmail;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors
          ${isRTL ? 'flex-row-reverse' : ''}`}
      >
        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
          <User className="w-5 h-5 text-gray-300" />
        </div>
        <span className="font-medium">{displayName}</span>
        <ChevronDown className={`w-4 h-4 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute ${isRTL ? 'right-0' : 'left-0'} mt-2 w-full bg-white rounded-lg shadow-lg py-2 z-50`}>
          {userEmail && (
            <div className="px-4 py-2 text-sm text-gray-600 border-b border-gray-100">
              {userEmail}
            </div>
          )}
          <button
            onClick={handleSignOut}
            className={`w-full px-4 py-2 text-red-600 hover:bg-gray-100 flex items-center gap-2
              ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
          >
            <LogOut className="w-4 h-4" />
            {t('signOut')}
          </button>
        </div>
      )}
    </div>
  );
};

export default UserAccountButton;