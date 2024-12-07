import { useState, useCallback, useMemo } from 'react';
import debounce from 'lodash/debounce';

export const useProductSearch = (products, customers) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const debouncedSetSearching = useMemo(
    () => debounce(() => {
      setIsSearching(false);
    }, 300),
    []
  );

  const handleSearchChange = useCallback((term) => {
    setIsSearching(true);
    setSearchTerm(term);
    debouncedSetSearching();
  }, [debouncedSetSearching]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) {
      return products;
    }

    const normalizedSearch = searchTerm.toLowerCase();
    return products.filter(product => {
      // Find the customer for this product
      const customer = customers.find(c => c.customer_id === product.customer_id);
      const customerName = customer?.name?.toLowerCase() || '';
      
      return (
        product.name?.toLowerCase().includes(normalizedSearch) ||
        product.itemCode?.toLowerCase().includes(normalizedSearch) ||
        customerName.includes(normalizedSearch)
      );
    });
  }, [products, customers, searchTerm]);

  return {
    searchTerm,
    isSearching,
    handleSearchChange,
    filteredProducts
  };
};