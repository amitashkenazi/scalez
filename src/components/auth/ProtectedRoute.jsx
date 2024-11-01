// src/components/auth/ProtectedRoute.jsx
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AuthModal } from './AuthModal';

const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(!user);

  useEffect(() => {
    setShowAuthModal(!user);
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <>
      {user ? children : (
        <div className="flex flex-col items-center justify-center h-screen p-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Please sign in to access this page
          </h2>
          <p className="text-gray-600 mb-6">
            You need to be authenticated to view this content
          </p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Sign In
          </button>
        </div>
      )}
      
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
};

export default ProtectedRoute;