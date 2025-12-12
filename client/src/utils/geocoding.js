// Reverse geocoding utility to convert coordinates to address
export const reverseGeocode = async (lat, lng) => {
  try {
    // Using OpenStreetMap Nominatim API (free and no API key required)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PlasmaDonor/1.0' // Required by Nominatim
        }
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding service unavailable');
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    // Extract detailed address components for better location display
    const addressDetails = data.address || {};
    
    // Build a comprehensive address string
    const addressParts = [];
    
    // Add road/street
    if (addressDetails.road) addressParts.push(addressDetails.road);
    
    // Add neighborhood/suburb
    if (addressDetails.neighbourhood) addressParts.push(addressDetails.neighbourhood);
    else if (addressDetails.suburb) addressParts.push(addressDetails.suburb);
    
    // Add city/town/village
    if (addressDetails.city) addressParts.push(addressDetails.city);
    else if (addressDetails.town) addressParts.push(addressDetails.town);
    else if (addressDetails.village) addressParts.push(addressDetails.village);
    else if (addressDetails.municipality) addressParts.push(addressDetails.municipality);
    
    // Add state/region
    if (addressDetails.state) addressParts.push(addressDetails.state);
    else if (addressDetails.region) addressParts.push(addressDetails.region);
    
    // Add country
    if (addressDetails.country) addressParts.push(addressDetails.country);
    
    // Add postal code if available
    if (addressDetails.postcode) {
      addressParts.push(addressDetails.postcode);
    }
    
    // Create formatted address
    const formattedAddress = addressParts.length > 0 
      ? addressParts.join(', ')
      : data.display_name || 'Location detected';
    
    return {
      address: formattedAddress,
      details: {
        road: addressDetails.road || '',
        neighbourhood: addressDetails.neighbourhood || addressDetails.suburb || '',
        city: addressDetails.city || addressDetails.town || addressDetails.village || '',
        state: addressDetails.state || addressDetails.region || '',
        country: addressDetails.country || '',
        postcode: addressDetails.postcode || ''
      },
      success: true
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return {
      address: `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      details: {},
      success: false,
      error: error.message
    };
  }
};

// Get current location with address
export const getCurrentLocationWithAddress = async () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    console.log('Requesting high-accuracy GPS location...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        const accuracy = position.coords.accuracy;
        
        console.log(`GPS Location obtained: ${lat}, ${lng} (accuracy: ${accuracy}m)`);
        
        // Validate if coordinates are realistic (not 0,0 or obviously wrong)
        if (lat === 0 && lng === 0) {
          reject(new Error('Invalid GPS coordinates received (0,0). Please try again or check your location settings.'));
          return;
        }
        
        // Check if accuracy is too low (more than 1km)
        if (accuracy > 1000) {
          console.warn(`Low GPS accuracy: ${accuracy}m - using anyway but flagging`);
        }
        
        try {
          // Get detailed address from coordinates with retry logic
          console.log('Getting detailed address for coordinates...');
          let geocodeResult;
          let retries = 3;
          
          while (retries > 0) {
            try {
              geocodeResult = await reverseGeocode(lat, lng);
              if (geocodeResult.success) break;
              retries--;
              if (retries > 0) {
                console.log(`Geocoding retry ${4 - retries}/3...`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
              }
            } catch (err) {
              retries--;
              if (retries === 0) throw err;
            }
          }
          
          console.log('Final geocoding result:', geocodeResult);
          
          // Validate that address seems reasonable
          const address = geocodeResult.address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          const hasValidAddress = address && address.length > 10 && !address.includes('undefined');
          
          resolve({
            lat: parseFloat(lat.toFixed(6)), // Limit to 6 decimal places (~0.1m precision)
            lng: parseFloat(lng.toFixed(6)),
            address: hasValidAddress ? address : `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
            details: geocodeResult.details || {},
            accuracy: Math.round(accuracy),
            success: true,
            hasValidAddress
          });
        } catch (error) {
          console.error('Geocoding failed:', error);
          // If geocoding fails, still return coordinates with fallback address
          resolve({
            lat: parseFloat(lat.toFixed(6)),
            lng: parseFloat(lng.toFixed(6)),
            address: `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
            details: {},
            accuracy: Math.round(accuracy),
            success: false,
            hasValidAddress: false,
            error: error.message
          });
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        
        let errorMessage = 'Failed to get your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '⛔ Location access denied. Please:\n1. Click the lock icon in your browser address bar\n2. Allow location access\n3. Refresh the page and try again';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = '📍 GPS unavailable. Please:\n1. Enable Location Services in your device settings\n2. Ensure you have a clear view of the sky (for GPS signal)\n3. Check your internet connection\n4. Try again';
            break;
          case error.TIMEOUT:
            errorMessage = '⏱️ Location request timed out. Please:\n1. Ensure you have a stable internet connection\n2. Move to a location with better GPS signal\n3. Try again';
            break;
          default:
            errorMessage = `❌ Location error: ${error.message}`;
            break;
        }
        
        reject(new Error(errorMessage));
      },
      {
        timeout: 30000, // 30 seconds timeout for better GPS lock
        enableHighAccuracy: true, // Use GPS for maximum accuracy
        maximumAge: 0 // Always get fresh location, never use cached
      }
    );
  });
}; 