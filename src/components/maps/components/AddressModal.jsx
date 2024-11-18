import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { translations } from '../../../translations/translations';
import { 
  X, 
  MapPin, 
  Loader2, 
  ChevronDown,
  Check,
  Plus 
} from 'lucide-react';
import apiService from '../../../services/api';

const AddressModal = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [address, setAddress] = useState('');
  const { language } = useLanguage();
  const isRTL = language === 'he';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!address.trim()) return;
    
    try {
      await onSubmit(address.trim());
      setAddress(''); // Reset form after successful submission
    } catch (error) {
      console.error('Error submitting address:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Add New Address
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="space-y-4">
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                type="text"
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
                placeholder="Enter address"
                required
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !address.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Add Address
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export const LocationSelector = ({
  selectedAddresses = [],
  onAddressesChange,
  label,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
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
      setError('Failed to load addresses');
    }
  };

  const handleNewAddress = async (address) => {
    setIsLoading(true);
    try {
      // First save the address
      await apiService.request('addresses', {
        method: 'POST',
        body: JSON.stringify({ address })
      });
      
      // Refresh the addresses list
      await fetchAddresses();
      
      // Add the new address to selected addresses
      const updatedSelection = [...selectedAddresses, address];
      onAddressesChange(updatedSelection);
      
      setIsModalOpen(false);
      setError(null);
    } catch (error) {
      console.error('Failed to add address:', error);
      setError('Failed to add address');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAddress = (address) => {
    const newSelection = selectedAddresses.includes(address)
      ? selectedAddresses.filter(a => a !== address)
      : [...selectedAddresses, address];
    onAddressesChange(newSelection);
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
            {error && (
              <div className="px-3 py-2 text-sm text-red-600 bg-red-50">
                {error}
              </div>
            )}
            
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

export default AddressModal;