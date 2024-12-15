import apiService from '../../services/api';

// Check if customer has pending delivery
export const hasWaitingDelivery = (customer, invoices) => {
    return invoices.some(invoice => {
      const [hebrewName, englishName] = customer.name.split(' - ');
      return (invoice.customer_name === hebrewName || invoice.customer_name === englishName) &&
        invoice.status === 'waiting_for_delivery';
    });
  };
  
  // Get status info based on weight and thresholds
  export const getStatusInfo = (weight, thresholds) => {
    if (!weight || !thresholds) return { 
      color: 'text-gray-400',
      bgColor: 'bg-gray-50',
      status: 'unknown',
      distance: 0 
    };
  
    const value = parseFloat(weight);
    const upper = parseFloat(thresholds.upper);
    const lower = parseFloat(thresholds.lower);
  
    if (value >= upper) {
      return {
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        status: 'good',
        distance: value - upper
      };
    } else if (value >= lower) {
      return {
        color: 'text-orange-500',
        bgColor: 'bg-orange-50',
        status: 'warning',
        distance: value - lower
      };
    }
    return {
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      status: 'critical',
      distance: lower - value
    };
  };
  
  // Geocode an address to coordinates using server endpoint
export const geocodeAddress = async (address) => {
  console.log('Geocoding address:', address);
  
  try {
    // Use the apiService to call the server's geocoding endpoint
    const coordinates = await apiService.geocodeAddress(address);
    
    if (!coordinates || (!coordinates.lat && !coordinates.lng)) {
      throw new Error('Invalid geocoding response');
    }
    
    return {
      lat: coordinates.lat,
      lng: coordinates.lng
    };
  } catch (err) {
    console.error('Geocoding error for address:', address, err);
    
    // Fallback to default Tel Aviv coordinates with slight randomization
    const DEFAULT_COORDS = { lat: 32.0853, lng: 34.7818 };
    return {
      lat: DEFAULT_COORDS.lat + (Math.random() - 0.5) * 0.02,
      lng: DEFAULT_COORDS.lng + (Math.random() - 0.5) * 0.02
    };
  }
};