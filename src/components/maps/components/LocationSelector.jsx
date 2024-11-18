import React, { useState, useEffect } from 'react';
import { Check, ChevronDown, Plus, MapPin } from 'lucide-react';
import AddressModal from './AddressModal';
import apiService from '../../../services/api';
import { useLanguage } from '../../../contexts/LanguageContext';

const LocationSelector = ({
  selectedAddresses = [],
  onAddressesChange,
  label,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { language } = useLanguage();
  const isRTL = language === 'he';

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await apiService.request('addresses', {
        method: 'GET'
      });
      setAddresses(response || []);
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    }
  };

  const toggleAddress = (address) => {
    const newSelection = selectedAddresses.includes(address)
      ? selectedAddresses.filter(a => a !== address)
      : [...selectedAddresses, address];
    onAddressesChange(newSelection);
  };

  const handleNewAddress = async (address) => {
    setIsLoading(true);
    try {
      await apiService.request('addresses', {
        method: 'POST',
        data: { address }
      });
      
      await fetchAddresses();
      onAddressesChange([...selectedAddresses, address]);
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
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 border rounded-md shadow-sm bg-white hover:bg-gray-50"
        >
          <div className="flex items-center gap-2 flex-1 min-h-[24px]">
            <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
            {selectedAddresses.length > 0 ? (
              <span className="block truncate">
                {selectedAddresses.length === 1 
                  ? selectedAddresses[0]
                  : `${selectedAddresses.length} addresses selected`}
              </span>
            ) : (
              <span className="text-gray-400">Select addresses</span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>

        {isOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-auto">
            {addresses.map((address, index) => (
              <div
                key={index}
                className="relative flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => toggleAddress(address)}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="block truncate">{address}</span>
                  {selectedAddresses.includes(address) && (
                    <Check className="h-4 w-4 text-blue-600" />
                  )}
                </div>
              </div>
            ))}
            
            {addresses.length > 0 && (
              <div className="px-3 py-2">
                <div className="border-t border-gray-200" />
              </div>
            )}
            
            <div
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2 text-blue-600"
              onClick={() => {
                setIsModalOpen(true);
                setIsOpen(false);
              }}
            >
              <Plus className="h-4 w-4" />
              Add new address
            </div>
          </div>
        )}
      </div>

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