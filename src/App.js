// src/App.js
import React, { useState, useRef, useCallback } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import UnauthenticatedView from './components/UnauthenticatedView';
import ProductsView from './components/products/ProductsView';
import CustomersTableView from './components/customers/CustomersTableView';
import ScalesManagement from './components/ScalesManagement';
import ProductsManagementView from './components/ProductsMngView';
import VendorsView from './components/vendors/VendorsView';
import AdminRoute from './components/auth/AdminRoute';
import SideMenu from './components/SideMenu';
import LandingPage from './components/LandingPage';
import SharedProductsView from './components/SharedProductsView';
import { Menu as MenuIcon } from 'lucide-react';

function AppContent() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [activeView, setActiveView] = useState('products');
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const menuRef = useRef(null);
  const minSwipeDistance = 50;
  
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
    if (touchStartX.current < 50 || isMenuOpen) {
      e.preventDefault();
    }
  };

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

  // RTL-aware styles
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

  if (!user) {
    return <UnauthenticatedView />;
  }

  return (
    <div 
      className="flex min-h-screen bg-gray-100"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      dir={language === 'he' ? 'rtl' : 'ltr'}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={getMenuButtonPosition()}
      >
        <MenuIcon size={24} />
      </button>

      {/* Menu */}
      <div ref={menuRef} className={getMenuStyles()}>
        <SideMenu 
          activeView={activeView} 
          onViewChange={setActiveView}
        />
      </div>

      {/* Mobile Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className={getMainContentStyles()}>
        {activeView === 'home' && <LandingPage onViewChange={setActiveView} />}
        {activeView === 'products' && <ProductsView />}
        {activeView === 'customersTable' && <CustomersTableView />}
        {activeView === 'scalesManagement' && <ScalesManagement />}
        {activeView === 'productsMng' && <ProductsManagementView />}
        {activeView === 'sharedProducts' && <SharedProductsView />}
        {activeView === 'vendors' && (
          <AdminRoute>
            <VendorsView />
          </AdminRoute>
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;