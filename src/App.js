import React, { useState } from 'react';
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
    <div className="flex min-h-screen bg-gray-100">
      {/* Toggle Button */}
      <button
        onClick={toggleMenu}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700"
      >
        <MenuIcon size={24} />
      </button>

      {/* Menu */}
      <div 
        className={`fixed top-0 left-0 h-full bg-gray-800 transition-all duration-300 ease-in-out ${
          isMenuOpen ? 'w-64' : 'w-0'
        } overflow-hidden`}
      >
        <SideMenu 
          activeView={activeView} 
          onViewChange={handleViewChange} 
        />
      </div>

      {/* Main Content */}
      <main 
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isMenuOpen ? 'ml-64' : 'ml-16'
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