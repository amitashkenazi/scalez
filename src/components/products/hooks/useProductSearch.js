import { useState, useCallback, useMemo } from 'react';
import debounce from 'lodash/debounce';

export const useProductSearch = (products) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const debouncedSearch = useMemo(
    () => debounce((term) => {
      setIsSearching(false);
    }, 300),
    []
  );

  const handleSearchChange = useCallback((term) => {
    setSearchTerm(term);
    setIsSearching(true);
    debouncedSearch(term);
  }, [debouncedSearch]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) {
      return products;
    }

    const normalizedSearch = searchTerm.toLowerCase();
    return products.filter(product => 
      product.name?.toLowerCase().includes(normalizedSearch) ||
      product.itemCode?.toLowerCase().includes(normalizedSearch)
    );
  }, [products, searchTerm]);

  return {
    searchTerm,
    isSearching,
    handleSearchChange,
    filteredProducts
  };
};