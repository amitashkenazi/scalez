import React, { useState } from 'react';
import { ChevronDown, MapPin, Plus } from 'lucide-react';
import AddressModal from './AddressModal';
import apiService from '../../../services/api';
import { useLanguage } from '../../../contexts/LanguageContext';

const LocationSelector = ({
  value,
  onChange,
  label,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { language } = useLanguage();
  const isRTL = language === 'he';

  React.useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await apiService.request('vendors/addresses', {
        method: 'GET'
      });
      setAddresses(response || []);
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    }
  };

  const handleAddressSelect = (address) => {
    onChange(address);
    setIsOpen(false);
  };

  const handleNewAddress = async (address) => {
    setIsLoading(true);
    try {
      // Add the new address to the server
      await apiService.request('vendors/addresses', {
        method: 'POST',
        data: { address }
      });
      
      // Refresh the addresses list
      await fetchAddresses();
      
      // Select the new address
      onChange(address);
      
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to add address:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 border rounded-md shadow-sm bg-white hover:bg-gray-50"
      >
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-gray-400" />
          <span className="block truncate">
            {value || 'Select address'}
          </span>
        </div>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg">
          <ul className="py-1 max-h-60 overflow-auto">
            {addresses.map((address, index) => (
              <li
                key={index}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleAddressSelect(address)}
              >
                {address}
              </li>
            ))}
            
            {addresses.length > 0 && (
              <li className="px-3 py-2">
                <div className="border-t border-gray-200" />
              </li>
            )}
            
            <li
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2 text-blue-600"
              onClick={() => {
                setIsModalOpen(true);
                setIsOpen(false);
              }}
            >
              <Plus className="h-4 w-4" />
              Add new address
            </li>
          </ul>
        </div>
      )}

      <AddressModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleNewAddress}
        isLoading={isLoading}
      />
    </div>
  );
};

export default LocationSelector;