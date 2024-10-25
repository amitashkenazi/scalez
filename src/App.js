import React, { useState, useRef, useCallback } from 'react';
import Dashboard from './components/Dashboard';
import CustomerDashboard from './components/CustomerDashboard';
import NotificationsView from './components/NotificationsView';
import SideMenu from './components/SideMenu';
import useScaleData from './hooks/useScaleData';
import { Menu as MenuIcon } from 'lucide-react';

function App() {
  const [selectedScaleIds, setSelectedScaleIds] = useState(null);
  const [activeView, setActiveView] = useState('customers');
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const { scales } = useScaleData();
  
  // Touch handling
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const menuRef = useRef(null);
  const minSwipeDistance = 50; // Minimum distance for swipe to register

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
    
    // If we're swiping from near the left edge or the menu is open
    if (touchStartX.current < 50 || isMenuOpen) {
      // Prevent default scrolling
      e.preventDefault();
    }
  };

  const handleTouchEnd = useCallback(() => {
    if (!touchStartX.current || !touchEndX.current) return;

    const swipeDistance = touchEndX.current - touchStartX.current;
    
    // If swipe distance is greater than minimum and we're swiping from left edge
    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance < 0 && isMenuOpen) {
        // Swipe left - close menu
        setIsMenuOpen(false);
      } else if (swipeDistance > 0 && !isMenuOpen && touchStartX.current < 50) {
        // Swipe right from left edge - open menu
        setIsMenuOpen(true);
      }
    }
    
    touchStartX.current = null;
    touchEndX.current = null;
  }, [isMenuOpen]);

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

  return (
    <div 
      className="flex min-h-screen bg-gray-100"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Toggle Button */}
      <button
        onClick={toggleMenu}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 md:hidden"
      >
        <MenuIcon size={24} />
      </button>

      {/* Menu */}
      <div 
        ref={menuRef}
        className={`fixed top-0 left-0 h-full bg-gray-800 transition-all duration-300 ease-in-out ${
          isMenuOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full'
        } z-40`}
      >
        <SideMenu 
          activeView={activeView} 
          onViewChange={handleViewChange} 
        />
      </div>

      {/* Overlay to capture touches when menu is open on mobile */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main 
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isMenuOpen ? 'md:ml-64' : 'ml-0'
        }`}
      >
        <div className="p-6">
          {activeView === 'customers' ? (
            selectedScaleIds ? (
              <>
                <button
                  onClick={handleBackToCustomers}
                  className="mb-4 text-blue-600 hover:text-blue-800 font-medium"
                >
                  ← Back to Customers
                </button>
                <Dashboard selectedScaleIds={selectedScaleIds} />
              </>
            ) : (
              <CustomerDashboard onCustomerSelect={handleCustomerSelect} />
            )
          ) : (
            <NotificationsView scales={scales} />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;