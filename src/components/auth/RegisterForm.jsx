// RegisterForm.jsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations/translations';
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';

export const RegisterForm = ({ onSwitch }) => {
    const { signUp } = useAuth();
    const { language } = useLanguage();
    // Helper function to get translation
    const t = (key) => {
        if (translations[key] && translations[key][language]) {
        return translations[key][language];
        }
        return `Missing translation: ${key}`;
    };

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
    const [registrationSuccess, setRegistrationSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError(t('passwordsDontMatch'));
            return;
        }

        setIsLoading(true);

        try {
            await signUp(formData.email, formData.password, {
                email: formData.email,
                name: formData.name
            });
            
            // Show success message
            setRegistrationSuccess(true);
            
            // Wait 2 seconds before switching to login
            setTimeout(() => {
                onSwitch('login');
            }, 2000);

        } catch (err) {
            console.error('Registration error:', err);
            setError(err.message || t('signUpError'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {registrationSuccess && (
                <div className="bg-green-50 border border-green-400 rounded-lg p-4 mb-4">
                    <p className="text-green-700">{t('registrationSuccess')}</p>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('name')}
                </label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={isLoading || registrationSuccess}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('email')}
                </label>
                <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={isLoading || registrationSuccess}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('password')}
                </label>
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                        disabled={isLoading || registrationSuccess}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute top-1/2 transform -translate-y-1/2 right-3 text-gray-500"
                        disabled={isLoading || registrationSuccess}
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('confirmPassword')}
                </label>
                <div className="relative">
                    <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                        disabled={isLoading || registrationSuccess}
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute top-1/2 transform -translate-y-1/2 right-3 text-gray-500"
                        disabled={isLoading || registrationSuccess}
                    >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-400 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <div className="text-red-700 text-sm">{error}</div>
                    </div>
                </div>
            )}

            <button
                type="submit"
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                    disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={isLoading || registrationSuccess}
            >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isLoading ? t('registering') : t('createAccount')}
            </button>

            {!registrationSuccess && (
                <div className="text-center">
                    <button
                        type="button"
                        onClick={() => onSwitch('login')}
                        className="text-sm text-blue-600 hover:text-blue-800"
                        disabled={isLoading}
                    >
                        {t('alreadyHaveAccount')}
                    </button>
                </div>
            )}
        </form>
    );
};

export default RegisterForm;