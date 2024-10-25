// Helper function to generate realistic time-series data
function generateScaleHistory(baseWeight, daysBack = 5) {
    const history = [];
    const now = new Date();
    const msPerHour = 6 * 60 * 60 * 1000; // Sample every 6 hours
    
    // Generate data points going back 5 days
    for (let i = 0; i < 20; i++) {
      // Calculate timestamp going backwards from now
      const timestamp = new Date(now - (i * msPerHour));
      
      // Add some random variation to the weight (-5% to +5%)
      const variation = (Math.random() - 0.5) * 0.1 * baseWeight;
      const weight = Math.round((baseWeight + variation) * 10) / 10;
      
      history.unshift({
        timestamp: timestamp.toISOString(),
        weight
      });
    }
    
    return history;
  }
  
  // Example usage:
  // const history = generateScaleHistory(40); // For a scale with base weight of 40kg