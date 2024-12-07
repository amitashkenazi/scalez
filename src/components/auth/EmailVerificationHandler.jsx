import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations/translations';
import { Loader2, RefreshCw, AlertTriangle, Check } from 'lucide-react';

const EmailVerificationHandler = () => {
  const [status, setStatus] = useState('checking');
  const [error, setError] = useState(null);
  const { confirmSignUp, resendConfirmationCode } = useAuth();
  const { language } = useLanguage();
  // Helper function to get translation
  const t = (key) => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return `Missing translation: ${key}`;
  };
  const isRTL = language === 'he';

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Get verification parameters from URL
        const urlParams = new URLSearchParams(window.location.search);
        const email = urlParams.get('email');
        const code = urlParams.get('code');

        if (!email || !code) {
          throw new Error(t('missingVerificationParams'));
        }

        // Attempt to verify email
        await confirmSignUp(email, code);
        setStatus('success');
      } catch (err) {
        console.error('Verification error:', err);
        setStatus('error');
        setError(err.message);
      }
    };

    verifyEmail();
  }, [confirmSignUp, t]);

  const handleResendCode = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const email = urlParams.get('email');
      
      if (!email) {
        throw new Error(t('emailNotFound'));
      }

      setStatus('resending');
      await resendConfirmationCode(email);
      setStatus('resent');
    } catch (err) {
      console.error('Error resending code:', err);
      setError(err.message);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gray-100 p-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        {status === 'checking' && (
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-600 text-center">{t('verifyingEmail')}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('emailVerified')}</h2>
            <p className="text-gray-600 mb-6">{t('emailVerifiedDesc')}</p>
            <a 
              href="/"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {t('continueToApp')}
            </a>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('verificationFailed')}</h2>
            <p className="text-red-600 mb-6">{error}</p>
            {status !== 'resent' && (
              <button
                onClick={handleResendCode}
                disabled={status === 'resending'}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
              >
                {status === 'resending' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {t('resendingCode')}
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {t('requestNewCode')}
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {status === 'resent' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('newCodeSent')}</h2>
            <p className="text-gray-600 mb-6">{t('checkEmailForCode')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationHandler;