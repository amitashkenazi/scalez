import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations/translations';
import apiService from '../../services/api';
import { Search, SortAsc, SortDesc, RefreshCw, PlusCircle } from 'lucide-react';

const CustomersTableView = () => {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'he';
  const Card = ({ children, className = '' }) => (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {children}
    </div>
  );
  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getCustomers();
      setCustomers(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchCustomers();
    setIsRefreshing(false);
  };

  const handleSort = (key) => {
    setSortConfig(prevSort => ({
      key,
      direction: prevSort.key === key && prevSort.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredAndSortedCustomers = useMemo(() => {
    let result = [...customers];
    
    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(customer => 
        customer.name?.toLowerCase().includes(lowerSearchTerm) ||
        customer.email?.toLowerCase().includes(lowerSearchTerm) ||
        customer.phone?.toLowerCase().includes(lowerSearchTerm) ||
        customer.address?.toLowerCase().includes(lowerSearchTerm)
      );
    }
    
    // Apply sorting
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

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ? 
      <SortAsc className="w-4 h-4 inline-block ml-1" /> : 
      <SortDesc className="w-4 h-4 inline-block ml-1" />;
  };

  // Table headers configuration
  const headers = [
    { key: 'name', label: t.customerName },
    { key: 'email', label: t.email },
    { key: 'phone', label: t.phone },
    { key: 'address', label: t.address }
  ];

  if (isLoading && !isRefreshing) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const TableHeader = ({ header }) => (
    <th 
      className={`px-6 py-3 text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-50
        ${isRTL ? 'text-right' : 'text-left'}`}
      onClick={() => handleSort(header.key)}
    >
      <span className="flex items-center gap-1">
        {header.label}
        <SortIcon columnKey={header.key} />
      </span>
    </th>
  );

  return (
    <div 
      className="p-6 max-w-7xl mx-auto"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header Section */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold">{t.customers}</h2>
        <p className="text-gray-600 mt-1">{t.customersTableDesc}</p>
      </div>

      {/* Controls Section */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        {/* Search */}
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            placeholder={t.searchCustomers}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border rounded-lg hover:bg-gray-50"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {t.refresh}
          </button>

          <button
            className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <PlusCircle className="h-5 w-5" />
            {t.addCustomer}
          </button>
        </div>
      </div>

      {error ? (
        <Card className="p-6 bg-red-50 border-red-100">
          <div className="text-red-700">{error}</div>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  {headers.map(header => (
                    <TableHeader key={header.key} header={header} />
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAndSortedCustomers.map((customer) => (
                  <tr 
                    key={customer.customer_id} 
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">{customer.name}</td>
                    <td className="px-6 py-4">{customer.email}</td>
                    <td className="px-6 py-4">{customer.phone}</td>
                    <td className="px-6 py-4">{customer.address}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredAndSortedCustomers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? t.noSearchResults : t.noCustomers}
              </div>
            )}
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {filteredAndSortedCustomers.map((customer) => (
              <Card 
                key={customer.customer_id} 
                className="p-4 hover:shadow-md transition-shadow"
              >
                <div className="space-y-2">
                  <div className="font-medium text-lg">{customer.name}</div>
                  <div className="text-sm space-y-1">
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="font-medium">{t.email}:</span>
                      {customer.email}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="font-medium">{t.phone}:</span>
                      {customer.phone}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="font-medium">{t.address}:</span>
                      {customer.address}
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {filteredAndSortedCustomers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? t.noSearchResults : t.noCustomers}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CustomersTableView;