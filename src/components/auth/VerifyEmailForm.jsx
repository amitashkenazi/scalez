import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations/translations';
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';


export const VerifyEmailForm = ({ email, onSuccess }) => {
    const { confirmSignUp, resendConfirmationCode } = useAuth();
    const { language } = useLanguage();
    const t = translations[language];
    const isRTL = language === 'he';
  
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');
      setIsLoading(true);
  
      try {
        await confirmSignUp(email, code);
        onSuccess();
      } catch (err) {
        console.error('Verification error:', err);
        setError(err.message || t.verificationError);
      } finally {
        setIsLoading(false);
      }
    };
  
    const handleResendCode = async () => {
      setIsResending(true);
      setResendSuccess(false);
      setError('');
  
      try {
        await resendConfirmationCode(email);
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 3000);
      } catch (err) {
        console.error('Error resending code:', err);
        setError(err.message || t.errorResendingCode);
      } finally {
        setIsResending(false);
      }
    };
  
    return (
      <div className="w-full max-w-md mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
        <h2 className="text-3xl font-bold text-center mb-8">{t.verifyEmail}</h2>
        
        <p className="text-center text-gray-600 mb-6">
          {t.verificationEmailSent}
          <br />
          <span className="font-medium">{email}</span>
        </p>
  
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.verificationCode}
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="123456"
              required
            />
          </div>
  
          {error && (
            <div className="bg-red-50 border border-red-400 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}
  
          {resendSuccess && (
            <div className="bg-green-50 border border-green-400 rounded-lg p-3">
              <p className="text-green-700 text-sm">{t.codeSentSuccessfully}</p>
            </div>
          )}
  
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
              disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLoading ? t.verifying : t.verify}
          </button>
  
          <div className="text-center">
            <button
              type="button"
              onClick={handleResendCode}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:text-blue-400"
              disabled={isResending}
            >
              {isResending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t.resendingCode}
                </span>
              ) : (
                t.resendCode
              )}
            </button>
          </div>
        </form>
      </div>
    );
  };
  
  // Update the AuthModal to include registration
  export const AuthModal = ({ isOpen, onClose }) => {
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
  
    const handleVerificationSuccess = () => {
      setView('login');
    };
  
    if (!isOpen) return null;
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 w-full max-w-md m-4 max-h-[90vh] overflow-y-auto">
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
              onSuccess={handleVerificationSuccess}
            />
          )}
        </div>
      </div>
    );
  };