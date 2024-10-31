import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

const ProductModal = ({ isOpen, onClose, onSubmit, customers, initialData = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    customer_id: '',
    customer_name: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen && initialData) {
      const customer = customers.find(c => c.customer_id === initialData.customer_id);
      setFormData({
        name: initialData.name || '',
        customer_id: initialData.customer_id || '',
        customer_name: customer?.name || ''
      });
    } else if (isOpen) {
      setFormData({
        name: '',
        customer_id: '',
        customer_name: ''
      });
    }
    setErrors({});
  }, [isOpen, initialData, customers]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    if (!formData.customer_id) {
      newErrors.customer_id = 'Customer selection is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const productData = {
        name: formData.name.trim(),
        customer_id: formData.customer_id,
        customer_name: formData.customer_name,
        ...(initialData?.product_id && { product_id: initialData.product_id })
      };

      await onSubmit(productData);
      onClose();
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to save product' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomerChange = (e) => {
    const selectedCustomerId = e.target.value;
    const selectedCustomer = customers.find(c => c.customer_id === selectedCustomerId);
    
    if (selectedCustomer) {
      setFormData({
        ...formData,
        customer_id: selectedCustomer.customer_id,
        customer_name: selectedCustomer.name
      });
    } else {
      setFormData({
        ...formData,
        customer_id: '',
        customer_name: ''
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {initialData ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isSubmitting}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500
                ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer
            </label>
            <select
              value={formData.customer_id}
              onChange={handleCustomerChange}
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500
                ${errors.customer_id ? 'border-red-500' : 'border-gray-300'}`}
              disabled={isSubmitting}
            >
              <option value="">Select Customer</option>
              {customers.map(customer => (
                <option key={customer.customer_id} value={customer.customer_id}>
                  {customer.name}
                </option>
              ))}
            </select>
            {errors.customer_id && (
              <p className="text-red-500 text-sm mt-1">{errors.customer_id}</p>
            )}
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-400 rounded-lg p-3">
              <p className="text-red-700">{errors.submit}</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center justify-center gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Saving...' : (initialData ? 'Update Product' : 'Add Product')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;