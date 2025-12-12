import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../services/api';
import RequesterSidebar from '../components/RequesterSidebar';
import Header from '../components/Header';
import { getCurrentLocationWithAddress } from '../utils/geocoding';

function Search() {
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [usedLocation, setUsedLocation] = useState(null);
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedBloodGroup, setSelectedBloodGroup] = useState('');
  const [showAllDonors, setShowAllDonors] = useState(false);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [autoRequestsSent, setAutoRequestsSent] = useState([]); // Track donors who received auto-requests
  const navigate = useNavigate();
  
  const [search, setSearch] = useState({
    bloodGroup: '',
    address: '',
    radius: 20, // Default to 20km
    lat: '',
    lng: ''
  });
  
  const [filters, setFilters] = useState({
    availableOnly: false,
    maxDistance: 20,
    bloodGroupFilter: '',
    autoApply: false,
    autoRequest: false, // New: Enable automatic request sending
    mlEnhanced: false, // New: Use ML-enhanced search
    sortBy: 'distance' // 'distance', 'compatibility', 'availability', 'ml_score'
  });

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  // Safe toast wrapper to prevent errors
  const safeToast = {
    success: (message) => {
      try {
        toast.success(message);
      } catch (error) {
        console.error('Toast success error:', error);
      }
    },
    error: (message) => {
      try {
        toast.error(message);
      } catch (error) {
        console.error('Toast error error:', error);
      }
    },
    info: (message) => {
      try {
        toast.info(message);
      } catch (error) {
        console.error('Toast info error:', error);
      }
    },
    warn: (message) => {
      try {
        toast.warn(message);
      } catch (error) {
        console.error('Toast warn error:', error);
      }
    }
  };

  // Blood group compatibility mapping for PLASMA donation
  // Key: requester blood type -> Array: donor blood types that can give plasma
  const bloodCompatibility = {
    'A+': { canReceiveFrom: ['A+', 'A-', 'AB+', 'AB-'], description: 'Can receive plasma from A+, A-, AB+, AB- donors' },
    'A-': { canReceiveFrom: ['A-', 'AB-'], description: 'Can receive plasma from A-, AB- donors' },
    'B+': { canReceiveFrom: ['B+', 'B-', 'AB+', 'AB-'], description: 'Can receive plasma from B+, B-, AB+, AB- donors' },
    'B-': { canReceiveFrom: ['B-', 'AB-'], description: 'Can receive plasma from B-, AB- donors' },
    'AB+': { canReceiveFrom: ['AB+'], description: 'Can only receive plasma from AB+ donors' },
    'AB-': { canReceiveFrom: ['AB+', 'AB-'], description: 'Can receive plasma from AB+, AB- donors' },
    'O+': { canReceiveFrom: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], description: 'Universal plasma recipient - can receive from all donors' },
    'O-': { canReceiveFrom: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], description: 'Universal plasma recipient - can receive from all donors' }
  };

  // Check if a donor can donate to the requested blood group
  const isCompatible = (donorBloodGroup, requestedBloodGroup) => {
    const compatibility = bloodCompatibility[requestedBloodGroup];
    return compatibility?.canReceiveFrom?.includes(donorBloodGroup) || false;
  };

  // Alias for consistency - both functions do the same thing
  const isBloodCompatible = isCompatible;

  useEffect(() => {
    // Fetch user data
    const fetchUser = async () => {
      try {
        const userRes = await api.get('/profile');
        setUser(userRes.data);
      } catch (err) {
        // Silent fail for user data fetch
      }
    };
    fetchUser();
  }, []);

  // Debug effect to monitor filteredResults
  useEffect(() => {
    console.log('filteredResults changed:', filteredResults);
    console.log('filteredResults type:', typeof filteredResults);
    console.log('filteredResults isArray:', Array.isArray(filteredResults));
    if (filteredResults && typeof filteredResults === 'object' && !Array.isArray(filteredResults)) {
      console.log('filteredResults object keys:', Object.keys(filteredResults));
    }
  }, [filteredResults]);

  // Cleanup toasts on component unmount to prevent errors
  useEffect(() => {
    return () => {
      try {
        toast.dismiss();
      } catch (error) {
        console.error('Error dismissing toasts:', error);
      }
    };
  }, []);

  // Function to send manual request to a specific donor
  const sendRequestToDonor = async (donor) => {
    try {
      safeToast.info(`📤 Sending request to ${donor.name}...`);
      
      const requestData = {
        donorId: donor._id,
        bloodGroup: search.bloodGroup,
        requesterInfo: {
          name: user?.name || 'Anonymous Requester',
          phone: user?.phoneNumber || 'Contact via platform',
          email: user?.email || 'Not provided',
          location: usedLocation?.address || 'Location not specified',
          urgency: 'urgent',
          message: `Urgent request for ${search.bloodGroup} plasma donation. Please respond if available.`
        }
      };
      
      const response = await api.post('/donation/request', requestData);
      
      if (response.data.success) {
        safeToast.success(`✅ Request sent to ${donor.name} successfully!`);
        safeToast.info(`📱 ${donor.name} has been notified and will respond soon.`);
      } else {
        safeToast.error(`❌ Failed to send request to ${donor.name}`);
      }
    } catch (error) {
      console.error('Error sending request:', error);
      safeToast.error(`❌ Error sending request to ${donor.name}: ${error.message}`);
    }
  };

  // Function to send automatic requests to compatible donors with detailed feedback
  const sendAutoRequestsToCompatibleDonors = async (compatibleDonors) => {
    if (!compatibleDonors || compatibleDonors.length === 0) {
      return;
    }

    try {
      safeToast.info(`🚀 Automatically sending requests to ${compatibleDonors.length} compatible donors...`);
      
      const sentRequests = [];
      const failedRequests = [];
      
      // Send requests to each compatible donor individually for better tracking
      for (const donor of compatibleDonors) {
        try {
          const requestData = {
            donorId: donor._id,
            bloodGroup: search.bloodGroup,
            requesterInfo: {
              name: user?.name || 'Anonymous Requester',
              phone: user?.phoneNumber || 'Contact via platform',
              email: user?.email || 'Not provided',
              location: usedLocation?.address || 'Location not specified',
              urgency: 'urgent',
              message: `Urgent request for ${search.bloodGroup} plasma donation. Compatible donor needed immediately.`
            }
          };
          
          const response = await api.post('/donation/request', requestData);
          
          if (response.data.success) {
            sentRequests.push(donor);
            // Track this donor as having received an auto-request
            setAutoRequestsSent(prev => [...prev, donor._id]);
            // Individual success notification for each donor
            safeToast.success(`✅ Request sent to ${donor.name} (${donor.bloodGroup})`);
          } else {
            failedRequests.push(donor);
          }
        } catch (error) {
          console.error(`Error sending request to ${donor.name}:`, error);
          failedRequests.push(donor);
        }
      }
      
      // Summary notifications
      if (sentRequests.length > 0) {
        const donorNames = sentRequests.map(d => d.name).join(', ');
        safeToast.success(`🎯 Auto-requests successfully sent to ${sentRequests.length} donors: ${donorNames}`);
        safeToast.info(`📱 Donors have been notified with your contact details. Expect responses within 2-4 hours.`);
      }
      
      if (failedRequests.length > 0) {
        const failedNames = failedRequests.map(d => d.name).join(', ');
        safeToast.error(`❌ Failed to send requests to: ${failedNames}`);
        safeToast.info(`💡 You can try contacting these donors manually using their phone numbers.`);
      }
      
    } catch (error) {
      console.error('Error in auto-request process:', error);
      safeToast.error(`❌ Error sending automatic requests: ${error.message}`);
    }
  };

  // Function to send batch requests to all compatible donors
  const sendBatchRequests = async (compatibleDonors) => {
    if (!compatibleDonors || compatibleDonors.length === 0) {
      safeToast.warn('No compatible donors to send requests to.');
      return;
    }

    try {
      safeToast.info(`📤 Sending batch requests to ${compatibleDonors.length} compatible donors...`);
      
      const batchRequestData = {
        bloodGroup: search.bloodGroup,
        donorIds: compatibleDonors.map(d => d._id),
        requesterInfo: {
          name: user?.name || 'Anonymous Requester',
          phone: user?.phoneNumber || 'Contact via platform',
          email: user?.email || 'Not provided',
          location: usedLocation?.address || 'Location not specified',
          urgency: 'urgent',
          message: `Urgent request for ${search.bloodGroup} plasma donation. Please respond if available.`
        }
      };
      
      const response = await api.post('/donation/batch-request', batchRequestData);
      
      if (response.data.success) {
        const sentCount = response.data.requests_sent || compatibleDonors.length;
        safeToast.success(`✅ Batch requests sent to ${sentCount} compatible donors!`);
        safeToast.info(`📱 All compatible donors have been notified. Expect responses within 2-4 hours.`);
      } else {
        safeToast.error('❌ Failed to send batch requests');
      }
    } catch (error) {
      console.error('Error sending batch requests:', error);
      safeToast.error(`❌ Error sending batch requests: ${error.message}`);
    }
  };

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    if (name === 'lat' || name === 'lng') {
      setSearch(prev => ({ ...prev, [name]: parseFloat(value) || '' }));
    } else {
      setSearch(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    // Auto-apply filters if enabled
    if (filters.autoApply) {
      setTimeout(() => applyFilters(), 100); // Small delay to ensure state is updated
    } else {
      // Reset filters applied state when filters change
      setFiltersApplied(false);
    }
  };

  const applyFilters = () => {
    if (!Array.isArray(results)) {
      console.error('Results is not an array:', results);
      setFilteredResults([]);
      return;
    }
    let filtered = [...results];

    // Filter by availability
    if (filters.availableOnly) {
      filtered = filtered.filter(donor => donor.isAvailable);
    }

    // Filter by max distance
    if (filters.maxDistance) {
      filtered = filtered.filter(donor => (donor.distance || 0) <= filters.maxDistance);
    }

    // Filter by blood group
    if (filters.bloodGroupFilter) {
      filtered = filtered.filter(donor => donor.bloodGroup === filters.bloodGroupFilter);
    }

    // Sort results
    filtered.sort((a, b) => {
      if (filters.sortBy === 'distance') {
        return (a.distance || 0) - (b.distance || 0);
      } else if (filters.sortBy === 'compatibility' && search.bloodGroup) {
        const aCompatible = isCompatible(a.bloodGroup, search.bloodGroup);
        const bCompatible = isCompatible(b.bloodGroup, search.bloodGroup);
        if (aCompatible !== bCompatible) {
          return bCompatible ? 1 : -1; // Compatible first
        }
        return (a.distance || 0) - (b.distance || 0); // Then by distance
      } else if (filters.sortBy === 'availability') {
        if (a.isAvailable !== b.isAvailable) {
          return b.isAvailable ? 1 : -1; // Available first
        }
        return (a.distance || 0) - (b.distance || 0); // Then by distance
      } else if (filters.sortBy === 'ml_score') {
        return (b.ml_score || 0) - (a.ml_score || 0); // Higher ML score first
      } else if (filters.sortBy === 'compatibility_score') {
        return (b.compatibility_score || 0) - (a.compatibility_score || 0); // Higher compatibility score first
      }
      return 0;
    });

    setFilteredResults(filtered);
    setFiltersApplied(true);
    safeToast.success(`Applied filters: ${filtered.length} donors found`);
  };

  const clearFilters = () => {
    setFilteredResults([]);
    setFiltersApplied(false);
    setFilters({
      availableOnly: false,
      maxDistance: 20,
      bloodGroupFilter: '',
      autoApply: false,
      autoRequest: false,
      mlEnhanced: false,
      sortBy: 'distance'
    });
    safeToast.info('Filters cleared');
  };

  const clearLocationCache = () => {
    // Clear any stored location data
    setUsedLocation(null);
    setSearch(prev => ({ 
      ...prev, 
      lat: '', 
      lng: '',
      address: ''
    }));
    safeToast.info('📍 Location cache cleared. Ready for fresh location request.');
  };

  const checkIPLocation = async () => {
    try {
      safeToast.info('🌐 Checking your IP-based location...');
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      console.log('IP Geolocation data:', data);
      
      if (data.country_name) {
        if (data.country_name === 'India') {
          safeToast.success(`🇮🇳 IP location: ${data.city}, ${data.region}, India - This confirms you're in India!`);
          
          // Optionally set this as location if GPS fails
          if (!usedLocation && data.latitude && data.longitude) {
            const ipLocation = {
              lat: parseFloat(data.latitude),
              lng: parseFloat(data.longitude),
              address: `${data.city}, ${data.region}, India (IP-based)`,
              timestamp: new Date().toISOString(),
              isInIndia: true,
              source: 'IP'
            };
            
            setUsedLocation(ipLocation);
            setSearch(prev => ({ 
              ...prev, 
              lat: ipLocation.lat, 
              lng: ipLocation.lng,
              address: ipLocation.address
            }));
            
            safeToast.info('📍 Using IP-based location as fallback. For more accuracy, try GPS location.');
          }
        } else {
          safeToast.warn(`🌍 IP location shows: ${data.country_name} - You might be using a VPN. Try disabling it for accurate location.`);
        }
      }
    } catch (error) {
      console.error('IP location check failed:', error);
      safeToast.error('Failed to check IP location');
    }
  };

  const handleUseMyLocation = async () => {
    setSearching(true);
    setSearchError('');
    
    try {
      safeToast.info('🌐 Getting your location using IP-based detection for accuracy...');
      
      // First try IP-based location (more reliable for actual country)
      let ipLocationData = null;
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        console.log('IP Geolocation data:', data);
        
        if (data.latitude && data.longitude && data.country_name) {
          ipLocationData = {
            lat: parseFloat(data.latitude),
            lng: parseFloat(data.longitude),
            address: `${data.city || 'Unknown City'}, ${data.region || 'Unknown State'}, ${data.country_name}`,
            country: data.country_name,
            city: data.city,
            region: data.region,
            source: 'IP-based',
            isInIndia: data.country_name === 'India'
          };
          
          console.log('IP location detected:', ipLocationData);
          
          if (data.country_name === 'India') {
            safeToast.success(`🇮🇳 IP location detected: ${ipLocationData.address}`);
            
            setUsedLocation({ 
              ...ipLocationData,
              timestamp: new Date().toISOString(),
              accuracy: 'City-level (IP-based)'
            });
            setSearch(prev => ({ 
              ...prev, 
              lat: ipLocationData.lat, 
              lng: ipLocationData.lng,
              address: ipLocationData.address
            }));
            
            setSearching(false);
            return; // Use IP location if it shows India
          } else {
            safeToast.warn(`🌍 IP location shows: ${data.country_name} - You might be using a VPN. Trying GPS as fallback...`);
          }
        }
      } catch (ipError) {
        console.error('IP location failed:', ipError);
        safeToast.info('📍 IP location failed, trying GPS location...');
      }
      
      // Fallback to GPS if IP location fails or shows non-India location
      if (!navigator.geolocation) {
        setSearchError('Geolocation is not supported by your browser');
        safeToast.error('Geolocation is not supported by your browser');
        setSearching(false);
        return;
      }

      const locationData = await getCurrentLocationWithAddress();
      
      console.log('GPS location data received:', locationData);
      
      // Check if GPS coordinates seem to be in India (rough bounds)
      const isInIndia = locationData.lat >= 6 && locationData.lat <= 37 && 
                       locationData.lng >= 68 && locationData.lng <= 97;
      
      if (!isInIndia && ipLocationData && ipLocationData.country !== 'India') {
        // Both GPS and IP show non-India, likely VPN issue
        safeToast.error(`⚠️ Both GPS (${locationData.lat.toFixed(4)}, ${locationData.lng.toFixed(4)}) and IP location show non-India location. Please disable VPN or use manual Indian city selection.`);
      }
      
      const finalLocation = {
        lat: locationData.lat, 
        lng: locationData.lng,
        address: locationData.address,
        timestamp: new Date().toISOString(),
        accuracy: locationData.accuracy,
        isInIndia: isInIndia,
        source: 'GPS',
        ipCountry: ipLocationData?.country || 'Unknown'
      };
      
      setUsedLocation(finalLocation);
      setSearch(prev => ({ 
        ...prev, 
        lat: locationData.lat, 
        lng: locationData.lng,
        address: locationData.address || `${locationData.lat.toFixed(4)}, ${locationData.lng.toFixed(4)}`
      }));
      
      if (locationData.address) {
        const addressLower = locationData.address.toLowerCase();
        const seemsIndia = addressLower.includes('india') || addressLower.includes('mumbai') || 
                          addressLower.includes('delhi') || addressLower.includes('bangalore') ||
                          addressLower.includes('pune') || addressLower.includes('hyderabad') ||
                          addressLower.includes('chennai') || addressLower.includes('kolkata');
        
        if (!seemsIndia && !isInIndia) {
          safeToast.error(`📍 GPS Location: ${locationData.address} - This appears to be outside India!`);
          safeToast.info('💡 Recommendation: Use the Indian city buttons above or disable VPN for accurate location');
        } else {
          safeToast.success(`📍 GPS Location found: ${locationData.address}`);
        }
      } else {
        safeToast.success(`📍 GPS Coordinates: ${locationData.lat.toFixed(4)}, ${locationData.lng.toFixed(4)}`);
      }
      
    } catch (error) {
      console.error('Location error:', error);
      setSearchError(`Failed to get your location: ${error.message}`);
      safeToast.error(`Failed to get your location: ${error.message}`);
      
      // Provide user with helpful instructions
      if (error.message.includes('permission') || error.message.includes('denied')) {
        safeToast.info('💡 Please allow location access in your browser settings and try again.');
      } else if (error.message.includes('timeout')) {
        safeToast.info('💡 Location request timed out. Try refreshing the page and ensure you have a good internet connection.');
      } else if (error.message.includes('unavailable')) {
        safeToast.info('💡 Please ensure GPS is enabled and you have a good network connection.');
      }
    } finally {
      setSearching(false);
    }
  };

  const handleSearchAllDonors = async () => {
    setSearching(true);
    setSearchError('');
    setResults([]);

    try {
      console.log('Searching for all available donors...');

      // Try multiple approaches to get donors
      let donorsData = [];
      
      try {
        // First try: Search with very large radius to get all donors
        const response1 = await api.get('/search/donors', { 
          params: {
            lat: search.lat || 19.0760,
            lng: search.lng || 72.8777,
            radius: 1000 // Very large radius
          }
        });
        
        // Handle API response structure: { matches: [...], compatible_count: 0, total_donors: 22 }
        if (response1.data && response1.data.matches) {
          donorsData = response1.data.matches;
        } else if (Array.isArray(response1.data)) {
          donorsData = response1.data;
        } else {
          donorsData = [];
        }
        console.log('Large radius search result:', donorsData.length, 'donors');
      } catch (error1) {
        console.log('Large radius search failed:', error1.message);
        
        try {
          // Second try: Use the all-donors endpoint
          const response2 = await api.get('/search/all-donors');
          
          // Handle all-donors response: { totalUsers: X, totalDonors: Y, allUsers: [...] }
          if (response2.data && response2.data.allUsers) {
            donorsData = response2.data.allUsers.filter(user => user.role === 'donor');
          } else if (Array.isArray(response2.data)) {
            donorsData = response2.data;
          } else {
            donorsData = [];
          }
          console.log('All donors search result:', donorsData.length, 'donors');
        } catch (error2) {
          console.log('All donors search failed:', error2.message);
          
          // Third try: Search without any parameters
          try {
            const response3 = await api.get('/search/donors');
            
            // Handle response structure
            if (response3.data && response3.data.matches) {
              donorsData = response3.data.matches;
            } else if (Array.isArray(response3.data)) {
              donorsData = response3.data;
            } else {
              donorsData = [];
            }
            console.log('Fallback search result:', donorsData.length, 'donors');
          } catch (error3) {
            console.log('Fallback search failed:', error3.message);
            throw error3;
          }
        }
      }
      
      setResults(donorsData);
      setFilteredResults(donorsData);
      setFiltersApplied(false);
      setShowAllDonors(true);
      
      if (donorsData.length === 0) {
        safeToast.warning('No donors found in the database. Please check if donors are registered.');
      } else {
        safeToast.success(`Found ${donorsData.length} donor(s) in the database`);
        
        // Show breakdown by blood group if we have a blood group selected
        if (search.bloodGroup) {
          const compatibleDonors = donorsData.filter(donor => 
            isCompatible(donor.bloodGroup, search.bloodGroup)
          );
          const availableDonors = donorsData.filter(donor => donor.isAvailable);
          
          safeToast.info(`🩸 ${compatibleDonors.length} compatible donors for ${search.bloodGroup}, ${availableDonors.length} currently available`);
        }
      }
    } catch (error) {
      console.error('Show All Donors error:', error);
      setSearchError('Failed to search for donors. Please try again.');
      safeToast.error(`Search failed: ${error.message}`);
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearching(true);
    setSearchError('');
    setResults([]);
    setAutoRequestsSent([]); // Clear previous auto-request tracking

    try {
      const params = {
        bloodGroup: search.bloodGroup,
        radius: search.radius,
        autoRequest: true, // Always enable auto-request for AI search
        requesterInfo: {
          name: user?.name || 'Anonymous Requester',
          phone: user?.phoneNumber || 'Contact via platform',
          email: user?.email || 'Not provided',
          urgency: 'urgent' // Can be 'normal', 'urgent', 'critical'
        }
      };

      // Use location from geolocation if available, otherwise use address or default location
      if (usedLocation) {
        params.lat = usedLocation.lat;
        params.lng = usedLocation.lng;
        console.log('Using geolocation:', params.lat, params.lng);
      } else if (search.lat && search.lng) {
        params.lat = search.lat;
        params.lng = search.lng;
        console.log('Using manual coordinates:', params.lat, params.lng);
      } else if (search.address) {
        params.address = search.address;
        console.log('Using address:', params.address);
      } else {
        // Provide default location (Mumbai) if no location is provided
        params.lat = 19.0760;
        params.lng = 72.8777;
        safeToast.info('🌍 No location provided. Using Mumbai as default location. Please use "Use My Current Location" for better results.');
        console.log('Using default location (Mumbai):', params.lat, params.lng);
      }

      console.log('Enhanced Search parameters:', params);

      // Try AI-enhanced search first, fallback to traditional if needed
      let response;
      let isAISearch = false;
      
      try {
        console.log('Attempting AI search with params:', params);
        response = await api.get('/search/ml', { params });
        isAISearch = true;
        console.log('AI Search response:', response.data);
        
        // Process AI search results
        const aiResults = response.data.matches || [];
        console.log('AI Search Response Data:', response.data);
        
        // Convert ML results to standard donor format
        const processedResults = aiResults.map(match => ({
          _id: match.donor_id,
          name: match.donor_name,
          bloodGroup: match.donor_blood_group,
          phoneNumber: match.donor_phone,
          isAvailable: true,
          location: match.location || { address: 'Location not specified' },
          distance: match.distance,
          ml_score: match.ml_score,
          compatibility_score: match.compatibility_score,
          fraud_risk: match.fraud_risk
        }));
        
        setResults(processedResults);
        setFilteredResults(processedResults);
        setFiltersApplied(false);
        
        if (aiResults.length === 0) {
          safeToast.info('No compatible donors found using AI search. Trying traditional search...');
          // Force fallback to traditional search
          throw new Error('No AI results, trying traditional search');
        } else {
          // Filter compatible donors for auto-request
          const compatibleDonors = processedResults.filter(donor => 
            isBloodCompatible(search.bloodGroup, donor.bloodGroup)
          );
          
          // Enhanced auto-request feedback
          let message = `🤖 AI found ${aiResults.length} donor(s)`;
          
          // Check for auto-request results from API response
          if (response.data.auto_requests_sent && response.data.auto_requests_sent > 0) {
            message += ` and automatically sent ${response.data.auto_requests_sent} requests!`;
            safeToast.success(message);
            
            // Show detailed auto-request info
            safeToast.info(`📞 Automatic requests sent to compatible donors with your contact details!`);
            
            // Show which donors received requests from API response
            if (response.data.notified_donors && response.data.notified_donors.length > 0) {
              const donorNames = response.data.notified_donors.map(d => d.name || 'Donor').join(', ');
              safeToast.success(`✅ Requests sent to: ${donorNames}`);
            }
            
            // Show expected response time
            safeToast.info(`⏰ Donors typically respond within 2-4 hours. Check your messages!`);
            
          } else if (compatibleDonors.length > 0) {
            // If API didn't send auto-requests, send them manually
            message += ` with ${compatibleDonors.length} compatible match(es)`;
            safeToast.success(message);
            
            // Send automatic requests to compatible donors
            await sendAutoRequestsToCompatibleDonors(compatibleDonors);
            
          } else {
            // If no compatible donors found
            message += ` but none are blood-compatible for ${search.bloodGroup}`;
            safeToast.warn(message);
            
            if (processedResults.length > 0) {
              safeToast.info(`📋 Review donors below - some may still be able to help in emergency situations.`);
            }
          }
          
          // Show blood compatibility info
          if (search.bloodGroup && aiResults.length > 0) {
            const compatibleCount = aiResults.filter(donor => {
              return isBloodCompatible(search.bloodGroup, donor.donor_blood_group);
            }).length;
            
            if (compatibleCount > 0) {
              safeToast.info(`🩸 ${compatibleCount} donors are blood-compatible for plasma donation to ${search.bloodGroup} recipient`);
            }
          }
          
          // Show ML-specific info
          if (response.data.message) {
            safeToast.info(`🧠 AI Insight: ${response.data.message}`);
          }
        }
        
      } catch (aiError) {
        console.log('AI search failed, falling back to traditional search:', aiError.message);
        
        // Fallback to traditional search
        try {
          console.log('Attempting traditional search with params:', params);
          response = await api.get('/search/donors', { params });
          console.log('Traditional Search response:', response.data);
          
          // Handle API response structure: { matches: [...] }
          let traditionalResults = [];
          if (response.data && response.data.matches) {
            traditionalResults = response.data.matches;
          } else if (Array.isArray(response.data)) {
            traditionalResults = response.data;
          }
          setResults(traditionalResults);
          setFilteredResults(traditionalResults);
          setFiltersApplied(false);
          
          if (traditionalResults.length === 0) {
            safeToast.warning('No donors found in your area. Try increasing the search radius or removing location filters.');
            // Try a broader search without location constraints
            console.log('Trying broader search without strict location constraints...');
            const broadResponse = await api.get('/search/donors', { 
              params: { 
                bloodGroup: params.bloodGroup,
                radius: 100 // Increase radius
              } 
            });
            
            // Handle broader search API response structure
            let broadResults = [];
            if (broadResponse.data && broadResponse.data.matches) {
              broadResults = broadResponse.data.matches;
            } else if (Array.isArray(broadResponse.data)) {
              broadResults = broadResponse.data;
            }
            setResults(broadResults);
            setFilteredResults(broadResults);
            
            if (broadResults.length > 0) {
              safeToast.success(`Found ${broadResults.length} donor(s) in a broader search area`);
            }
          } else {
            safeToast.success(`Found ${traditionalResults.length} donor(s) in your area`);
            
            // Try to send automatic requests to compatible donors
            const compatibleDonors = traditionalResults.filter(donor => 
              search.bloodGroup ? isCompatible(donor.bloodGroup, search.bloodGroup) : true
            );
            
            if (compatibleDonors.length > 0 && search.bloodGroup) {
              safeToast.info(`🎯 Found ${compatibleDonors.length} compatible donor(s) for blood group ${search.bloodGroup}!`);
              
              // Send requests to compatible donors (simulate auto-request)
              try {
                for (const donor of compatibleDonors.slice(0, 3)) { // Limit to first 3 compatible donors
                  await api.post(`/donation/request/${donor._id}`, { 
                    bloodGroup: search.bloodGroup,
                    autoRequest: true
                  });
                }
                safeToast.success(`📤 Automatic requests sent to ${Math.min(compatibleDonors.length, 3)} compatible donors!`);
              } catch (requestError) {
                console.log('Auto-request failed:', requestError.message);
              }
            }
          }
        } catch (traditionalError) {
          console.error('Traditional search also failed:', traditionalError);
          safeToast.error('Search failed. Please check your connection and try again.');
        }
      }
      
      if (isAISearch) {
        safeToast.info('🧠 AI algorithms were used to find the best matches and send automatic requests!');
      }
      
    } catch (error) {
      console.error('Search error:', error);
      if (error.response?.status === 403) {
        safeToast.error('Request blocked due to suspicious activity. Please contact support.');
      } else {
        setSearchError('Failed to search for donors. Please try again.');
        safeToast.error('Search failed');
      }
    } finally {
      setSearching(false);
    }
  };

  const handleRequest = async (donorId) => {
    // Find the donor from results
    const donor = filteredResults.find(d => d._id === donorId);
    if (donor) {
      await sendRequestToDonor(donor);
    } else {
      safeToast.error('Donor not found');
    }
  };

  // ML-enhanced search with automatic requests
  const handleMLSearch = async (e) => {
    e.preventDefault();
    setSearching(true);
    setSearchError('');
    setResults([]);

    try {
      const params = {
        bloodGroup: search.bloodGroup,
        radius: search.radius,
        autoRequest: filters.autoRequest || false
      };

      // Use location from geolocation if available, otherwise use coordinates
      if (usedLocation) {
        params.lat = usedLocation.lat;
        params.lng = usedLocation.lng;
      } else if (search.lat && search.lng) {
        params.lat = search.lat;
        params.lng = search.lng;
      } else {
        setSearchError('Please provide a location or use "Use My Current Location"');
        setSearching(false);
        return;
      }

      console.log('ML Search parameters:', params);

      const response = await api.get('/search/ml', { params });
      console.log('ML Search response:', response.data);
      console.log('ML Search matches:', response.data.matches);
      console.log('Is matches array?', Array.isArray(response.data.matches));
      
      const matchesData = Array.isArray(response.data.matches) ? response.data.matches : [];
      setResults(matchesData);
      setFilteredResults(matchesData); 
      setFiltersApplied(false);
      
      if (response.data.matches?.length === 0) {
        safeToast.info('No compatible donors found using ML algorithm. Try adjusting your search criteria.');
      } else {
        let message = `Found ${response.data.matches.length} compatible donor(s) using ML algorithm`;
        if (response.data.auto_requests_sent > 0) {
          message += `. Sent ${response.data.auto_requests_sent} automatic requests.`;
        }
        safeToast.success(message);
      }

      // Show additional info about ML results
      if (response.data.ml_used) {
        safeToast.info('🤖 ML algorithms were used to find the best matches for you!');
      }

    } catch (error) {
      console.error('ML Search error:', error);
      if (error.response?.status === 403) {
        safeToast.error('Request blocked due to suspicious activity. Please contact support.');
      } else {
        setSearchError('Failed to search for donors. Please try again.');
        safeToast.error('ML Search failed');
      }
    } finally {
      setSearching(false);
    }
  };



  // Check fraud status
  const handleFraudCheck = async () => {
    try {
      const response = await api.get('/search/fraud');
      
      if (response.data.is_fraud) {
        safeToast.error(`⚠️ Fraud detected! Risk score: ${(response.data.fraud_score * 100).toFixed(1)}%`);
        if (response.data.suspicious_indicators?.length > 0) {
          safeToast.warn(`Suspicious activities: ${response.data.suspicious_indicators.join(', ')}`);
        }
      } else {
        safeToast.success('✅ No fraud detected. Your account appears legitimate.');
      }
    } catch (error) {
      console.error('Fraud check error:', error);
      safeToast.error('Failed to check fraud status');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
  };

  const getDistanceColor = (distance) => {
    if (distance <= 5) return 'text-green-600 font-semibold';
    if (distance <= 15) return 'text-yellow-600 font-semibold';
    return 'text-red-600 font-semibold';
  };

  const getAvailabilityBadge = (available) => {
    return available ? 
      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Available</span> :
      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Unavailable</span>;
  };

  return (
    <div className="min-h-screen flex bg-red-50 text-gray-800">
      <RequesterSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <Header user={user} onLogout={handleLogout} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-red-800">Find Plasma Donors</h1>
          
          {/* Search Form */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6 border border-red-200">
            <h2 className="text-xl font-semibold mb-4 text-red-700">Search Criteria</h2>
            <form onSubmit={handleSearch} className="space-y-4">
              
              {/* Blood Group Selection */}
              <div>
                <label className="block text-red-700 font-semibold mb-2">Blood Group Needed</label>
                <select
                  name="bloodGroup"
                  value={search.bloodGroup}
                  onChange={handleSearchChange}
                  className="w-full border p-3 rounded border-red-300 focus:ring-2 focus:ring-red-600 text-sm sm:text-base"
                  required
                >
                  <option value="">Select Blood Group You Need</option>
                  {bloodGroups.map(bg => (
                    <option key={bg} value={bg}>{bg} - {bloodCompatibility[bg]?.description}</option>
                  ))}
                </select>
                {search.bloodGroup && (
                  <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200 text-xs text-blue-700">
                    <strong>Compatibility:</strong> {bloodCompatibility[search.bloodGroup]?.description}
                  </div>
                )}
              </div>

              {/* Location Section */}
              <div className="space-y-3">
                <label className="block text-red-700 font-semibold mb-2">Location</label>
                
                {/* Coordinate Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Latitude</label>
                    <input
                      type="number"
                      name="lat"
                      value={search.lat}
                      onChange={handleSearchChange}
                      step="any"
                      className="w-full border p-2 rounded border-red-300 focus:ring-2 focus:ring-red-600 text-sm"
                      placeholder="e.g. 19.0760"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Longitude</label>
                    <input
                      type="number"
                      name="lng"
                      value={search.lng}
                      onChange={handleSearchChange}
                      step="any"
                      className="w-full border p-2 rounded border-red-300 focus:ring-2 focus:ring-red-600 text-sm"
                      placeholder="e.g. 72.8777"
                    />
                  </div>
                </div>
                
                {/* Address Input */}
                <input
                  type="text"
                  name="address"
                  value={search.address}
                  onChange={handleSearchChange}
                  className="w-full border p-3 rounded border-red-300 focus:ring-2 focus:ring-red-600 text-sm sm:text-base"
                  placeholder="Enter your address or city"
                />
                
                {/* Location Buttons */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    className="bg-green-600 text-white px-4 py-3 rounded hover:bg-green-700 transition text-sm sm:text-base flex items-center justify-center"
                    onClick={async () => {
                      setSearching(true);
                      try {
                        safeToast.info('🌐 Using IP-based location for accuracy...');
                        const response = await fetch('https://ipapi.co/json/');
                        const data = await response.json();
                        
                        if (data.latitude && data.longitude) {
                          const ipLocation = {
                            lat: parseFloat(data.latitude),
                            lng: parseFloat(data.longitude),
                            address: `${data.city || 'Unknown City'}, ${data.region || 'Unknown State'}, ${data.country_name || 'Unknown Country'}`,
                            timestamp: new Date().toISOString(),
                            isInIndia: data.country_name === 'India',
                            source: 'IP-based',
                            accuracy: 'City-level (IP-based)'
                          };
                          
                          setUsedLocation(ipLocation);
                          setSearch(prev => ({ 
                            ...prev, 
                            lat: ipLocation.lat, 
                            lng: ipLocation.lng,
                            address: ipLocation.address
                          }));
                          
                          if (data.country_name === 'India') {
                            safeToast.success(`🇮🇳 IP location set: ${ipLocation.address}`);
                          } else {
                            safeToast.warn(`🌍 IP location: ${ipLocation.address} - Consider disabling VPN for Indian location`);
                          }
                        }
                      } catch (error) {
                        safeToast.error('Failed to get IP location');
                      } finally {
                        setSearching(false);
                      }
                    }}
                    disabled={searching}
                  >
                    {searching ? 'Getting IP Location...' : '🌐 Use IP Location (Recommended)'}
                  </button>
                  
                  <button
                    type="button"
                    className="bg-blue-600 text-white px-4 py-3 rounded hover:bg-blue-700 transition text-sm sm:text-base flex items-center justify-center"
                    onClick={handleUseMyLocation}
                    disabled={searching}
                  >
                    {searching ? 'Getting Location...' : '� Use GPS Location'}
                  </button>
                  
                  {usedLocation && (
                    <button
                      type="button"
                      className="bg-orange-600 text-white px-4 py-3 rounded hover:bg-orange-700 transition text-sm sm:text-base flex items-center justify-center"
                      onClick={handleUseMyLocation}
                      disabled={searching}
                    >
                      {searching ? 'Refreshing...' : '🔄 Refresh Location'}
                    </button>
                  )}
                  
                  <button
                    type="button"
                    className="bg-green-600 text-white px-4 py-3 rounded hover:bg-green-700 transition text-sm sm:text-base flex items-center justify-center"
                    onClick={handleSearchAllDonors}
                    disabled={searching}
                  >
                    {searching ? 'Searching...' : '🔍 Show All Donors (20km)'}
                  </button>
                </div>

                {/* Current Location Display */}
                {usedLocation && (
                  <div className={`mt-3 p-3 border rounded-lg ${usedLocation.isInIndia !== false ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex justify-between items-start">
                      <div className={`text-sm flex-grow ${usedLocation.isInIndia !== false ? 'text-blue-800' : 'text-red-800'}`}>
                        <strong>📍 Current Location {usedLocation.source === 'IP-based' ? '(IP-based)' : '(GPS)'}:</strong> 
                        {usedLocation.isInIndia === false && <span className="text-red-600 font-bold"> ⚠️ OUTSIDE INDIA</span>}
                        {usedLocation.isInIndia === true && usedLocation.source === 'IP-based' && <span className="text-green-600 font-bold"> ✅ INDIA (IP-based)</span>}
                        <div className="mt-1">
                          {usedLocation.address || `${usedLocation.lat.toFixed(4)}, ${usedLocation.lng.toFixed(4)}`}
                        </div>
                        <div className={`text-xs mt-1 ${usedLocation.isInIndia !== false ? 'text-blue-600' : 'text-red-600'}`}>
                          Coordinates: {usedLocation.lat.toFixed(6)}, {usedLocation.lng.toFixed(6)}
                          {usedLocation.accuracy && ` • Accuracy: ${typeof usedLocation.accuracy === 'string' ? usedLocation.accuracy : Math.round(usedLocation.accuracy) + 'm'}`}
                        </div>
                        <div className={`text-xs mt-1 ${usedLocation.isInIndia !== false ? 'text-blue-500' : 'text-red-500'}`}>
                          Source: {usedLocation.source || 'GPS'} • Updated: {new Date(usedLocation.timestamp).toLocaleTimeString()}
                        </div>
                        {usedLocation.isInIndia === false && (
                          <div className="text-xs text-red-700 mt-2 font-semibold">
                            💡 Try: Use "🌐 Use IP Location" button or disable VPN for accurate location
                          </div>
                        )}
                        {usedLocation.source === 'IP-based' && usedLocation.isInIndia === true && (
                          <div className="text-xs text-green-700 mt-2 font-semibold">
                            ✅ Using IP-based location for accuracy - this should reflect your actual location in India
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        className="ml-3 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                        onClick={clearLocationCache}
                        title="Clear current location and enter manually"
                      >
                        ✕ Clear
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Search Radius */}
              <div>
                <label className="block text-red-700 font-semibold mb-2">
                  Search Radius: {search.radius} km
                </label>
                <input
                  type="range"
                  name="radius"
                  min="5"
                  max="100"
                  value={search.radius}
                  onChange={handleSearchChange}
                  className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>5km</span>
                  <span>50km</span>
                  <span>100km</span>
                </div>
              </div>

              {/* Search Buttons */}
              <div className="space-y-3">
                <button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-red-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold shadow hover:from-red-700 hover:to-purple-700 transition text-sm sm:text-base"
                  disabled={searching}
                >
                  {searching ? '🔍 🤖 Searching with AI...' : '🔍 🤖 Smart Search (AI-Powered)'}
                </button>
                
                <button 
                  type="button"
                  onClick={() => handleSearchAllDonors()}
                  className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-3 px-6 rounded-lg font-semibold shadow hover:from-blue-700 hover:to-green-700 transition text-sm sm:text-base"
                  disabled={searching}
                >
                  {searching ? 'Searching...' : '🌍 Search All Available Donors'}
                </button>
                
                {/* Debug Information */}
                <div className="text-xs text-gray-600 p-2 bg-gray-50 rounded">
                  <strong>Debug Info:</strong> Search form ready • Server on port 5000 • API working • Geolocation: {navigator.geolocation ? '✅ Supported' : '❌ Not supported'}
                  <br />
                  <strong>Form State:</strong> Blood Group: {search.bloodGroup || 'Not selected'} • 
                  Location: {search.lat && search.lng ? `${search.lat}, ${search.lng}` : (usedLocation ? `${usedLocation.lat}, ${usedLocation.lng}` : 'Not set')}
                  <br />
                  <strong>Location Status:</strong> {usedLocation ? `✅ Using live location (${usedLocation.address ? 'with address' : 'coordinates only'})` : search.address ? `📍 Using manual address: ${search.address}` : '❌ No location set'}
                </div>
                
                {/* Indian Cities Quick Location Buttons */}
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">🇮🇳 Quick Set Indian City Location:</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                    <button 
                      type="button"
                      onClick={() => {
                        const mumbaiCoords = { lat: 19.0760, lng: 72.8777 };
                        setUsedLocation({ ...mumbaiCoords, address: 'Mumbai, Maharashtra, India', timestamp: new Date().toISOString(), isInIndia: true });
                        setSearch(prev => ({ ...prev, ...mumbaiCoords, address: 'Mumbai, Maharashtra, India' }));
                        safeToast.success('📍 Location set to Mumbai, India');
                      }}
                      className="bg-orange-600 text-white py-2 px-3 rounded text-xs hover:bg-orange-700 transition"
                    >
                      🏙️ Mumbai
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        const delhiCoords = { lat: 28.6139, lng: 77.2090 };
                        setUsedLocation({ ...delhiCoords, address: 'New Delhi, Delhi, India', timestamp: new Date().toISOString(), isInIndia: true });
                        setSearch(prev => ({ ...prev, ...delhiCoords, address: 'New Delhi, Delhi, India' }));
                        safeToast.success('📍 Location set to Delhi, India');
                      }}
                      className="bg-orange-600 text-white py-2 px-3 rounded text-xs hover:bg-orange-700 transition"
                    >
                      🏛️ Delhi
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        const bangaloreCoords = { lat: 12.9716, lng: 77.5946 };
                        setUsedLocation({ ...bangaloreCoords, address: 'Bangalore, Karnataka, India', timestamp: new Date().toISOString(), isInIndia: true });
                        setSearch(prev => ({ ...prev, ...bangaloreCoords, address: 'Bangalore, Karnataka, India' }));
                        safeToast.success('📍 Location set to Bangalore, India');
                      }}
                      className="bg-orange-600 text-white py-2 px-3 rounded text-xs hover:bg-orange-700 transition"
                    >
                      🌆 Bangalore
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        const puneCoords = { lat: 18.5204, lng: 73.8567 };
                        setUsedLocation({ ...puneCoords, address: 'Pune, Maharashtra, India', timestamp: new Date().toISOString(), isInIndia: true });
                        setSearch(prev => ({ ...prev, ...puneCoords, address: 'Pune, Maharashtra, India' }));
                        safeToast.success('📍 Location set to Pune, India');
                      }}
                      className="bg-orange-600 text-white py-2 px-3 rounded text-xs hover:bg-orange-700 transition"
                    >
                      🏘️ Pune
                    </button>
                  </div>
                </div>

                {/* Quick Setup & Test Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setSearch(prev => ({
                        ...prev,
                        bloodGroup: 'A+',
                        lat: 12.9716,
                        lng: 77.5946,
                        radius: 100
                      }));
                      safeToast.info('🎯 Form filled with test data: A+ blood group in Bangalore');
                    }}
                    className="bg-blue-600 text-white py-2 px-4 rounded text-sm hover:bg-blue-700 transition"
                  >
                    📝 Fill Test Data (A+ Bangalore)
                  </button>
                  
                  <button 
                    type="button"
                    onClick={async () => {
                      try {
                        const testResponse = await api.get('/search/ml', { 
                          params: { 
                            bloodGroup: 'A+', 
                            lat: 12.9716, 
                            lng: 77.5946, 
                            radius: 100, 
                            autoRequest: true 
                          } 
                        });
                        safeToast.success(`🧪 API Test: Found ${testResponse.data.matches?.length || 0} matches`);
                        console.log('Test API response:', testResponse.data);
                      } catch (error) {
                        safeToast.error(`🧪 API Test failed: ${error.message}`);
                        console.error('Test API error:', error);
                      }
                    }}
                    className="bg-yellow-600 text-white py-2 px-4 rounded text-sm hover:bg-yellow-700 transition"
                  >
                    🧪 Test API Direct Call
                  </button>
                </div>
              </div>

              {/* AI Features Info */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                <h3 className="text-sm font-semibold mb-3 text-purple-800">🤖 Smart Search Features (Always Active)</h3>
                <div className="grid grid-cols-1 gap-3">
                  <div className="text-sm text-purple-700">
                    ✅ <strong>Auto-Compatible Matching:</strong> AI finds donors with matching blood groups<br/>
                    ✅ <strong>Automatic Requests:</strong> System sends requests to compatible donors instantly<br/>
                    ✅ <strong>Contact Sharing:</strong> Phone numbers shared when blood groups match<br/>
                    ✅ <strong>Fraud Protection:</strong> Real-time safety monitoring<br/>
                    ✅ <strong>Smart Scoring:</strong> ML algorithms rank best matches
                  </div>
                  
                  <div className="flex gap-2 pt-2">                    
                    <button
                      type="button"
                      onClick={handleFraudCheck}
                      className="bg-orange-500 text-white px-3 py-2 rounded text-xs hover:bg-orange-600 transition w-full"
                    >
                      🛡️ Check Safety
                    </button>
                  </div>
                </div>
                <p className="text-xs text-purple-600 mt-3 p-2 bg-white rounded">
                  <strong>How it works:</strong> When you search, AI automatically finds compatible donors, checks blood group matching, 
                  and sends requests with your contact details to suitable donors. No separate action needed!
                </p>
              </div>

              {/* Location Status */}
              {usedLocation && (
                <div className="text-sm text-gray-700 p-3 bg-green-50 rounded border border-green-200">
                  <span className="font-semibold">📍 Search Location: </span>
                  <span>{usedLocation.address || `Lat: ${usedLocation.lat.toFixed(4)}, Lng: ${usedLocation.lng.toFixed(4)}`}</span>
                </div>
              )}
              
              {searchError && (
                <div className="text-red-500 p-3 bg-red-50 rounded border border-red-200">
                  ⚠️ {searchError}
                </div>
              )}
            </form>
          </div>

          {/* Filters */}
          {results.length > 0 && (
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6 border border-red-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-red-700">Filters</h2>
                {filtersApplied && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    Filters Applied
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="availableOnly"
                      checked={filters.availableOnly}
                      onChange={handleFilterChange}
                      className="mr-2"
                    />
                    <span className="text-sm">Available donors only</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Distance</label>
                  <select
                    name="maxDistance"
                    value={filters.maxDistance}
                    onChange={handleFilterChange}
                    className="w-full border p-2 rounded text-sm"
                  >
                    <option value={10}>10 km</option>
                    <option value={25}>25 km</option>
                    <option value={50}>50 km</option>
                    <option value={100}>100 km</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Blood Group Filter</label>
                  <select
                    name="bloodGroupFilter"
                    value={filters.bloodGroupFilter}
                    onChange={handleFilterChange}
                    className="w-full border p-2 rounded text-sm"
                  >
                    <option value="">All Blood Groups</option>
                    {bloodGroups.map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Additional Filter Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium mb-1">Sort By</label>
                  <select
                    name="sortBy"
                    value={filters.sortBy}
                    onChange={handleFilterChange}
                    className="w-full border p-2 rounded text-sm"
                  >
                    <option value="distance">Distance (Nearest First)</option>
                    <option value="compatibility">Compatibility (If blood group selected)</option>
                    <option value="availability">Availability (Available First)</option>
                    <option value="ml_score">🤖 AI Compatibility Score</option>
                    <option value="compatibility_score">🧬 Overall Match Score</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="autoApply"
                      checked={filters.autoApply}
                      onChange={handleFilterChange}
                      className="mr-2"
                    />
                    <span className="text-sm">Auto-apply filters</span>
                  </label>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={applyFilters}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-medium transition-colors"
                >
                  🔍 Apply Filters
                </button>
                <button
                  onClick={clearFilters}
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 text-sm font-medium transition-colors"
                >
                  🗑️ Clear Filters
                </button>
                {filtersApplied && (
                  <span className="text-sm text-gray-600 flex items-center">
                    Showing {filteredResults.length} of {results.length} donors
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Results */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-red-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              <h2 className="text-xl font-semibold text-red-700">
                Results ({filteredResults.length} donors found)
              </h2>
              
              {/* Batch Request Button */}
              {filteredResults.length > 0 && search.bloodGroup && (
                <div className="mt-2 sm:mt-0">
                  {(() => {
                    const compatibleDonors = filteredResults.filter(d => 
                      isBloodCompatible(search.bloodGroup, d.bloodGroup)
                    );
                    return compatibleDonors.length > 0 && (
                      <button
                        onClick={() => sendBatchRequests(compatibleDonors)}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm font-medium flex items-center gap-2"
                        title={`Send requests to all ${compatibleDonors.length} compatible donors`}
                      >
                        📤 Send to All Compatible ({compatibleDonors.length})
                      </button>
                    );
                  })()}
                </div>
              )}
            </div>
            
            {/* Auto-Request Status */}
            {filteredResults.length > 0 && search.bloodGroup && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
                  🤖 AI Auto-Request Status
                </h3>
                {(() => {
                  const aiDonors = filteredResults.filter(d => d.ml_score || d.compatibility_score);
                  const compatibleDonors = filteredResults.filter(d => isBloodCompatible(search.bloodGroup, d.bloodGroup));
                  const aiCompatibleDonors = aiDonors.filter(d => isBloodCompatible(search.bloodGroup, d.bloodGroup));
                  
                  return (
                    <div className="space-y-2">
                      {autoRequestsSent.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <span className="text-green-600 font-semibold">✅</span>
                          <span className="text-sm">
                            <strong>{autoRequestsSent.length} auto-requests successfully sent</strong> to compatible donors
                          </span>
                        </div>
                      ) : aiCompatibleDonors.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <span className="text-blue-600 font-semibold">🤖</span>
                          <span className="text-sm">
                            <strong>{aiCompatibleDonors.length} compatible donors</strong> found by AI - sending auto-requests...
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-orange-600 font-semibold">⏳</span>
                          <span className="text-sm">No AI-compatible donors found yet. Use manual requests below.</span>
                        </div>
                      )}
                      
                      {autoRequestsSent.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-green-600 font-semibold">📱</span>
                          <span className="text-sm">
                            Donors have been automatically notified with your contact details
                          </span>
                        </div>
                      )}
                      
                      {compatibleDonors.length > aiCompatibleDonors.length && (
                        <div className="flex items-center gap-2">
                          <span className="text-blue-600 font-semibold">📤</span>
                          <span className="text-sm">
                            <strong>{compatibleDonors.length - aiCompatibleDonors.length} additional compatible donors</strong> available for manual requests
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Search Summary */}
            {filteredResults.length > 0 && (
              <div className="mb-4 p-3 bg-gray-50 rounded border">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Search Summary</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {search.bloodGroup ? (
                    <>
                      <div className="text-center">
                        <div className="font-bold text-green-600">
                          {filteredResults.filter(d => isCompatible(d.bloodGroup, search.bloodGroup)).length}
                        </div>
                        <div className="text-gray-600">Compatible</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-red-600">
                          {filteredResults.filter(d => !isCompatible(d.bloodGroup, search.bloodGroup)).length}
                        </div>
                        <div className="text-gray-600">Incompatible</div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <div className="font-bold text-blue-600">
                        {filteredResults.length}
                      </div>
                      <div className="text-gray-600">Total Donors</div>
                    </div>
                  )}
                  <div className="text-center">
                    <div className="font-bold text-blue-600">
                      {filteredResults.filter(d => d.distance <= 10).length}
                    </div>
                    <div className="text-gray-600">Within 10km</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-purple-600">
                      {filteredResults.filter(d => d.isAvailable).length}
                    </div>
                    <div className="text-gray-600">Available</div>
                  </div>
                </div>
                {!search.bloodGroup && (
                  <div className="mt-2 text-xs text-gray-600">
                    💡 Select a blood group above to see compatibility information
                  </div>
                )}
              </div>
            )}
            
            {searching ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Searching for donors in your area...</p>
              </div>
            ) : !Array.isArray(filteredResults) || filteredResults.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-gray-600 text-lg">No donors found in your area</p>
                <p className="text-gray-500 text-sm mt-2">Try increasing the search radius or checking back later</p>
                {!Array.isArray(filteredResults) && (
                  <p className="text-red-500 text-xs mt-2">Debug: filteredResults is not an array: {typeof filteredResults}</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {Array.isArray(filteredResults) && filteredResults
                  .map(donor => ({
                    ...donor,
                    isCompatible: search.bloodGroup ? isCompatible(donor.bloodGroup, search.bloodGroup) : true,
                    compatibilityMessage: search.bloodGroup 
                      ? (isCompatible(donor.bloodGroup, search.bloodGroup)
                          ? `✅ Compatible: ${donor.bloodGroup} can donate to ${search.bloodGroup}`
                          : `❌ Incompatible: ${donor.bloodGroup} cannot donate to ${search.bloodGroup}`)
                      : `📋 Blood Group: ${donor.bloodGroup}`
                  }))
                  .filter(donor => {
                    // If blood group is selected, only show compatible donors
                    if (search.bloodGroup) {
                      return donor.isCompatible;
                    }
                    // If no blood group selected, show all donors
                    return true;
                  })
                  .sort((a, b) => {
                    // Sort by compatibility first (if blood group selected), then by distance
                    if (search.bloodGroup && a.isCompatible !== b.isCompatible) {
                      return b.isCompatible ? 1 : -1;
                    }
                    return (a.distance || 0) - (b.distance || 0);
                  })
                  .map((donor, index) => {
                    // Generate rank display for all donors (1st, 2nd, 3rd, 4th...)
                    const getRankSuffix = (num) => {
                      const j = num % 10;
                      const k = num % 100;
                      if (j === 1 && k !== 11) return "st";
                      if (j === 2 && k !== 12) return "nd";
                      if (j === 3 && k !== 13) return "rd";
                      return "th";
                    };
                    
                    // Calculate rank for all donors based on their position
                    const rank = index + 1;
                    const rankDisplay = `${rank}${getRankSuffix(rank)}`;
                    
                    return (
                      <div key={donor._id} className={`p-4 border rounded-lg hover:shadow-md transition-shadow relative ${
                        search.bloodGroup 
                          ? (donor.isCompatible 
                              ? 'border-green-200 bg-green-50' 
                              : 'border-red-200 bg-red-50')
                          : 'border-gray-200 bg-white'
                      }`}>
                        {/* Rank Badge - Show for all donors */}
                        <div className="absolute top-2 right-2">
                          <div className={`flex items-center gap-1 px-3 py-1 rounded-full font-bold text-sm shadow-md ${
                            rank === 1 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900' :
                            rank === 2 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800' :
                            rank === 3 ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-orange-900' :
                            'bg-gradient-to-r from-blue-400 to-blue-500 text-white'
                          }`}>
                            {rank === 1 && '🥇'}
                            {rank === 2 && '🥈'}
                            {rank === 3 && '🥉'}
                            {rank > 3 && '🏅'}
                            <span>{rankDisplay} Rank</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-red-700 text-lg">{donor.name}</h3>
                              <span className="text-lg font-bold text-red-600">({donor.bloodGroup})</span>
                              {getAvailabilityBadge(donor.isAvailable)}
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-1">
                                <span className="text-gray-500">📍</span>
                                <span>{donor.location?.address || 'Location not specified'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-gray-500">📏</span>
                                <span className={getDistanceColor(donor.distance || 0)}>
                                  {donor.distance ? `${donor.distance.toFixed(1)} km away` : 'Distance unknown'}
                                </span>
                              </div>
                            </div>

                            {/* Contact Information - Show prominently for compatible donors */}
                            {donor.isCompatible && (donor.donor_phone || donor.phoneNumber) && (
                              <div className="mt-3 p-3 bg-green-100 rounded-lg border border-green-300">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-green-700 font-semibold">📞 Contact Available:</span>
                                  {autoRequestsSent.includes(donor._id) ? (
                                    <span className="px-2 py-1 bg-green-200 text-green-800 rounded-full text-xs">
                                      ✅ Request Sent to {donor.name}
                                    </span>
                                  ) : (
                                    <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded-full text-xs">
                                      📋 Ready to Contact
                                    </span>
                                  )}
                                </div>
                                <div className="text-lg font-bold text-green-800">
                                  {donor.donor_phone || donor.phoneNumber}
                                </div>
                                <div className="text-xs text-green-600 mt-1">
                                  Contact this donor directly for immediate assistance
                                </div>
                              </div>
                            )}

                            {/* AI/ML Information */}
                            {(donor.ml_score || donor.compatibility_score) && (
                              <div className="mt-2 flex gap-2 flex-wrap">
                                <div className="flex items-center gap-1">
                                  <span className="text-purple-500">🤖</span>
                                  <span className="font-medium text-purple-600 text-xs">
                                    AI Score: {((donor.compatibility_score || donor.ml_score || 0) * 100).toFixed(1)}%
                                  </span>
                                </div>
                                {donor.isCompatible && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-green-500">🎯</span>
                                    <span className="font-medium text-green-600 text-xs">Perfect Match</span>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            <div className="mt-2">
                              <p className={`text-sm font-medium ${
                                search.bloodGroup 
                                  ? (donor.isCompatible ? 'text-green-700' : 'text-red-700')
                                  : 'text-gray-700'
                              }`}>
                                {donor.compatibilityMessage}
                              </p>
                            </div>
                            
                            {donor.lastDonationDate && (
                              <div className="mt-2 text-xs text-gray-500">
                                Last donation: {new Date(donor.lastDonationDate).toLocaleDateString()}
                              </div>
                            )}
                            
                            {donor.fraud_risk !== undefined && donor.fraud_risk > 0 && (
                              <div className="mt-2 text-xs">
                                <span className={`px-2 py-1 rounded-full ${
                                  donor.fraud_risk > 0.5 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  ⚠️ Risk Level: {(donor.fraud_risk * 100).toFixed(1)}%
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            {/* Show different button states based on compatibility and auto-request status */}
                            {autoRequestsSent.includes(donor._id) ? (
                              // This specific donor received an auto-request
                              <div className="text-center">
                                <div className="px-3 py-2 bg-green-100 text-green-800 rounded text-xs font-medium mb-2">
                                  ✅ Auto-Request Sent to {donor.name}
                                </div>
                                <div className="text-xs text-green-600 mb-2">
                                  Request automatically sent at {new Date().toLocaleTimeString()}
                                </div>
                                <button
                                  onClick={() => handleRequest(donor._id)}
                                  className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 text-sm font-medium"
                                  title="Send another request to this donor"
                                >
                                  📤 Send Follow-up
                                </button>
                              </div>
                            ) : donor.isCompatible && (donor.ml_score || donor.compatibility_score) ? (
                              // Compatible donor found via AI but no auto-request tracked
                              <div className="text-center">
                                <div className="px-3 py-2 bg-blue-100 text-blue-800 rounded text-xs font-medium mb-2">
                                  🤖 AI Matched Donor
                                </div>
                                <button
                                  onClick={() => handleRequest(donor._id)}
                                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm font-medium"
                                  title="Send request to this AI-matched donor"
                                >
                                  📤 Send Request
                                </button>
                              </div>
                            ) : (
                              // Manual request button for other donors
                              <button
                                onClick={() => handleRequest(donor._id)}
                                disabled={search.bloodGroup && !donor.isCompatible}
                                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                                  search.bloodGroup && !donor.isCompatible
                                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                    : donor.isCompatible 
                                      ? 'bg-green-600 text-white hover:bg-green-700'
                                      : 'bg-red-600 text-white hover:bg-red-700'
                                }`}
                                title={search.bloodGroup && !donor.isCompatible 
                                  ? 'Blood groups are not compatible' 
                                  : donor.isCompatible
                                    ? 'Send request to compatible donor'
                                    : 'Request plasma from this donor'}
                              >
                                {search.bloodGroup && !donor.isCompatible 
                                  ? 'Incompatible' 
                                  : donor.isCompatible
                                    ? '📤 Send Request'
                                    : 'Request Plasma'}
                              </button>
                            )}
                            
                            <button
                              onClick={() => navigate(`/chat/${donor._id}`)}
                              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                            >
                              💬 Chat
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Search; 
