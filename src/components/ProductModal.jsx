import React, { useState, useEffect } from 'react';
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
  onCustomerAdded 
}) => {
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
  const [itemSearchQuery, setItemSearchQuery] = useState('');

  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'he';

  // Fetch items when modal opens
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await apiService.request('items', {
          method: 'GET'
        });
        console.log('Fetched items:', response);
        setAvailableItems(response);
      } catch (error) {
        console.error('Error fetching items:', error);
        setErrors(prev => ({ ...prev, items: 'Error loading items' }));
      }
    };

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
  }, [isOpen]);

  // Initialize form data when modal opens or receives initial data
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const customer = customers.find(c => c.customer_id === initialData.customer_id);
        setFormData({
          name: initialData.name || '',
          customer_id: initialData.customer_id || '',
          customer_name: customer?.name || '',
          scale_id: initialData.scale_id || '',
          item_id: initialData.item_id || '',
          thresholds: {
            upper: initialData.thresholds?.upper || 40,
            lower: initialData.thresholds?.lower || 8
          }
        });
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
      }
      setErrors({});
      setItemSearchQuery('');
    }
  }, [isOpen, initialData, customers]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = t.productNameRequired;
    }

    if (!formData.customer_id) {
      newErrors.customer_id = t.customerRequired;
    }

    if (formData.thresholds.upper <= formData.thresholds.lower) {
      newErrors.thresholds = t.thresholdError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        name: formData.name.trim(),
        thresholds: {
          upper: Number(formData.thresholds.upper),
          lower: Number(formData.thresholds.lower)
        }
      });
      onClose();
    } catch (err) {
      setErrors({ submit: err.message || t.failedToSaveProduct });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleItemChange = (e) => {
    const selectedItemId = e.target.value;
    if (selectedItemId === 'new') {
      // Handle new item creation if needed
      return;
    }

    const selectedItem = availableItems.find(item => item.item_id === selectedItemId);
    if (selectedItem) {
      setFormData(prev => ({
        ...prev,
        item_id: selectedItem.item_id,
        name: selectedItem.name // Pre-fill name but allow editing
      }));
    }
  };

  const handleCustomerChange = (e) => {
    const selectedValue = e.target.value;
    
    if (selectedValue === 'new') {
      setIsCustomerModalOpen(true);
      return;
    }

    const selectedCustomer = customers.find(c => 
      (c.customer_id || c.id).toString() === selectedValue
    );
    
    if (selectedCustomer) {
      setFormData(prevData => ({
        ...prevData,
        customer_id: selectedValue,
        customer_name: selectedCustomer.name
      }));
    } else {
      setFormData(prevData => ({
        ...prevData,
        customer_id: '',
        customer_name: ''
      }));
    }
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

  const filteredItems = itemSearchQuery
    ? availableItems.filter(item => 
        item.name.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
        item.itemCode.toLowerCase().includes(itemSearchQuery.toLowerCase())
      )
    : availableItems;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {initialData ? t.editProduct : t.addProduct}
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.selectItem}
            </label>
            <div className="relative">
              <input
                type="text"
                value={itemSearchQuery}
                onChange={(e) => setItemSearchQuery(e.target.value)}
                placeholder={t.searchItems}
                className="w-full p-2 pr-10 border rounded-lg mb-2"
              />
              <Search className="absolute right-3 top-2.5 text-gray-400" size={20} />
            </div>
            <select
              value={formData.item_id}
              onChange={handleItemChange}
              className="w-full p-2 border rounded-lg"
            >
              <option value="">{t.selectItem}</option>
              {filteredItems.map(item => (
                <option key={item.item_id} value={item.item_id}>
                  {item.name} ({item.itemCode})
                </option>
              ))}
            </select>
          </div>

          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.productName}
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.customer}
            </label>
            <select
              value={formData.customer_id}
              onChange={handleCustomerChange}
              className={`w-full p-2 border rounded-lg ${errors.customer_id ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="">{t.selectCustomer}</option>
              {customers.map(customer => (
                <option key={customer.customer_id} value={customer.customer_id}>
                  {customer.name}
                </option>
              ))}
              <option value="new">{t.addNewCustomer}</option>
            </select>
            {errors.customer_id && (
              <p className="text-red-500 text-sm mt-1">{errors.customer_id}</p>
            )}
          </div>

          {/* Scale Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.scale}
            </label>
            <select
              value={formData.scale_id}
              onChange={handleScaleChange}
              className="w-full p-2 border rounded-lg border-gray-300"
            >
              <option value="">{t.noScale}</option>
              {availableScales.map(scale => (
                <option key={scale.scale_id} value={scale.scale_id}>
                  {scale.name || `Scale ${scale.scale_id}`}
                </option>
              ))}
              <option value="new">{t.addNewScale}</option>
            </select>
          </div>

          {/* Thresholds */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">{t.thresholds}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.upperThreshold}
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
                  className="w-full p-2 border rounded-lg border-gray-300"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.lowerThreshold}
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
                  className="w-full p-2 border rounded-lg border-gray-300"
                  min="0"
                />
              </div>
            </div>
            {errors.thresholds && (
              <p className="text-red-500 text-sm">{errors.thresholds}</p>
            )}
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-400 rounded-lg p-3">
              <div className="flex items-center">
                <AlertCircle className="text-red-400 mr-2" size={20} />
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
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400
                flex items-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="animate-spin" size={20} />}
              {isSubmitting ? t.saving : (initialData ? t.update : t.add)}
            </button>
          </div>
        </form>
      </div>

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
  );
};

export default ProductModal;