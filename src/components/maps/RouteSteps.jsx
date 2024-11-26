import React, { useState } from 'react';
import { 
  Route, 
  Building2, 
  MapPin, 
  ChevronDown,
  ChevronRight,
  PackageCheck,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const RouteSteps = ({
  directionsResponse,
  selectedCustomers,
  startLocation,
  startAddress,
}) => {
  const [expandedSegment, setExpandedSegment] = useState(null);
  const { language } = useLanguage();
  const isRTL = language === 'he';

  console.log('Route Props:', { 
    directionsResponse, 
    selectedCustomers, 
    startLocation 
  });

  // Early return if we don't have required data
  if (!directionsResponse?.routes?.[0] || !Array.isArray(selectedCustomers) || !startLocation) {
    console.log('Missing required data for RouteSteps');
    return null;
  }

  const route = directionsResponse.routes[0];
  const legs = route?.legs || [];
  const waypointOrder = route?.waypoint_order || [];

  // Get customers in optimized order
  const orderedCustomers = waypointOrder.length > 0 
    ? waypointOrder.map(index => selectedCustomers[index])
    : selectedCustomers;

  console.log('Processed route data:', {
    legs: legs.length,
    orderedCustomers: orderedCustomers.length,
    waypointOrder
  });

  // Get the name of a stop based on index
  const getStopName = (index) => {
    if (index < 0) return 'Base Location';
    if (index >= orderedCustomers.length) return 'Base Location';
    return orderedCustomers[index]?.name || `Stop ${index + 1}`;
  };

  // Render driving instructions for a leg
  const renderLegInstructions = (leg, index) => {
    if (!leg?.steps) {
      console.log(`Missing leg data for index ${index}`);
      return null;
    }

    const fromName = getStopName(index - 1);
    const toName = getStopName(index);
    const isExpanded = expandedSegment === index;

    console.log(`Rendering leg ${index}:`, {
      fromName,
      toName,
      steps: leg.steps.length,
      isExpanded
    });

    return (
      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="flex items-center justify-between text-gray-600 mb-2">
          <div className="flex items-center gap-2">
            <Route className="h-4 w-4" />
            <span className="font-medium">
              Drive from {fromName} to {toName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>{leg.distance?.text || '0 km'}</span>
            <span>•</span>
            <span>{leg.duration?.text || '0 mins'}</span>
          </div>
        </div>

        <button
          onClick={() => setExpandedSegment(isExpanded ? null : index)}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          {isExpanded ? 'Hide' : 'Show'} detailed directions
        </button>

        {isExpanded && (
          <ol className="mt-3 space-y-2">
            {leg.steps.map((step, stepIndex) => (
              <li key={stepIndex} className="flex items-start gap-3">
                <div className="min-w-[24px] h-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm">
                  {stepIndex + 1}
                </div>
                <div className="flex-1">
                  <div className="text-sm">
                    {step.instructions?.replace(/<[^>]*>/g, '') || 'Continue to destination'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {step.distance?.text || '0 km'} • {step.duration?.text || '0 mins'}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    );
  };

  // Render a single stop
  const renderStop = (customer, index) => {
    if (!customer) {
      console.log(`Missing customer data for index ${index}`);
      return null;
    }

    return (
      <div className="border rounded-lg bg-white p-4">
        <div className="flex items-start gap-3">
          <div className="mt-1">
            <MapPin className="h-5 w-5 text-gray-600" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-lg">
              Stop {index + 1}: {customer.name || `Stop ${index + 1}`}
            </div>
            <div className="text-sm text-gray-600 mb-2">{customer.address || 'No address provided'}</div>
            
            {Array.isArray(customer.products) && customer.products.length > 0 && (
              <div className="space-y-2 mt-3">
                <div className="text-sm font-medium text-gray-700">Products to check:</div>
                {customer.products.map(product => (
                  <div
                    key={product.product_id || Math.random()}
                    className="flex justify-between items-center bg-gray-50 p-2 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <PackageCheck className="h-4 w-4 text-gray-500" />
                      <span>{product.name || 'Unnamed Product'}</span>
                    </div>
                    <span className="text-gray-500">No data</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 bg-white rounded-lg shadow-lg p-6">
      {/* Start Location */}
      <div className="border rounded-lg bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-1">
            <Building2 className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-lg">Start from Base</div>
            <div className="text-sm text-gray-600">{startAddress || 'Base Location'}</div>
          </div>
        </div>
      </div>

      {/* Ordered Stops */}
      {orderedCustomers.map((customer, index) => (
        <React.Fragment key={customer?.customer_id || index}>
          {/* Directions to this stop */}
          {legs[index] && renderLegInstructions(legs[index], index)}
          
          {/* Stop Details */}
          {renderStop(customer, index)}
        </React.Fragment>
      ))}

      {/* Return to Base */}
      {legs[legs.length - 1] && renderLegInstructions(legs[legs.length - 1], legs.length - 1)}

      <div className="border rounded-lg bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-1">
            <Building2 className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-lg">Return to Base</div>
            <div className="text-sm text-gray-600">{startAddress || 'Base Location'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteSteps;