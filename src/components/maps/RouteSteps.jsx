import React, { useState } from 'react';
import { 
    Route, 
    Building2, 
    MapPin, 
    ChevronDown,
    ChevronRight
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations/translations';
import AddressModal from './components/AddressModal';
import RouteSummary from './components/RouteSummary';
import LocationSelector from './components/LocationSelector';


const DrivingInstructions = ({ leg, expanded, onToggle }) => {
  if (!leg) return null;

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between text-gray-600 mb-2">
        <div className="flex items-center gap-2">
          <Route className="h-4 w-4" />
          <span className="font-medium">Drive to next stop</span>
        </div>
        <div className="flex items-center gap-2">
          <span>{leg.distance?.text || '0 km'}</span>
          <span>•</span>
          <span>{leg.duration_in_traffic?.text || leg.duration?.text || '0 mins'}</span>
        </div>
      </div>

      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        {expanded ? 'Hide' : 'Show'} detailed directions
      </button>

      {expanded && leg.steps && (
        <ol className="mt-3 space-y-2">
          {leg.steps.map((step, stepIndex) => (
            <li key={stepIndex} className="flex items-start gap-3">
              <div className="min-w-[24px] h-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm">
                {stepIndex + 1}
              </div>
              <div>
                <div
                  className="text-sm"
                  dangerouslySetInnerHTML={{ __html: step.instructions }}
                />
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

const StopPoint = ({ customer, index, language }) => {
  const [hebrewName, englishName] = customer.name?.split(' - ') || ['', ''];
  const displayName = language === 'he' ? hebrewName : englishName;

  return (
    <div className="border rounded-lg bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="mt-1">
          <MapPin className="h-5 w-5 text-gray-600" />
        </div>
        <div className="flex-1">
          <div className="font-medium text-lg">
            Stop {index}: {displayName}
          </div>
          <div className="text-sm text-gray-600 mb-2">{customer.address}</div>

          {customer.products && customer.products.length > 0 && (
            <div className="space-y-2 mt-3">
              <div className="text-sm font-medium text-gray-700">Products to check:</div>
              {customer.products.map(product => (
                <div
                  key={product.product_id}
                  className="flex justify-between items-center bg-gray-50 p-2 rounded"
                >
                  <span>{product.name}</span>
                  <span className={`font-medium ${!product.measurement?.weight ? 'text-gray-500' :
                    product.measurement.weight >= product.thresholds?.upper ? 'text-green-600' :
                      product.measurement.weight >= product.thresholds?.lower ? 'text-orange-500' :
                        'text-red-600'
                    }`}>
                    {product.measurement?.weight ?
                      `${Math.round(product.measurement.weight)} kg` :
                      'No data'
                    }
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const RouteSteps = ({
    directionsResponse,
    selectedCustomers,
    setSelectedCustomers,
    startLocation,
    startAddress,
    endLocation,
    endAddress,
    onAddressesChange,
    selectedAddresses = []
  }) => {
    const [expandedLeg, setExpandedLeg] = useState(null);
    const { language } = useLanguage();
    const t = translations[language];
    const isRTL = language === 'he';
    const startTime = new Date();
  
    if (!directionsResponse || !selectedCustomers?.length || !startLocation) return null;
  
    const route = directionsResponse.routes[0];
    const legs = route?.legs || [];
    const waypointOrder = route?.waypoint_order || [];
    const orderedCustomers = waypointOrder.map(index => selectedCustomers[index]);
  
    const totalStats = legs.reduce((acc, leg) => ({
      distance: acc.distance + (leg?.distance?.value || 0),
      duration: acc.duration + (leg?.duration_in_traffic?.value || leg?.duration?.value || 0)
    }), { distance: 0, duration: 0 });
  
    return (
      <div className="space-y-6">
        <RouteSummary
          totalStats={totalStats}
          selectedCustomers={selectedCustomers}
          startTime={startTime}
        />
  
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="space-y-4">
            {/* Location selector */}
            <div className="grid grid-cols-1 gap-4 mb-6">
              <LocationSelector
                label="Add Addresses to Route"
                selectedAddresses={selectedAddresses}
                onAddressesChange={onAddressesChange}
              />
            </div>
  
            {/* Starting point */}
            <div className="border rounded-lg bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-lg">Start from Base</div>
                  <div className="text-sm text-gray-600">{startAddress}</div>
                </div>
              </div>
            </div>
  
            {/* Stops and Driving Instructions */}
            {orderedCustomers.map((customer, index) => (
              <React.Fragment key={customer.customer_id}>
                <DrivingInstructions
                  leg={legs[index]}
                  expanded={expandedLeg === index}
                  onToggle={() => setExpandedLeg(expandedLeg === index ? null : index)}
                />
                
                <StopPoint 
                  customer={customer} 
                  index={index + 1}
                  language={language}
                />
              </React.Fragment>
            ))}
  
            {/* Final leg back to base */}
            <DrivingInstructions
              leg={legs[legs.length - 1]}
              expanded={expandedLeg === legs.length - 1}
              onToggle={() => setExpandedLeg(expandedLeg === legs.length - 1 ? null : legs.length - 1)}
            />
  
            {/* Return to Base */}
            <div className="border rounded-lg bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-lg">Return to Base</div>
                  <div className="text-sm text-gray-600">
                    {endAddress || startAddress}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  export default RouteSteps;