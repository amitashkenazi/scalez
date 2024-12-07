import React from 'react';
import ProductsView from './ProductsView';
import { useSharedProductsData } from '../../hooks/useSharedProductsData';

const SharedProductsView = () => {
  return (
    <ProductsView
      useDataHook={useSharedProductsData}
      canCreate={false}
      canEdit={false}
      canDelete={false}
      viewTitle="sharedProducts"
      viewDescription="sharedProductsDesc"
      emptyStateMessage="noSharedProducts"
    />
  );
};

export default SharedProductsView;