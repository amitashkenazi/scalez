import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations/translations';
import { Loader2, AlertCircle, RefreshCw, Map, List } from 'lucide-react';
import apiService from '../../services/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const CustomersMapView = () => {
  const [mapInstance, setMapInstance] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapContainer, setMapContainer] = useState(null);
  
  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'he';

  // Set up map container ref
  useEffect(() => {
    console.log('Setting up map container ref...');
    const container = document.getElementById('map');
    if (container) {
      setMapContainer(container);
      console.log('Map container found:', container);
    }
  }, []);

  // Initialize map
  useEffect(() => {
    console.log('Map initialization effect running...');
    console.log('Current mapInstance:', mapInstance);
    console.log('Current mapContainer:', mapContainer);

    if (!mapInstance && mapContainer) {
      console.log('Initializing new map...');
      
      // Set up default icon
      if (!L.Icon.Default.imagePath) {
        L.Icon.Default.imagePath = 'https://unpkg.com/leaflet@1.9.4/dist/images/';
      }

      try {
        // Create map instance
        const map = L.map(mapContainer, {
          center: [32.0853, 34.7818],
          zoom: 13,
          preferCanvas: true
        });

        console.log('Map created:', map);

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Force a map invalidation and redraw
        setTimeout(() => {
          map.invalidateSize();
          console.log('Map size invalidated');
        }, 100);

        setMapInstance(map);
        console.log('Map instance set to state');
      } catch (err) {
        console.error('Error initializing map:', err);
        setError('Failed to initialize map');
      }
    }

    return () => {
      if (mapInstance) {
        console.log('Cleaning up map...');
        mapInstance.remove();
        setMapInstance(null);
      }
    };
  }, [mapContainer]);

  // Fetch and display customers
  useEffect(() => {
    console.log('Customer fetch effect running...');
    console.log('Current mapInstance:', mapInstance);

    const fetchCustomers = async () => {
      try {
        console.log('Fetching customers...');
        const response = await apiService.getCustomers();
        
        const customersWithCoords = response.map(customer => ({
          ...customer,
          lat: 32.0853 + (Math.random() - 0.5) * 0.1,
          lng: 34.7818 + (Math.random() - 0.5) * 0.1
        }));
        
        console.log('Customers fetched:', customersWithCoords);
        setCustomers(customersWithCoords);

        if (mapInstance && customersWithCoords.length > 0) {
          console.log('Adding markers to map...');
          
          // Clear existing markers
          mapInstance.eachLayer((layer) => {
            if (layer instanceof L.Marker) {
              mapInstance.removeLayer(layer);
            }
          });

          // Add new markers
          const bounds = L.latLngBounds([]);
          customersWithCoords.forEach(customer => {
            const marker = L.marker([customer.lat, customer.lng])
              .addTo(mapInstance)
              .bindPopup(customer.name);
            bounds.extend([customer.lat, customer.lng]);
          });

          // Fit bounds
          mapInstance.fitBounds(bounds, { padding: [50, 50] });
          console.log('Markers added and bounds fit');
        }
      } catch (err) {
        console.error('Error fetching customers:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (mapInstance) {
      fetchCustomers();
    }
  }, [mapInstance]);

  // Handle map container sizing
  useLayoutEffect(() => {
    if (mapInstance) {
      console.log('Handling map resize...');
      mapInstance.invalidateSize();
    }
  }, [mapInstance]);

  return (
    <div className="p-6 max-w-7xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Map className="h-6 w-6" />
              Customers Map
            </h2>
            <p className="text-gray-600 mt-1">View customer locations</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-400 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <List className="h-5 w-5" />
              Customers ({customers.length})
            </h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {customers.map(customer => (
                <div 
                  key={customer.customer_id}
                  className="p-4 rounded-lg cursor-pointer hover:bg-gray-50 border"
                  onClick={() => {
                    if (mapInstance && customer.lat && customer.lng) {
                      mapInstance.setView([customer.lat, customer.lng], 15);
                    }
                  }}
                >
                  <div className="font-medium">{customer.name}</div>
                  <div className="text-sm text-gray-600">{customer.address}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <div 
              id="map" 
              style={{ 
                height: '600px',
                width: '100%',
                position: 'relative',
                zIndex: 1
              }}
              className="rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomersMapView;