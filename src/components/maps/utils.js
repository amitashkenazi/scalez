import { mapsService } from '../../services/mapsService';

const DEFAULT_COORDS = {
  tel_aviv: { lat: 32.0853, lng: 34.7818 },
  jerusalem: { lat: 31.7683, lng: 35.2137 },
  haifa: { lat: 32.7940, lng: 34.9896 }
};

// Check if customer has pending delivery 
export const hasWaitingDelivery = (customer, orders) => {
  return orders.some(order => {
    const [hebrewName, englishName] = customer.name.split(' - ');
    return (order.customer_name === hebrewName || order.customer_name === englishName) &&
      order.status === 'waiting_for_delivery';
  });
};

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

export const geocodeAddress = async (address) => {
  const cityMatches = {
    'תל אביב': DEFAULT_COORDS.tel_aviv,
    'tel aviv': DEFAULT_COORDS.tel_aviv,
    'ירושלים': DEFAULT_COORDS.jerusalem,
    'jerusalem': DEFAULT_COORDS.jerusalem,
    'חיפה': DEFAULT_COORDS.haifa,
    'haifa': DEFAULT_COORDS.haifa
  };

  for (const [city, coords] of Object.entries(cityMatches)) {
    if (address.toLowerCase().includes(city.toLowerCase())) {
      return {
        lat: coords.lat + (Math.random() - 0.5) * 0.01,
        lng: coords.lng + (Math.random() - 0.5) * 0.01
      };
    }
  }

  try {
    const coords = await mapsService.geocodeAddress(address);
    return coords;
  } catch (error) {
    console.error('Geocoding fallback for address:', address, error);
    return {
      lat: DEFAULT_COORDS.tel_aviv.lat + (Math.random() - 0.5) * 0.02,
      lng: DEFAULT_COORDS.tel_aviv.lng + (Math.random() - 0.5) * 0.02
    };
  }
};