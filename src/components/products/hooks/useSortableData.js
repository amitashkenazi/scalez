import { useState, useMemo } from 'react';

const useSortableData = (items, initialSort = { key: null, direction: 'asc' }) => {
  const [sortConfig, setSortConfig] = useState(initialSort);

  const sortedItems = useMemo(() => {
    if (!sortConfig.key) return items;

    const sortedArray = [...items];
    sortedArray.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    return sortedArray;
  }, [items, sortConfig]);

  const requestSort = (key) => {
    setSortConfig(prevSort => ({
      key,
      direction: prevSort.key === key && prevSort.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  return { sortedItems, sortConfig, requestSort };
};

export default useSortableData;