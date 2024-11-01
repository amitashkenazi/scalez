// src/App.js
import React, { useState, useRef, useCallback } from 'react';
import Dashboard from './components/Dashboard';
import CustomerDashboard from './components/CustomerDashboard';
import NotificationsView from './components/NotificationsView';
import { CustomersTableView } from './components/customers';
import ScalesManagement from './components/ScalesManagement';
import SideMenu from './components/SideMenu';
import LandingPage from './components/LandingPage';
import ProductsView from './components/ProductsView';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import useScaleData from './hooks/useScaleData';
import { Menu as MenuIcon } from 'lucide-react';
import { translations } from './translations/translations';
import VendorsView from './components/vendors/VendorsView';


function AppContent() {
  const [selectedScaleIds, setSelectedScaleIds] = useState(null);
  const [activeView, setActiveView] = useState('landing');
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const { scales } = useScaleData();
  const { language } = useLanguage();
  const t = translations[language];
  
  // Touch handling for mobile
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
    
    // Adjust swipe direction based on language
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

  const handleCustomerSelect = (scaleIds) => {
    setSelectedScaleIds(scaleIds);
    setActiveView('customers');
  };

  const handleBackToCustomers = () => {
    setSelectedScaleIds(null);
  };

  const handleViewChange = (view) => {
    setActiveView(view);
    if (view === 'customers') {
      setSelectedScaleIds(null);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // RTL-aware styles
  const getMenuStyles = () => {
    const baseStyles = 'fixed top-0 h-full bg-gray-800 transition-all duration-300 ease-in-out w-64 z-40';
    if (language === 'he') {
      return `${baseStyles} ${isMenuOpen ? 'right-0' : '-right-64'}`;
    }
    return `${baseStyles} ${isMenuOpen ? 'left-0' : '-left-64'}`;
  };

  const getMainContentStyles = () => {
    const baseStyles = 'flex-1 transition-all duration-300 ease-in-out';
    if (language === 'he') {
      return `${baseStyles} ${isMenuOpen ? 'md:mr-64' : 'mr-0'}`;
    }
    return `${baseStyles} ${isMenuOpen ? 'md:ml-64' : 'ml-0'}`;
  };

  const getMenuButtonPosition = () => {
    const baseStyles = 'fixed top-4 z-50 p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 md:hidden';
    return language === 'he' ? `${baseStyles} right-4` : `${baseStyles} left-4`;
  };

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
        onClick={toggleMenu}
        className={getMenuButtonPosition()}
      >
        <MenuIcon size={24} />
      </button>

      {/* Menu */}
      <div ref={menuRef} className={getMenuStyles()}>
        <SideMenu 
          activeView={activeView} 
          onViewChange={handleViewChange} 
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
        <div className="p-6">
          {activeView === 'landing' && (
            <LandingPage onViewChange={handleViewChange} />
          )}
          {activeView === 'vendors' && (
              <VendorsView />
          )}
          {activeView === 'customers' && (
            selectedScaleIds ? (
              <>
                <button
                  onClick={handleBackToCustomers}
                  className={`mb-4 text-blue-600 hover:text-blue-800 font-medium flex items-center
                    ${language === 'he' ? 'flex-row-reverse' : ''}`}
                >
                  <span className={language === 'he' ? 'mr-2' : 'ml-2'}>
                    {t.backToCustomers}
                  </span>
                  {language === 'he' ? '→' : '←'}
                </button>
                <Dashboard selectedScaleIds={selectedScaleIds} />
              </>
            ) : (
              <CustomerDashboard onCustomerSelect={handleCustomerSelect} />
            )
          )}
          
          {activeView === 'notifications' && (
            <NotificationsView scales={scales} />
          )}
          
          {(activeView === 'dashboard' || activeView === 'allScales') && (
            <Dashboard selectedScaleIds={null} />
          )}

          {activeView === 'customersTable' && (
            <CustomersTableView />
          )}

          {activeView === 'scalesManagement' && (
            <ScalesManagement />
          )}
          {activeView === 'products' && (
            <ProductsView />
          )}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;