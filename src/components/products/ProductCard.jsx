import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations/translations';
import { Scale, MessageSquare, Clock, Receipt, TrendingUp, ChartBar } from 'lucide-react';
import apiService from '../../services/api';
import ProductDetailModal from './ProductDetailModal';
import { getStatusInfo } from '../../utils/statusUtils';

const ProductCard = ({ product, scale, customers, latestMeasurement }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { language } = useLanguage();
    const t = translations[language];
    const [lastOrder, setLastOrder] = useState(null);
    const [consumptionStats, setConsumptionStats] = useState(null);
    const [scaleId, setScaleId] = useState(null);
    const isRTL = language === 'he';
    const quantityLeftPrecentage = 0.75;
    const dayFromLastPrderPrecentage = 0.3;
    
    const handleOpenModal = () => {
        console.log('Opening modal with:', {
            productId: product?.product_id,
            scaleId: product?.scale_id,
            scale: scale
        });
        setIsModalOpen(true);
    };

    useEffect(() => {
      const fetchOrders = async () => {
        if (product.customer_id && product.item_id) {
          try {
            // Fetch latest order
            const lastOrderResponse = await apiService.request(
              `orders/customer/${product.customer_id}/last-order/${product.item_id}`,
              { method: 'GET' }
            );
            setLastOrder(lastOrderResponse);
  
            // Fetch all orders for consumption calculation
            const orders = await apiService.request(
              `orders/customer/${product.customer_id}/item-history/${lastOrderResponse.item_external_id}`,
              { method: 'GET' }
            );
            try {
              if (orders && orders.length > 1) {
                // Sort the orders array by order_date
                const sortedOrders = orders.sort((a, b) => {
                  const [dayA, monthA, yearA] = a.order_date.split("-");
                  const [dayB, monthB, yearB] = b.order_date.split("-");
                  const dateA = new Date(20 + yearA, monthA - 1, dayA);
                  const dateB = new Date(20 + yearB, monthB - 1, dayB);
                  return dateA - dateB;
                });
            
                // Extract the first and last dates
                const firstDateParts = sortedOrders[0].order_date.split("-");
                const firstDate = new Date(20 + firstDateParts[2], firstDateParts[1] - 1, firstDateParts[0]);
                const lastDateParts = sortedOrders[sortedOrders.length - 1].order_date.split("-");
                const lastDate = new Date(20 + lastDateParts[2], lastDateParts[1] - 1, lastDateParts[0]);
                const daysFromLastOrder = (new Date() - lastDate) / (1000 * 60 * 60 * 24);
                // Calculate the difference in days
                const daysDiff = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
                const quntityLastOrder = sortedOrders[sortedOrders.length - 1].quantity;
                
                // Calculate total quantity
                const totalQuantity = sortedOrders.reduce((sum, order) => sum + parseFloat(order.quantity), 0);
                const dailyAverage = (totalQuantity / daysDiff);
                const estimationQuntityLeft = quntityLastOrder - (dailyAverage * daysFromLastOrder);
                const averageDaysBetweenOrders = daysDiff / (sortedOrders.length - 1);
            
                // Set the consumption stats
                setConsumptionStats({
                  dailyAverage: dailyAverage.toFixed(2),
                  quntityLastOrder: quntityLastOrder,
                  daysFromLastOrder:daysFromLastOrder.toFixed(0),
                  estimationQuntityLeft: estimationQuntityLeft.toFixed(2),
                  averageDaysBetweenOrders: averageDaysBetweenOrders.toFixed(2)
                });
              }
            } catch (error) {
              console.error('Error fetching orders:', error);
            }
          } catch (error) {
            console.error('Error fetching orders:', error);
          }
        }
      };
      
      fetchOrders();
    }, [product.customer_id, product.item_id, product.item_external_id]);
    if (!product) return null;
  
    const getDangerClassNames = (type, value) => {
      if (type === 'quantity') {
        return parseFloat(value) <= parseFloat(lastOrder?.quantity * quantityLeftPrecentage)
          ? 'bg-red-50 text-red-700'
          : 'bg-white text-gray-900';
      }
      if (type === 'days') {
        const avgDays = parseFloat(consumptionStats?.averageDaysBetweenOrders || 0);
        return parseFloat(value) <= (avgDays * dayFromLastPrderPrecentage)
          ? 'bg-red-50 text-red-700'
          : 'bg-white text-gray-900';
      }
      return 'bg-white text-gray-900';
    };
  
    const statusInfo = product.scale_id ? 
      getStatusInfo(latestMeasurement?.weight, product.thresholds) :
      { color: 'text-gray-400', bgColor: 'bg-gray-50', status: 'unknown', distance: 0 };
  
    const formatDate = (timestamp) => {
      if (!timestamp) return t.noData;
      return new Date(timestamp).toLocaleString(language === 'he' ? 'he-IL' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    };
  
    const getCustomerInfo = () => {
        
      if (!customers || !product.customer_id) return null;
      const customer = customers.find(c => c.customer_id === product.customer_id);
      if (!customer) return null;
      const [hebrewName, englishName] = (customer.name || '').split(' - ');
      return {
        displayName: (customer.name || '').split(' - '),
        phone: customer.phone,
        fullData: customer
      };
    };
  
    const customerInfo = getCustomerInfo();
  
    const getWhatsAppLink = () => {
      if (!customerInfo?.phone) return null;
      const message = encodeURIComponent(
        `${t.runningLowMessage} ${product.name || ''}\n${t.productLeft}: ${latestMeasurement?.weight || 0}kg\n${t.pleaseResupply}`
      );
      const cleanPhone = customerInfo.phone.replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('972') ? cleanPhone :
                            cleanPhone.startsWith('0') ? `972${cleanPhone.slice(1)}` : 
                            `972${cleanPhone}`;
      return `https://wa.me/${formattedPhone}?text=${message}`;
    };
  
    return (
      <>
        <div 
            className={`bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300 
            cursor-pointer group ${statusInfo?.bgColor} relative overflow-hidden`}
            onClick={handleOpenModal}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="space-y-1">
            {customerInfo && (
                <h3 className="text-2xl font-bold">{customerInfo.displayName}</h3>
              )}
             <p className="text-gray-600">{product.name || 'Unnamed Product'}</p>
              
              
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex items-center gap-1 text-gray-400">
                  <Scale size={14} />
                  <span className="text-gray-500">
                    {scale ? (scale.name || `Scale ${scale.scale_id}`) : t.noScaleAssigned}
                  </span>
                </div>
                {product.scale_id && (
                  <div className="flex items-center gap-1 text-gray-400">
                    <Clock size={14} />
                    <span className="text-gray-500">
                      {formatDate(latestMeasurement?.timestamp)}
                    </span>
                  </div>
                )}
              </div>
            </div>
  
            <div className="flex flex-col items-end gap-3">
              {product.scale_id && (
                <div className={`px-4 py-2 rounded-lg ${statusInfo.bgColor} transform transition-transform 
                  group-hover:scale-105`}>
                  <span className={`text-xl font-bold ${statusInfo.color}`}>
                    {latestMeasurement?.weight ? `${latestMeasurement.weight} kg` : t.noData}
                  </span>
                </div>
              )}
  
              {getWhatsAppLink() && (
                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-3 bg-green-500 text-white 
                    rounded-lg hover:bg-green-600 transition-colors gap-2 text-base font-medium 
                    transform hover:scale-105"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MessageSquare size={20} />
                  <span>WhatsApp</span>
                </a>
              )}
            </div>
          </div>
  
          {product.scale_id && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t.upperThreshold}:</span>
                  <span className="text-green-600 font-medium">{product.thresholds?.upper || 0} kg</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t.lowerThreshold}:</span>
                  <span className="text-red-600 font-medium">{product.thresholds?.lower || 0} kg</span>
                </div>
              </div>
  
              <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${
                    statusInfo.status === 'good' ? 'bg-green-600' :
                    statusInfo.status === 'warning' ? 'bg-orange-500' :
                    statusInfo.status === 'critical' ? 'bg-red-600' : 'bg-gray-400'
                  } transition-all duration-300`}
                  style={{
                    width: latestMeasurement?.weight ? 
                      `${Math.min(100, (latestMeasurement.weight / (product.thresholds?.upper || 100)) * 100)}%` : 
                      '0%'
                  }}
                />
              </div>
            </>
          )}
  
          {/* {lastOrder && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Receipt size={16} className="text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {t.lastOrder}
                  </span>
                </div>
                <span className="text text-gray-500">
                  {(() => {
                    const parts = lastOrder.order_date.split("-");
                    const date = new Date(20 + parts[2], parts[1] - 1, parts[0]);
                    return date.toLocaleDateString();
                  })()}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-md p-3 shadow-sm">
                  <span className="text-xs text-gray-500 block mb-1">{t.quantity}</span>
                  <span className="text-lg font-semibold">
                    {lastOrder.quantity || 0}
                    <span className="text-xs text-gray-500 ml-1">{t.units}</span>
                  </span>
                </div>
                <div className="bg-white rounded-md p-3 shadow-sm">
                  <span className="text-xs text-gray-500 block mb-1">{t.price}</span>
                  <span className="text-lg font-semibold">
                    ₪{lastOrder.price || 0}
                    <span className="text-xs text-gray-500 ml-1">/ {t.unit}</span>
                  </span>
                </div>
                <div className="bg-white rounded-md p-3 shadow-sm">
                  <span className="text-xs text-gray-500 block mb-1">{t.total}</span>
                  <span className="text-lg font-semibold">
                    ₪{lastOrder.total || 0}
                  </span>
                </div>
              </div>
            </div>
          )} */}
  
        <div className="mt-4 border-t border-gray-100 pt-4">
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-gray-500" />
                    <h4 className="text-base font-semibold text-gray-700">
                        {t.ConsumptionAnalytics}
                    </h4>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                    <ChartBar size={14} />
                    <span>Historical Data</span>
                </div>
            </div>

            {consumptionStats ? (
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white rounded-md p-3 shadow-sm">
                        <div className="flex flex-col h-full justify-between">
                            <span className="text-xs text-gray-500 font-medium">
                                Average Consumption
                            </span>
                            <div className="mt-1">
                                <span className="text-lg font-semibold">
                                    {consumptionStats.dailyAverage}
                                </span>
                                <span className="text-xs text-gray-500 ml-1">{t.unitsPerDay}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-md p-3 shadow-sm">
                        <div className="flex flex-col h-full justify-between">
                            <span className="text-xs text-gray-500 font-medium">
                                {t.averageDaysBetweenOrders}
                            </span>
                            <div className="mt-1">
                                <span className="text-lg font-semibold">
                                    {consumptionStats.averageDaysBetweenOrders}
                                </span>
                                <span className="text-xs text-gray-500 ml-1">{t.days}</span>
                            </div>
                        </div>
                    </div>

                    <div className={`rounded-md p-3 shadow-sm transition-colors duration-300 ${
                        getDangerClassNames('days', consumptionStats.daysFromLastOrder)
                    }`}>
                        <div className="flex flex-col h-full justify-between">
                            <span className="text-xs text-gray-500 font-medium">
                                {t.daysFromLastOrder}
                            </span>
                            <div className="mt-1">
                                <span className="text-lg font-semibold">
                                    {consumptionStats.daysFromLastOrder}
                                </span>
                                <span className="text-xs text-gray-500 ml-1">{t.days}</span>
                            </div>
                        </div>
                    </div>

                    <div className={`rounded-md p-3 shadow-sm transition-colors duration-300 ${
                        getDangerClassNames('quantity', consumptionStats.estimationQuntityLeft)
                    }`}>
                        <div className="flex flex-col h-full justify-between">
                            <span className="text-xs text-gray-500 font-medium">
                                {t.estimationQuntityLeft}
                            </span>
                            <div className="mt-1">
                                <span className="text-lg font-semibold">
                                    {consumptionStats.estimationQuntityLeft}
                                </span>
                                <span className="text-xs text-gray-500 ml-1">{t.units}</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-gray-500 text-sm">
                    {t.noStatsAvailable}
                </div>
            )}
        </div>
        </div>
  
        <ProductDetailModal
            isOpen={isModalOpen}
            onClose={() => {
            console.log('Closing modal');
            setIsModalOpen(false);
            }}
            product={product}
            scale_id={product?.scale_id} // Ensure we're using the correct property
            latestMeasurement={latestMeasurement}
            customer={customerInfo?.fullData}
        />
      </>
    );
  };
  
    export default ProductCard;