import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AlertCircle, ArrowLeft, Loader2, Mail } from 'lucide-react';

const ForgotPassword = ({ onBack, t }) => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await forgotPassword(email);
      setIsSuccess(true);
    } catch (err) {
      console.error('Forgot password error:', err);
      setError(err.message || 'Failed to send reset code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={16} />
          Back to login
        </button>
        <h2 className="text-2xl font-bold mt-4">{t('resetPassword')}</h2>
        <p className="text-gray-600 mt-2">
          Enter your email address and we'll send you a code to reset your password.
        </p>
      </div>

      {isSuccess ? (
        <div className="bg-green-50 border border-green-400 rounded-lg p-4">
          <p className="text-green-700">
            Reset code sent! Check your email for instructions.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('email')}
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
              <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-400 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
              disabled:bg-blue-400 flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLoading ? t('sendingResetCode') : t('sendResetCode')}
          </button>
        </form>
      )}
    </div>
  );
};

export default ForgotPassword;
