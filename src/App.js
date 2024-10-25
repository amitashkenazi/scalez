// Updated App.js
import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import CustomerDashboard from './components/CustomerDashboard';
import NotificationsView from './components/NotificationsView';
import SideMenu from './components/SideMenu';
import useScaleData from './hooks/useScaleData';

function App() {
  const [selectedScaleIds, setSelectedScaleIds] = useState(null);
  const [activeView, setActiveView] = useState('customers');
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

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SideMenu activeView={activeView} onViewChange={handleViewChange} />
      
      <div className="flex-1">
        {activeView === 'customers' ? (
          selectedScaleIds ? (
            <>
              <div className="p-6 max-w-4xl mx-auto">
                <button
                  onClick={handleBackToCustomers}
                  className="mb-4 text-blue-600 hover:text-blue-800 font-medium"
                >
                  ← Back to Customers
                </button>
              </div>
              <Dashboard selectedScaleIds={selectedScaleIds} />
            </>
          ) : (
            <CustomerDashboard onCustomerSelect={handleCustomerSelect} />
          )
        ) : (
          <NotificationsView scales={scales} />
        )}
      </div>
    </div>
  );
}

export default App;