import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

const GoogleAuthCallback = () => {
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);
  const { signInWithGoogle } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (!code) {
          setStatus('error');
          setError('No authorization code found in the URL');
          return;
        }

        // Post the code to your backend to exchange for tokens
        const response = await fetch('/api/auth/google/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code })
        });

        if (!response.ok) {
          throw new Error('Failed to authenticate with Google');
        }

        const authData = await response.json();
        
        // Complete the sign in process using the tokens
        await signInWithGoogle(authData);

        setStatus('success');
        
        // Redirect to main page after short delay
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);

      } catch (err) {
        console.error('Google auth callback error:', err);
        setStatus('error');
        setError(err.message || 'Failed to complete Google authentication');
      }
    };

    handleCallback();
  }, [signInWithGoogle]);

  const renderContent = () => {
    switch (status) {
      case 'processing':
        return (
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <h2 className="text-xl font-semibold mb-2">Completing Sign In</h2>
            <p className="text-gray-600">Please wait while we complete your sign in...</p>
          </div>
        );

      case 'success':
        return (
          <div className="flex flex-col items-center">
            <CheckCircle className="w-12 h-12 text-green-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sign In Successful!</h2>
            <p className="text-gray-600">Redirecting you to the dashboard...</p>
          </div>
        );

      case 'error':
        return (
          <div className="flex flex-col items-center">
            <AlertCircle className="w-12 h-12 text-red-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Authentication Failed</h2>
            <p className="text-red-600 text-center">{error}</p>
            <button
              onClick={() => window.location.href = '/'}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Return to Login
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        {renderContent()}
      </div>
    </div>
  );
};

export default GoogleAuthCallback;