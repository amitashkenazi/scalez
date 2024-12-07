// LoginForm.jsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations/translations';
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';

export const LoginForm = ({ onSuccess, onSwitch }) => {
    const { signIn } = useAuth();
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
        password: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await signIn(formData.email, formData.password);
            onSuccess();
        } catch (err) {
            console.error('Login error:', err);
            setError(err.message || t('signInError'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
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

            {error && (
                <div className="bg-red-50 border border-red-400 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <p className="text-red-700">{error}</p>
                    </div>
                </div>
            )}

            <button
                type="submit"
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                    disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={isLoading}
            >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isLoading ? t('loading') : t('signIn')}
            </button>

            <div className="text-center">
                <button
                    type="button"
                    onClick={() => onSwitch('register')}
                    className="text-sm text-blue-600 hover:text-blue-800"
                >
                    {t('dontHaveAccount')}
                </button>
            </div>
        </form>
    );
};
export default LoginForm;