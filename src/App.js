import React, { useState, useRef, useCallback, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { MapProvider } from './contexts/MapContext';
import { AccountProvider } from './contexts/AccountContext';
import UnauthenticatedView from './components/UnauthenticatedView';
import ProductsView from './components/products/ProductsView';
import SharedProductsView from './components/products/SharedProductsView';
import CustomersTableView from './components/customers/CustomersTableView';
import ScalesManagement from './components/ScalesManagement';
import ProductsManagementView from './components/products/ProductsMngView';
import VendorsView from './components/vendors/VendorsView';
import InvoicesView from './components/invoices/InvoicesView';
import AdminRoute from './components/auth/AdminRoute';
import SideMenu from './components/SideMenu';
import IntegrationsView from './components/integrations/IntegrationsView';
import MyAccountView from './components/MyAccountView';
import { Menu as MenuIcon } from 'lucide-react';
import CustomersMapView from './components/maps/CustomersMapView';
import ScaleMonitor from './components/ScaleMonitor';
import ItemsView from './components/ItemsView';
import { GoogleOAuthProvider } from '@react-oauth/google';
import GoogleAuthCallback from './components/auth/GoogleAuthCallback';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate, 
  useNavigate, 
  useLocation 
} from 'react-router-dom';


function AppContent() {
  const { language } = useLanguage();
  const [activeView, setActiveView] = useState('products');
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const menuRef = useRef(null);
  const minSwipeDistance = 50;
  
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!touchStartX.current) return;
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStartX.current || !touchEndX.current) return;

    const swipeDistance = touchEndX.current - touchStartX.current;
    
    if (language === 'he') {
      if (Math.abs(swipeDistance) > minSwipeDistance) {
        if (swipeDistance > 0 && isMenuOpen) {
          setIsMenuOpen(false);
        } else if (swipeDistance < 0 && !isMenuOpen && touchStartX.current > window.innerWidth - 50) {
          setIsMenuOpen(true);
        }
      }
    } else {
      if (Math.abs(swipeDistance) > minSwipeDistance) {
        if (swipeDistance < 0 && isMenuOpen) {
          setIsMenuOpen(false);
        } else if (swipeDistance > 0 && !isMenuOpen && touchStartX.current < 50) {
          setIsMenuOpen(true);
        }
      }
    }
    
    touchStartX.current = null;
    touchEndX.current = null;
  }, [isMenuOpen, language]);
  
  const getMenuStyles = () => {
    const baseStyles = 'fixed top-0 h-full bg-gray-800 transition-all duration-300 ease-in-out w-64 z-40';
    if (language === 'he') {
      return `${baseStyles} ${isMenuOpen ? 'right-0' : '-right-64'}`;
    }
    return `${baseStyles} ${isMenuOpen ? 'left-0' : '-left-64'}`;
  };

  const getMainContentStyles = () => {
    const baseStyles = 'flex-1 transition-all duration-300 ease-in-out min-h-screen bg-gray-100';
    if (language === 'he') {
      return `${baseStyles} ${isMenuOpen ? 'md:mr-64' : 'mr-0'}`;
    }
    return `${baseStyles} ${isMenuOpen ? 'md:ml-64' : 'ml-0'}`;
  };

  const getMenuButtonPosition = () => {
    const baseStyles = 'fixed top-4 z-50 p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 md:hidden';
    return language === 'he' ? `${baseStyles} right-4` : `${baseStyles} left-4`;
  };

  const renderMainContent = () => {
    if (activeView === 'scalesManagement') {
      return (
        <div className="p-4">
          <ScalesManagement>
            {(selectedScaleId) => selectedScaleId && (
              <ScaleMonitor 
                scaleId={selectedScaleId}
                className="mt-4"
              />
            )}
          </ScalesManagement>
        </div>
      );
    }

    return (
      <>
        {activeView === 'products' && <ProductsView />}
        {activeView === 'customersTable' && <CustomersTableView />}
        {activeView === 'productsMng' && <ProductsManagementView />}
        {activeView === 'items' && <ItemsView />}  {/* Add this line */}
        {activeView === 'sharedProducts' && <SharedProductsView />}
        {activeView === 'myAccount' && <MyAccountView />}
        {activeView === 'invoices' && <InvoicesView />}
        {activeView === 'customersMap' && <CustomersMapView />}
        {activeView === 'integrations' && <IntegrationsView />}
        {activeView === 'auth/callback' && <GoogleAuthCallback />} 
        {activeView === 'vendors' && (
          <AdminRoute>
            <VendorsView />
          </AdminRoute>
        )}
      </>
    );
  };

  return (
    <div 
      className="flex min-h-screen bg-gray-100"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      dir={language === 'he' ? 'rtl' : 'ltr'}
    >
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={getMenuButtonPosition()}
      >
        <MenuIcon size={24} />
      </button>

      <div ref={menuRef} className={getMenuStyles()}>
        <SideMenu 
          activeView={activeView} 
          onViewChange={setActiveView}
        />
      </div>

      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      <main className={getMainContentStyles()}>
        {renderMainContent()}
      </main>
    </div>
  );
}

function AppWrapper() {
  return (
    <Router>
      <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
        <AuthProvider>
          <LanguageProvider>
            <AccountProvider>
              <MapProvider>
                <App />
              </MapProvider>
            </AccountProvider>
          </LanguageProvider>
        </AuthProvider>
      </GoogleOAuthProvider>
    </Router>
  );
}

function App() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      navigate('/dashboard');
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          user ? <Navigate to="/dashboard" replace /> : <UnauthenticatedView />
        } 
      />
      <Route 
        path="/dashboard/*" 
        element={
          <PrivateRoute>
            <AppContent />
          </PrivateRoute>
        } 
      />
      <Route path="/auth/callback" element={<GoogleAuthCallback />} />
    </Routes>
  );
}



// Update PrivateRoute to handle redirects
const PrivateRoute = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  
  // Wait for auth to initialize before deciding
  if (isLoading) {
    return <div>Loading...</div>; // Or your loading component
  }
  
  if (!user) {
    // Save the attempted URL to redirect back after login
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  
  return children;
};
export default AppWrapper;