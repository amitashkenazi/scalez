// src/components/auth/LoginForm.jsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { VerifyEmailForm } from './VerifyEmailForm';


const LoginForm = ({ onSuccess, onSwitch }) => {
  const { signIn } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signIn(formData.email, formData.password);
      onSuccess();
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.code === 'UserNotConfirmedException'
          ? 'Please verify your email before logging in'
          : err.message || 'Failed to sign in'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <h2 className="text-3xl font-bold text-center mb-8">Sign In</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
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
            Password
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-400 rounded-lg p-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
            disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => onSwitch('register')}
            className="text-blue-600 hover:text-blue-800"
          >
            Don't have an account? Register
          </button>
        </div>
      </form>
    </div>
  );
};

// src/components/auth/RegisterForm.jsx
const RegisterForm = ({ onSuccess, onSwitch }) => {
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
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
      setError(err.message || 'Failed to register');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <h2 className="text-3xl font-bold text-center mb-8">Register</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Form fields similar to LoginForm */}
        {/* ... */}
      </form>
    </div>
  );
};

// src/components/auth/AuthModal.jsx
const AuthModal = ({ isOpen, onClose }) => {
  const [view, setView] = useState('login');
  const [registeredEmail, setRegisteredEmail] = useState('');

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
      <div className="bg-white rounded-lg p-8 w-full max-w-md m-4">
        {view === 'login' && (
          <LoginForm
            onSuccess={handleLoginSuccess}
            onSwitch={setView}
          />
        )}
        
        {view === 'register' && (
          <RegisterForm
            onSuccess={handleRegisterSuccess}
            onSwitch={setView}
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

export { AuthModal, LoginForm, RegisterForm };