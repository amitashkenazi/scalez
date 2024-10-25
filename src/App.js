import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import CustomerDashboard from './components/CustomerDashboard';

function App() {
  const [selectedScaleIds, setSelectedScaleIds] = useState(null);

  const handleCustomerSelect = (scaleIds) => {
    setSelectedScaleIds(scaleIds);
  };

  const handleBackToCustomers = () => {
    setSelectedScaleIds(null);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {selectedScaleIds ? (
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
      )}
    </div>
  );
}

export default App;