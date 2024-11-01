import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations/translations';
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';

export const RegisterForm = ({ onSuccess, onSwitch }) => {
  const { signUp } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'he';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Password validation
  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];
    if (password.length < minLength) errors.push(t.passwordTooShort || 'Password must be at least 8 characters');
    if (!hasUpperCase) errors.push(t.passwordNeedsUpper || 'Password must contain an uppercase letter');
    if (!hasLowerCase) errors.push(t.passwordNeedsLower || 'Password must contain a lowercase letter');
    if (!hasNumbers) errors.push(t.passwordNeedsNumber || 'Password must contain a number');
    if (!hasSpecialChar) errors.push(t.passwordNeedsSpecial || 'Password must contain a special character');

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate form
    if (!formData.email || !formData.password || !formData.name) {
      setError(t.allFieldsRequired || 'All fields are required');
      return;
    }

    // Validate password
    const passwordErrors = validatePassword(formData.password);
    if (passwordErrors.length > 0) {
      setError(passwordErrors.join('\n'));
      return;
    }

    // Check password confirmation
    if (formData.password !== formData.confirmPassword) {
      setError(t.passwordsDontMatch || 'Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await signUp(formData.email, formData.password, {
        email: formData.email,
        name: formData.name
      });
      onSuccess(formData.email);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || t.signUpError || 'Failed to register');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      <h2 className="text-3xl font-bold text-center mb-8">{t.register}</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.name}
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Email field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.email}
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Password field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.password}
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/2 transform -translate-y-1/2 right-3 text-gray-500"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {/* Confirm Password field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.confirmPassword}
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute top-1/2 transform -translate-y-1/2 right-3 text-gray-500"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="bg-red-50 border border-red-400 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div className="text-red-700 text-sm whitespace-pre-line">{error}</div>
            </div>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
            disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isLoading ? t.registering || 'Registering...' : t.createAccount}
        </button>

        {/* Switch to login */}
        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => onSwitch('login')}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {t.alreadyHaveAccount}
          </button>
        </div>
      </form>
    </div>
  );
};