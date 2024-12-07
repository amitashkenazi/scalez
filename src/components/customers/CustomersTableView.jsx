import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations/translations';
import apiService from '../../services/api';
import { Search, SortAsc, SortDesc, RefreshCw, PlusCircle, Trash2, Pencil, AlertCircle, Loader2 } from 'lucide-react';
import CustomerModal from '../CustomerModal';
import DeleteConfirmationModal from '../modals/DeleteConfirmationModal';

const TableHeader = ({ header, sortConfig, handleSort, isRTL }) => (
  <th
    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider
      ${header.key === 'actions' ? 'w-24' : 'cursor-pointer hover:bg-gray-50'}
      ${isRTL && header.key !== 'id' ? 'text-right' : 'text-left'}`}
    onClick={() => header.key !== 'actions' && handleSort(header.key)}
  >
    <div className="flex items-center gap-1">
      {header.label}
      {header.key !== 'actions' && sortConfig.key === header.key && (
        sortConfig.direction === 'asc' ?
          <SortAsc className="w-4 h-4" /> :
          <SortDesc className="w-4 h-4" />
      )}
    </div>
  </th>
);

const CustomersTableView = () => {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const { language } = useLanguage();
  // Helper function to get translation
  const t = (key) => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return `Missing translation: ${key}`;
  };
  const isRTL = language === 'he';

  const fetchCustomers = async () => {
    try {
      setError(null);
      const response = await apiService.getCustomers();
      console.log('Fetched customers:', response);

      // Make sure each customer has a customer_id property
      const formattedCustomers = response.map(customer => ({
        ...customer,
        customer_id: customer.customer_id || customer.id
      }));

      setCustomers(formattedCustomers);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError(t('errorFetchingCustomers') || 'Failed to fetch customers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setIsLoading(true);
    try {
      await fetchCustomers();
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleSort = (key) => {
    setSortConfig(prevSort => ({
      key,
      direction: prevSort.key === key && prevSort.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleAddCustomer = async (customerData) => {
    try {
      setError(null);
      const newCustomer = await apiService.createCustomer(customerData);
      setCustomers(prev => [...prev, newCustomer]);
      setIsAddModalOpen(false);
      showSuccessMessage(t('customerAdded'));
    } catch (err) {
      setError(t('errorAddingCustomer'));
      console.error('Error adding customer:', err);
    }
  };

  const handleEditCustomer = async (customerData) => {
    if (!selectedCustomer?.customer_id) {
      setError(t('invalidCustomer'));
      return;
    }

    try {
      setError(null);
      const updatedCustomer = await apiService.updateCustomer(
        selectedCustomer.customer_id,
        customerData
      );
      setCustomers(prev => prev.map(c =>
        c.customer_id === selectedCustomer.customer_id ? updatedCustomer : c
      ));
      setIsEditModalOpen(false);
      setSelectedCustomer(null);
      showSuccessMessage(t('customerUpdated'));
    } catch (err) {
      setError(t('errorUpdatingCustomer'));
      console.error('Error updating customer:', err);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer?.customer_id) {
      setError(t('invalidCustomer'));
      return;
    }

    try {
      setError(null);
      await apiService.deleteCustomer(selectedCustomer.customer_id);
      setCustomers(prev => prev.filter(c => c.customer_id !== selectedCustomer.customer_id));
      setIsDeleteModalOpen(false);
      setSelectedCustomer(null);
      showSuccessMessage(t('customerDeleted'));
    } catch (err) {
      setError(t('errorDeletingCustomer'));
      console.error('Error deleting customer:', err);
    }
  };

  const filteredAndSortedCustomers = useMemo(() => {
    let result = [...customers];

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(customer =>
        customer.name?.toLowerCase().includes(lowerSearchTerm) ||
        customer.email?.toLowerCase().includes(lowerSearchTerm) ||
        customer.phone?.toLowerCase().includes(lowerSearchTerm) ||
        customer.address?.toLowerCase().includes(lowerSearchTerm)
      );
    }

    result.sort((a, b) => {
      let aVal = a[sortConfig.key] || '';
      let bVal = b[sortConfig.key] || '';

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [customers, searchTerm, sortConfig]);

  const headers = [
    { key: 'customer_id', label: 'ID' },
    { key: 'name', label: t('customerName') },
    { key: 'email', label: t('email') },
    { key: 'phone', label: t('phone') },
    { key: 'address', label: t('address') },
    { key: 'actions', label: '' }
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">{t('loading')}</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">{t('customersTable')}</h2>
        <p className="text-gray-600 mt-1">{t('customersTableDesc')}</p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            placeholder={t('searchCustomers')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {t('refresh')}
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <PlusCircle className="h-5 w-5" />
            {t('addCustomer')}
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-400 rounded-lg p-4">
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-400 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              {headers.map(header => (
                <TableHeader
                  key={header.key}
                  header={header}
                  sortConfig={sortConfig}
                  handleSort={handleSort}
                  isRTL={isRTL}
                />
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredAndSortedCustomers.map((customer) => (
              <tr
                key={customer.customer_id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 text-sm text-gray-500">
                  {customer.customer_id}
                </td>
                <td className="px-6 py-4">
                  {customer.name}
                </td>
                <td className="px-6 py-4">
                  {customer.email}
                </td>
                <td className="px-6 py-4">
                  {customer.phone}
                </td>
                <td className="px-6 py-4">
                  {customer.address}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setIsEditModalOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setIsDeleteModalOpen(true);
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAndSortedCustomers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? t('noSearchResults') : t('noCustomers')}
          </div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {filteredAndSortedCustomers.map((customer) => (
          <div
            key={customer.customer_id}
            className="bg-white rounded-lg p-4 shadow hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="text-sm text-gray-500">ID: {customer.customer_id}</div>
                <div className="font-medium text-lg">{customer.name}</div>
                <div className="text-sm space-y-1">
                  <div className="text-gray-600">{customer.email}</div>
                  <div className="text-gray-600">{customer.phone}</div>
                  <div className="text-gray-600">{customer.address}</div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setIsEditModalOpen(true);
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Pencil className="h-5 w-5" />
                </button>
                <button
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setIsDeleteModalOpen(true);
                  }}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredAndSortedCustomers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? t('noSearchResults') : t('noCustomers')}
          </div>
        )}
      </div>

      {/* Modals */}
      <CustomerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddCustomer}
      />

      <CustomerModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCustomer(null);
        }}
        onSubmit={handleEditCustomer}
        initialData={selectedCustomer}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedCustomer(null);
        }}
        onConfirm={handleDeleteCustomer}
        title={t('deleteCustomer')}
        message={t('deleteConfirmationDesc')}
      />
    </div>
  );
};

export default CustomersTableView;