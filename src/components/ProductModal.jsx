// src/components/ProductModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { X, Loader2, AlertCircle, Search, Plus } from 'lucide-react';
import apiService from '../services/api';
import CustomerModal from './CustomerModal';
import ScaleModal from './ScaleModal';

const ProductModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  customers, 
  initialData = null,
  preSelectedCustomerName = null,
  onCustomerAdded 
}) => {
  const itemsCache = useRef(null);
  
  const [formData, setFormData] = useState({
    name: '',
    customer_id: '',
    customer_name: '',
    scale_id: '',
    item_id: '',
    thresholds: {
      upper: 40,
      lower: 8
    }
  });

  const [availableItems, setAvailableItems] = useState([]);
  const [availableScales, setAvailableScales] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isScaleModalOpen, setIsScaleModalOpen] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [productId, setProductId] = useState(null);

  const { language } = useLanguage();
  // Helper function to get translation
  const t = (key) => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return `Missing translation: ${key}`;
  };
  const isRTL = language === 'he';

  const fetchItems = async () => {
    try {
      // If we have cached items, use them
      if (itemsCache.current) {
        console.log('Using cached items');
        setAvailableItems(itemsCache.current);
        
        // Set selected item if we have initialData
        if (initialData?.item_id) {
          const matchingItem = itemsCache.current.find(
            item => item.external_id === initialData.item_id // Changed here
          );
          if (matchingItem) {
            setSelectedItem(matchingItem);
            setItemSearchQuery(matchingItem.name);
          }
        }
        return;
      }

      // If no cache, fetch from server
      console.log('Fetching items from server');
      const response = await apiService.request('items', {
        method: 'GET'
      });
      
      itemsCache.current = response;
      setAvailableItems(response);
      
      // Set selected item if we have initialData
      if (initialData?.item_id && response) {
        const matchingItem = response.find(
          item => item.external_id === initialData.item_id // Changed here as well, just to be consistent
        );
        if (matchingItem) {
          setSelectedItem(matchingItem);
          setItemSearchQuery(matchingItem.name);
        }
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      setErrors(prev => ({ ...prev, items: 'Error loading items' }));
    }
  };

  // Fetch available items and scales when modal opens
  useEffect(() => {
    const fetchScales = async () => {
      try {
        const response = await apiService.getScales();
        setAvailableScales(response);
      } catch (error) {
        console.error('Error fetching scales:', error);
        setErrors(prev => ({ ...prev, scales: 'Error loading scales' }));
      }
    };

    if (isOpen) {
      fetchItems();
      fetchScales();
    }
  }, [isOpen, initialData]);

  // Initialize or reset form data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Find customer either by preSelectedCustomerName or from initialData
        let customer = null;
        if (preSelectedCustomerName) {
          customer = customers.find(c => {
            const [hebrewName, englishName] = c.name.split(' - ');
            return hebrewName === preSelectedCustomerName || englishName === preSelectedCustomerName;
          });
        } else if (initialData.customer_id) {
          customer = customers.find(c => c.customer_id === initialData.customer_id);
        }

        setFormData({
          name: initialData.name || '',
          customer_id: customer?.customer_id || initialData.customer_id || '',
          customer_name: customer?.name || initialData.customer_name || '',
          scale_id: initialData.scale_id || '',
          item_id: initialData.item_id || '',
          thresholds: {
            upper: initialData.thresholds?.upper || 40,
            lower: initialData.thresholds?.lower || 8
          }
        });

        setProductId(initialData.product_id);
        
        if (customer) {
          setSelectedCustomer(customer);
          setCustomerSearchQuery(customer.name);
        }
      } else {
        setFormData({
          name: '',
          customer_id: '',
          customer_name: '',
          scale_id: '',
          item_id: '',
          thresholds: {
            upper: 40,
            lower: 8
          }
        });
        setSelectedItem(null);
        setSelectedCustomer(null);
        setCustomerSearchQuery('');
        setItemSearchQuery('');
      }
      setErrors({});
    }
  }, [isOpen, initialData, customers, preSelectedCustomerName]);

  // Handle clicks outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setShowCustomerDropdown(false);
        setShowItemDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = t('productNameRequired') || 'Product name is required';
    }

    if (!formData.customer_id) {
      newErrors.customer_id = t('customerRequired') || 'Customer is required';
    }

    const upperThreshold = Number(formData.thresholds.upper);
    const lowerThreshold = Number(formData.thresholds.lower);

    if (isNaN(upperThreshold) || isNaN(lowerThreshold)) {
      newErrors.thresholds = t('invalidThresholds') || 'Invalid thresholds';
    } else if (upperThreshold <= lowerThreshold) {
      newErrors.thresholds = t('thresholdError') || 'Upper threshold must be greater than lower threshold';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const dataToSubmit = {
        ...formData,
        product_id: productId,
        name: formData.name.trim(),
        thresholds: {
          upper: Number(formData.thresholds.upper),
          lower: Number(formData.thresholds.lower)
        }
      };

      await onSubmit(dataToSubmit);
      onClose();
    } catch (err) {
      console.error('Submission error:', err);
      setErrors({ submit: err.message || t('failedToSaveProduct') || 'Failed to save product' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setFormData(prev => ({
      ...prev,
      customer_id: customer.customer_id,
      customer_name: customer.name
    }));
    setCustomerSearchQuery(customer.name);
    setShowCustomerDropdown(false);
  };

  const handleItemSelect = (item) => {
    setSelectedItem(item);
    setFormData(prev => ({
      ...prev,
      item_id: item.item_id,
      name: item.name
    }));
    setItemSearchQuery(item.name);
    setShowItemDropdown(false);
  };

  const handleScaleChange = (e) => {
    const selectedValue = e.target.value;
    
    if (selectedValue === 'new') {
      setIsScaleModalOpen(true);
      return;
    }

    setFormData(prevData => ({
      ...prevData,
      scale_id: selectedValue
    }));
  };

  const filteredCustomers = customerSearchQuery
    ? customers.filter(customer =>
        customer.name.toLowerCase().includes(customerSearchQuery.toLowerCase())
      )
    : customers;

  const filteredItems = itemSearchQuery
    ? availableItems.filter(item =>
        item.name.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
        item.itemCode?.toLowerCase().includes(itemSearchQuery.toLowerCase())
      )
    : availableItems;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            {initialData ? t('updateProduct') || 'Update Product' : t('addProduct') || 'Add Product'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Item Selection */}
          <div className="relative dropdown-container">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('selectItem') || 'Select Item'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={itemSearchQuery}
                onChange={(e) => {
                  setItemSearchQuery(e.target.value);
                  setShowItemDropdown(true);
                  if (!e.target.value) {
                    setSelectedItem(null);
                    setFormData(prev => ({
                      ...prev,
                      item_id: '',
                      name: ''
                    }));
                  }
                }}
                onFocus={() => setShowItemDropdown(true)}
                placeholder={t('searchItems') || 'Search items'}
                className="w-full p-2 pr-10 border rounded-lg"
              />
              <Search className="absolute right-3 top-2.5 text-gray-400" size={20} />
            </div>
            {showItemDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredItems.map(item => (
                  <div
                    key={item.item_id}
                    onClick={() => handleItemSelect(item)}
                    className={`p-2 cursor-pointer ${
                      selectedItem?.item_id === item.item_id 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {item.name} ({item.itemCode})
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('productName') || 'Product Name'}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full p-2 border rounded-lg ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Customer Selection */}
          <div className="relative dropdown-container">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('customer') || 'Customer'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={customerSearchQuery}
                onChange={(e) => {
                  setCustomerSearchQuery(e.target.value);
                  setShowCustomerDropdown(true);
                  if (!e.target.value) {
                    setSelectedCustomer(null);
                    setFormData(prev => ({
                      ...prev,
                      customer_id: '',
                      customer_name: ''
                    }));
                  }
                }}
                onFocus={() => setShowCustomerDropdown(true)}
                placeholder={t('searchCustomers') || 'Search customers...'}
                className={`w-full p-2 pr-10 border rounded-lg ${
                  errors.customer_id ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <Search className="absolute right-3 top-2.5 text-gray-400" size={20} />
            </div>
            {showCustomerDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredCustomers.map(customer => (
                  <div
                    key={customer.customer_id}
                    onClick={() => handleCustomerSelect(customer)}
                    className={`p-2 cursor-pointer ${
                      selectedCustomer?.customer_id === customer.customer_id 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {customer.name}
                  </div>
                ))}
                <div
                  onClick={() => {
                    setIsCustomerModalOpen(true);
                    setShowCustomerDropdown(false);
                  }}
                  className="p-2 hover:bg-blue-50 cursor-pointer text-blue-600 border-t"
                >
                  + {t('addNewCustomer') || 'Add New Customer'}
                </div>
              </div>
            )}
            {errors.customer_id && (
              <p className="text-red-500 text-sm mt-1">{errors.customer_id}</p>
            )}
          </div>

          {/* Scale Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('scaleSelection') || 'Scale Selection'}
            </label>
            <select
              value={formData.scale_id}
              onChange={handleScaleChange}
              className="w-full p-2 border rounded-lg border-gray-300"
            >
              <option value="">{t('noScale') || 'No Scale'}</option>
              {availableScales.map(scale => (
                <option key={scale.scale_id} value={scale.scale_id}>
                  {scale.name || `Scale ${scale.scale_id}`}
                </option>
              ))}
              <option value="new">{t('addNewScale') || 'Add New Scale'}</option>
            </select>
          </div>

          {/* Thresholds */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">{t('thresholds') || 'Thresholds'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('upperThreshold') || 'Upper Threshold (kg)'}
                </label>
                <input
                  type="number"
                  value={formData.thresholds.upper}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    thresholds: {
                      ...prev.thresholds,
                      upper: Number(e.target.value)
                    }
                  }))}
                  min="0"
                  className="w-full p-2 border rounded-lg border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('lowerThreshold') || 'Lower Threshold (kg)'}
                </label>
                <input
                  type="number"
                  value={formData.thresholds.lower}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    thresholds: {
                      ...prev.thresholds,
                      lower: Number(e.target.value)
                    }
                  }))}
                  min="0"
                  className="w-full p-2 border rounded-lg border-gray-300"
                />
              </div>
            </div>
            {errors.thresholds && (
              <p className="text-red-500 text-sm">{errors.thresholds}</p>
            )}
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-400 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-red-700">{errors.submit}</p>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={isSubmitting}
            >
              {t('cancel') || 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                disabled:bg-blue-400 flex items-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? t('saving') || 'Saving...' : (initialData ? t('update') || 'Update' : t('add') || 'Add')}
            </button>
          </div>
        </form>

        {/* Customer Modal */}
        <CustomerModal
          isOpen={isCustomerModalOpen}
          onClose={() => setIsCustomerModalOpen(false)}
          onSubmit={async (customerData) => {
            const newCustomer = await apiService.createCustomer(customerData);
            if (onCustomerAdded) {
              onCustomerAdded(newCustomer);
            }
            setFormData(prev => ({
              ...prev,
              customer_id: newCustomer.customer_id,
              customer_name: newCustomer.name
            }));
            setIsCustomerModalOpen(false);
          }}
        />

        {/* Scale Modal */}
        <ScaleModal
          isOpen={isScaleModalOpen}
          onClose={() => setIsScaleModalOpen(false)}
          onSubmit={async (scaleData) => {
            const newScale = await apiService.createScale(scaleData);
            setAvailableScales(prev => [...prev, newScale]);
            setFormData(prev => ({
              ...prev,
              scale_id: newScale.scale_id
            }));
            setIsScaleModalOpen(false);
          }}
        />
      </div>
    </div>
  );
};

export default ProductModal;
