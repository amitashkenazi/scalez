import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations/translations';
import { LoginForm } from './LoginForm';  // Changed this line to use named import
import RegisterForm from './RegisterForm';
import { VerifyEmailForm } from './VerifyEmailForm';

const AuthModal = ({ isOpen, onClose }) => {
    const [view, setView] = useState('login');
    const [registeredEmail, setRegisteredEmail] = useState('');
    const { language } = useLanguage();
    const t = translations[language];
    const isRTL = language === 'he';

    const handleLoginSuccess = () => {
        onClose();
        window.location.reload();
    };

    const handleRegisterSuccess = (email) => {
        setRegisteredEmail(email);
        setView('verify');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div 
                className="bg-white rounded-lg p-8 w-full max-w-md m-4 max-h-[90vh] overflow-y-auto"
                dir={isRTL ? 'rtl' : 'ltr'}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">
                        {view === 'login' ? t.signIn : 
                         view === 'register' ? t.register : 
                         t.verifyEmail}
                    </h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X size={24} />
                    </button>
                </div>

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
            </div>
        </div>
    );
};

export default AuthModal;