// Check if customer has pending delivery
export const hasWaitingDelivery = (customer, orders) => {
    return orders.some(order => {
      const [hebrewName, englishName] = customer.name.split(' - ');
      return (order.customer_name === hebrewName || order.customer_name === englishName) &&
        order.status === 'waiting_for_delivery';
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
  
  // Geocode an address to coordinates
  export const geocodeAddress = async (address) => {
    const DEFAULT_COORDS = {
      tel_aviv: { lat: 32.0853, lng: 34.7818 },
      jerusalem: { lat: 31.7683, lng: 35.2137 },
      haifa: { lat: 32.7940, lng: 34.9896 }
    };
  
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
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=il`
      );
  
      if (!response.ok) throw new Error('Geocoding failed');
  
      const data = await response.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
  
      throw new Error('Location not found');
    } catch (err) {
      console.error('Geocoding fallback for address:', address, err);
      return {
        lat: DEFAULT_COORDS.tel_aviv.lat + (Math.random() - 0.5) * 0.02,
        lng: DEFAULT_COORDS.tel_aviv.lng + (Math.random() - 0.5) * 0.02
      };
    }
  };