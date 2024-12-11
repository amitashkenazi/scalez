// src/components/ProductModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations/translations';
import { X, Loader2, AlertCircle, Search } from 'lucide-react';
import apiService from '../../services/api';
import CustomerModal from '../CustomerModal';
import ScaleModal from '../ScaleModal';

const ItemSelectorField = ({
  itemSearchQuery,
  onSearchChange,
  selectedItem,
  showDropdown,
  onFocus,
  isLoading,
  filteredItems,
  onItemSelect,
  placeholder,
  label,
  error
}) => {
  return (
    <div className="relative dropdown-container">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={itemSearchQuery}
          onChange={onSearchChange}
          onFocus={onFocus}
          placeholder={placeholder}
          className={`w-full p-2 pr-10 border rounded-lg ${
            error ? 'border-red-500' : 'border-gray-300'
          } ${isLoading ? 'bg-gray-50' : 'bg-white'}`}
          disabled={isLoading}
        />
        <div className="absolute right-3 top-2.5">
          {isLoading ? (
            <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>
      {showDropdown && !isLoading && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredItems.length > 0 ? (
            filteredItems.map(item => (
              <div
                key={item.item_id}
                onClick={() => onItemSelect(item)}
                className={`p-2 cursor-pointer ${
                  selectedItem?.item_id === item.item_id 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'hover:bg-gray-100'
                }`}
              >
                {item.name} ({item.itemCode})
              </div>
            ))
          ) : (
            <div className="p-2 text-gray-500 text-center">
              No items found
            </div>
          )}
        </div>
      )}
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};

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
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  
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
  const t = (key) => translations[key]?.[language] || `Missing translation: ${key}`;
  const isRTL = language === 'he';

  const fetchItems = async () => {
    setIsLoadingItems(true);
    try {
      if (itemsCache.current) {
        console.log('Using cached items');
        setAvailableItems(itemsCache.current);
        
        if (initialData?.item_id) {
          const matchingItem = itemsCache.current.find(
            item => item.external_id === initialData.item_id
          );
          if (matchingItem) {
            setSelectedItem(matchingItem);
            setItemSearchQuery(matchingItem.name);
          }
        }
      } else {
        console.log('Fetching items from server');
        const response = await apiService.request('items', {
          method: 'GET'
        });
        
        itemsCache.current = response;
        setAvailableItems(response);
        
        if (initialData?.item_id && response) {
          const matchingItem = response.find(
            item => item.external_id === initialData.item_id
          );
          if (matchingItem) {
            setSelectedItem(matchingItem);
            setItemSearchQuery(matchingItem.name);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      setErrors(prev => ({ ...prev, items: 'Error loading items' }));
    } finally {
      setIsLoadingItems(false);
    }
  };

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

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
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
      newErrors.name = t('productNameRequired');
    }

    if (!formData.customer_id) {
      newErrors.customer_id = t('customerRequired');
    }

    const upperThreshold = Number(formData.thresholds.upper);
    const lowerThreshold = Number(formData.thresholds.lower);

    if (isNaN(upperThreshold) || isNaN(lowerThreshold)) {
      newErrors.thresholds = t('invalidThresholds');
    } else if (upperThreshold <= lowerThreshold) {
      newErrors.thresholds = t('thresholdError');
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
      setErrors({ submit: err.message || t('failedToSaveProduct') });
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
            {initialData ? t('updateProduct') : t('addProduct')}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <ItemSelectorField
            itemSearchQuery={itemSearchQuery}
            onSearchChange={(e) => {
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
            selectedItem={selectedItem}
            showDropdown={showItemDropdown}
            onFocus={() => setShowItemDropdown(true)}
            isLoading={isLoadingItems}
            filteredItems={filteredItems}
            onItemSelect={handleItemSelect}
            placeholder={t('searchItems')}
            label={t('selectItem')}
            error={errors.item_id}
          />

          {/* Rest of the form fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('productName')}
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
              {t('customer')}
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
                placeholder={t('searchCustomers')}
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
                  + {t('addNewCustomer')}
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
              {t('scaleSelection')}
            </label>
            <select
              value={formData.scale_id}
              onChange={handleScaleChange}
              className="w-full p-2 border rounded-lg border-gray-300"
            >
              <option value="">{t('noScale')}</option>
              {availableScales.map(scale => (
                <option key={scale.scale_id} value={scale.scale_id}>
                  {scale.name || `Scale ${scale.scale_id}`}
                </option>
              ))}
              <option value="new">{t('addNewScale')}</option>
            </select>
          </div>

          {/* Thresholds */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">{t('thresholds')}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('upperThreshold')}
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
                  {t('lowerThreshold')}
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
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                disabled:bg-blue-400 flex items-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? t('saving') : (initialData ? t('update') : t('add'))}
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
            setSelectedCustomer(newCustomer);
            setCustomerSearchQuery(newCustomer.name);
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