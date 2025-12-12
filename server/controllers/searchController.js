const User = require('../models/User');
const AutoRequest = require('../models/AutoRequest');
const mlService = require('../services/mlService');

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Search donors by blood group, location, radius, and availability
exports.searchDonors = async (req, res) => {
  try {
    const { bloodGroup, lat, lng, radius = 10, isAvailable } = req.query;
    
    // If no location provided, return all donors
    if (!lat || !lng) {
      return exports.showAllDonors(req, res);
    }

    // Build query - search for all donors, let client filter by blood group compatibility
    const query = {
      role: 'donor',
      'location.lat': { $exists: true, $ne: null },
      'location.lng': { $exists: true, $ne: null }
      // Removed bloodGroup filter to allow searching all donors
    };

    // Only filter by availability if explicitly requested
    if (isAvailable !== undefined) {
      query.isAvailable = isAvailable === 'true';
    }

    // Get all donors and filter by distance
    const allDonors = await User.find(query).select('-password');
    
    // Blood group compatibility mapping for PLASMA donation
    // Key: donor blood type -> Array: requester blood types that can receive
    const plasmaCompatibility = {
      'A+': ['A+', 'A-'], // A+ donor can give plasma to A+ and A- requesters
      'A-': ['A+', 'A-', 'AB+', 'AB-'], // A- donor can give plasma to A and AB requesters  
      'B+': ['B+', 'B-'], // B+ donor can give plasma to B+ and B- requesters
      'B-': ['B+', 'B-', 'AB+', 'AB-'], // B- donor can give plasma to B and AB requesters
      'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], // AB+ universal plasma donor
      'AB-': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], // AB- universal plasma donor
      'O+': ['O+'], // O+ donor can only give plasma to O+ requesters
      'O-': ['O+', 'O-'] // O- donor can give plasma to O+ and O- requesters
    };

    const isCompatible = (donorBlood, requesterBlood) => {
      return plasmaCompatibility[donorBlood]?.includes(requesterBlood) || false;
    };
    
    // Calculate ranking score for each donor
    const calculateRankingScore = (donor, distance, isCompatible, requesterBloodGroup) => {
      let score = 0;
      
      // 1. Blood Compatibility (40% weight) - Most important
      if (isCompatible) {
        score += 40;
        // Bonus for exact blood match
        if (donor.bloodGroup === requesterBloodGroup) {
          score += 5;
        }
      }
      
      // 2. Distance Score (30% weight) - Closer is better
      const maxDistance = parseFloat(radius) || 50;
      const distanceScore = Math.max(0, (1 - (distance / maxDistance)) * 30);
      score += distanceScore;
      
      // 3. Activity Status (20% weight)
      if (donor.isAvailable) {
        score += 20;
      }
      // Bonus for recently active donors
      if (donor.lastActive) {
        const daysSinceActive = (Date.now() - new Date(donor.lastActive).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceActive < 7) {
          score += 5; // Active within last week
        } else if (daysSinceActive < 30) {
          score += 3; // Active within last month
        }
      }
      
      // 4. Donation History (10% weight)
      const successfulDonations = donor.successfulDonations || 0;
      if (successfulDonations > 0) {
        score += Math.min(10, successfulDonations * 2); // Cap at 10 points
      }
      
      return score;
    };
    
    // Filter by distance and add compatibility info
    const donors = allDonors
      .map(donor => {
        const distance = calculateDistance(
          parseFloat(lat), 
          parseFloat(lng), 
          donor.location.lat, 
          donor.location.lng
        );
        
        const compatible = bloodGroup && isCompatible(donor.bloodGroup, bloodGroup);
        const rankingScore = calculateRankingScore(donor, distance, compatible, bloodGroup);
        
        const donorData = {
          ...donor.toObject(),
          distance: distance, // Keep distance in kilometers
          isCompatible: compatible,
          rankingScore: rankingScore
        };

        // Add phone number for compatible donors
        if (compatible) {
          donorData.donor_phone = donor.phoneNumber;
        }

        return donorData;
      })
      .filter(donor => donor.distance <= parseFloat(radius))
      .sort((a, b) => {
        // Sort by ranking score (higher is better)
        // This automatically prioritizes:
        // 1. Blood compatible donors first
        // 2. Then closer distance
        // 3. Then active status
        // 4. Then donation history
        return b.rankingScore - a.rankingScore;
      });

    console.log(`Found ${donors.length} donors within ${radius}km radius`);
    const compatibleDonors = donors.filter(d => d.isCompatible);
    console.log(`Found ${compatibleDonors.length} compatible donors`);

    // If we have compatible donors and user is authenticated, send automatic requests
    if (req.user && compatibleDonors.length > 0 && bloodGroup) {
      try {
        const requester = await User.findById(req.user.id).select('-password');
        if (requester) {
          // Create match objects for auto-request function
          const matches = compatibleDonors.slice(0, 3).map(donor => ({
            donor_id: donor._id,
            donor_name: donor.name,
            donor_blood_group: donor.bloodGroup,
            donor_phone: donor.phoneNumber,
            compatibility_score: 0.9, // High score for blood compatible
            distance: donor.distance,
            ml_score: 0.9,
            location: donor.location,
            fraud_risk: 0
          }));

          const autoRequests = await sendAutomaticRequests(requester, matches);
          
          return res.json({
            ...donors,
            matches: donors, // For compatibility with frontend
            auto_requests_sent: autoRequests.length,
            auto_requests: autoRequests,
            compatible_count: compatibleDonors.length,
            message: `Found ${donors.length} donors (${compatibleDonors.length} compatible) and sent ${autoRequests.length} automatic requests`
          });
        }
      } catch (autoRequestError) {
        console.error('Auto-request error:', autoRequestError);
        // Continue with normal response if auto-request fails
      }
    }

    res.json({
      matches: donors, // For compatibility with frontend
      compatible_count: compatibleDonors.length,
      total_donors: donors.length
    });
  } catch (err) {
    console.error('Search donors error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Search recipients by blood group, location, and radius
exports.searchRecipients = async (req, res) => {
  try {
    const { bloodGroup, lat, lng, radius = 10 } = req.query;
    if (!lat || !lng) return res.status(400).json({ msg: 'Latitude and longitude are required' });

    // Build query
    const query = {
      role: 'requester',
      'location.lat': { $exists: true, $ne: null },
      'location.lng': { $exists: true, $ne: null },
      ...(bloodGroup && { bloodGroup })
    };

    // Get all recipients and filter by distance
    const allRecipients = await User.find(query).select('-password');
    
    // Filter by distance
    const recipients = allRecipients
      .map(recipient => {
        const distance = calculateDistance(
          parseFloat(lat), 
          parseFloat(lng), 
          recipient.location.lat, 
          recipient.location.lng
        );
        return {
          ...recipient.toObject(),
          distance: distance // Keep distance in kilometers
        };
      })
      .filter(recipient => recipient.distance <= parseFloat(radius))
      .sort((a, b) => a.distance - b.distance);

    res.json(recipients);
  } catch (err) {
    console.error('Search recipients error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
}; 

// Debug endpoint to check all donors
exports.debugDonors = async (req, res) => {
  try {
    const allDonors = await User.find({ role: 'donor' }).select('-password');
    
    const donorsWithInfo = allDonors.map(donor => ({
      id: donor._id,
      name: donor.name,
      email: donor.email,
      bloodGroup: donor.bloodGroup,
      isAvailable: donor.isAvailable,
      location: donor.location,
      role: donor.role,
      createdAt: donor.createdAt
    }));
    
    res.json({
      totalDonors: allDonors.length,
      users: donorsWithInfo,  // For compatibility with debug script
      donors: donorsWithInfo
    });
  } catch (err) {
    console.error('Debug donors error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
}; 

// Test distance calculation
exports.testDistance = async (req, res) => {
  try {
    const { lat1, lng1, lat2, lng2 } = req.query;
    
    if (!lat1 || !lng1 || !lat2 || !lng2) {
      return res.status(400).json({ 
        msg: 'Please provide lat1, lng1, lat2, lng2 parameters' 
      });
    }
    
    const distance = calculateDistance(
      parseFloat(lat1), 
      parseFloat(lng1), 
      parseFloat(lat2), 
      parseFloat(lng2)
    );
    
    res.json({
      point1: { lat: lat1, lng: lng1 },
      point2: { lat: lat2, lng: lng2 },
      distance: distance,
      distanceKm: distance,
      distanceMeters: distance * 1000
    });
  } catch (err) {
    console.error('Test distance error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
}; 

// Show all donors without any filters (for debugging)
exports.showAllDonors = async (req, res) => {
  try {
    const allUsers = await User.find({}).select('-password');
    const donors = allUsers.filter(user => user.role === 'donor');
    
    res.json({
      totalUsers: allUsers.length,
      totalDonors: donors.length,
      allUsers: allUsers.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bloodGroup: user.bloodGroup,
        isAvailable: user.isAvailable,
        location: user.location
      }))
    });
  } catch (err) {
    console.error('Show all donors error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// ML-enhanced search with automatic request sending
exports.searchDonorsML = async (req, res) => {
  try {
    const { bloodGroup, lat, lng, radius = 10, autoRequest = false } = req.query;
    
    if (!lat || !lng) return res.status(400).json({ msg: 'Latitude and longitude are required' });
    if (!bloodGroup) return res.status(400).json({ msg: 'Blood group is required' });

    // Get requester data if authenticated
    let requester = null;
    let requesterId = null;
    
    if (req.user && req.user.id) {
      requesterId = req.user.id;
      requester = await User.findById(requesterId).select('-password');
      
      if (!requester) {
        return res.status(404).json({ msg: 'Requester not found' });
      }
    } else {
      // Create a temporary requester object for non-authenticated search
      requester = {
        _id: null,
        name: 'Anonymous',
        bloodGroup: bloodGroup,
        location: { lat: parseFloat(lat), lng: parseFloat(lng) },
        email: null,
        phoneNumber: null
      };
    }

    // Check for fraud before processing (only for authenticated users)
    if (requesterId) {
      try {
        const requesterObj = requester.toObject ? requester.toObject() : requester;
        const fraudCheck = await mlService.detectFraud(requesterObj);
        if (fraudCheck && fraudCheck.is_fraud) {
          // Mark user as suspicious
          await User.findByIdAndUpdate(requesterId, { 
            suspiciousActivity: true,
            $inc: { requestFrequency: 1 }
          });

          return res.status(403).json({ 
            msg: 'Request blocked due to suspicious activity',
            fraud_indicators: fraudCheck.suspicious_indicators,
            fraud_score: fraudCheck.fraud_score
          });
        }

        // Update requester's request frequency
        await User.findByIdAndUpdate(requesterId, { 
          $inc: { requestFrequency: 1 },
          lastRequestTime: new Date()
        });
      } catch (fraudError) {
        console.log('Fraud check failed, continuing without it:', fraudError.message);
      }
    }

    // Build query for donors
    const query = {
      role: 'donor',
      'location.lat': { $exists: true, $ne: null },
      'location.lng': { $exists: true, $ne: null },
      isAvailable: true
    };
    
    // Exclude self only if authenticated
    if (requesterId) {
      query._id = { $ne: requesterId };
    }

    // Get all available donors
    const allDonors = await User.find(query).select('-password');
    


    // Filter by distance first
    const nearbyDonors = allDonors
      .map(donor => {
        const distance = calculateDistance(
          parseFloat(lat), 
          parseFloat(lng), 
          donor.location.lat, 
          donor.location.lng
        );
        return {
          ...donor.toObject(),
          distance: distance
        };
      })
      .filter(donor => donor.distance <= parseFloat(radius));



    // Use ML for enhanced matching
    const requesterData = {
      ...(requester.toObject ? requester.toObject() : requester),
      location: { lat: parseFloat(lat), lng: parseFloat(lng) }
    };

    let matchingResult;
    try {
      matchingResult = await mlService.enhancedMatching(requesterData, nearbyDonors);
    } catch (mlError) {
      console.error('ML matching failed, using basic matching:', mlError.message);
      // Fallback to basic matching if ML fails
      matchingResult = {
        matches: nearbyDonors.map(donor => ({
          donor_id: donor._id,
          donor_name: donor.name,
          donor_blood_group: donor.bloodGroup,
          donor_phone: donor.phoneNumber,
          compatibility_score: 0.8,
          distance: donor.distance,
          ml_score: 0.8,
          location: donor.location,
          fraud_risk: 0,
          blood_compatibility_score: 1.0
        })),
        ml_used: false,
        total_donors_analyzed: nearbyDonors.length,
        algorithm: 'Basic compatibility'
      };
    }
    
    // If auto-request is enabled and we have good matches (only for authenticated users)
    if (autoRequest === 'true' && matchingResult.matches.length > 0 && requesterId && requester._id) {
      const autoRequests = await sendAutomaticRequests(requester, matchingResult.matches);
      
      return res.json({
        ...matchingResult,
        auto_requests_sent: autoRequests.length,
        auto_requests: autoRequests,
        compatible_donors: matchingResult.matches.filter(m => m.compatibility_score > 0.8),
        message: `Found ${matchingResult.matches.length} compatible donors and sent ${autoRequests.length} automatic requests`
      });
    }

    // Add compatible donors information for non-authenticated users
    const compatibleDonors = matchingResult.matches.filter(match => 
      match.compatibility_score > 0.7 || match.blood_compatibility_score >= 1.0
    );
    
    res.json({
      ...matchingResult,
      compatible_donors: compatibleDonors,
      total_compatible: compatibleDonors.length,
      message: `Found ${matchingResult.matches.length} donors (${compatibleDonors.length} compatible) using AI matching`
    });
  } catch (err) {
    console.error('ML search error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Send automatic requests to compatible donors
async function sendAutomaticRequests(requester, matches) {
  const autoRequests = [];
  
  for (const match of matches.slice(0, 3)) { // Send to top 3 matches
    try {
      // Check if request already exists
      const existingRequest = await AutoRequest.findOne({
        requesterId: requester._id,
        donorId: match.donor_id,
        status: { $in: ['pending', 'accepted'] },
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Within last 24 hours
      });

      if (existingRequest) {
        console.log(`Request already exists for donor ${match.donor_id}`);
        continue;
      }

      // Get full donor information
      const donor = await User.findById(match.donor_id);
      if (!donor) continue;

      // Create automatic request
      const autoRequest = new AutoRequest({
        requesterId: requester._id,
        donorId: match.donor_id,
        requesterBloodGroup: requester.bloodGroup,
        donorBloodGroup: match.donor_blood_group,
        compatibilityScore: match.compatibility_score,
        mlScore: match.ml_score,
        distance: match.distance,
        urgencyLevel: 'medium',
        message: `Automatic blood donation request from ${requester.name}. Blood type needed: ${requester.bloodGroup}`,
        requesterContact: {
          name: requester.name,
          phone: requester.phoneNumber,
          email: requester.email,
          location: requester.location
        },
        donorContact: {
          name: donor.name,
          phone: donor.phoneNumber,
          email: donor.email,
          location: donor.location
        },
        fraudScore: match.fraud_risk || 0
      });

      await autoRequest.save();
      autoRequests.push({
        request_id: autoRequest._id,
        donor_id: match.donor_id,
        donor_name: match.donor_name,
        donor_phone: match.donor_phone,
        compatibility_score: match.compatibility_score,
        distance: match.distance
      });

      console.log(`Automatic request sent to donor ${match.donor_name} (${match.donor_id})`);
    } catch (error) {
      console.error(`Failed to send auto request to donor ${match.donor_id}:`, error);
    }
  }

  return autoRequests;
}

// Get automatic requests for current user (donor)
exports.getAutoRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    // Build query
    const query = { donorId: userId };
    if (status) {
      query.status = status;
    }

    const requests = await AutoRequest.find(query)
      .populate('requesterId', 'name email bloodGroup location phoneNumber')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AutoRequest.countDocuments(query);

    res.json({
      requests,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error('Get auto requests error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Respond to automatic request
exports.respondToAutoRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { response, message } = req.body; // response: 'accept' or 'reject'
    const donorId = req.user.id;

    const autoRequest = await AutoRequest.findOne({
      _id: requestId,
      donorId: donorId,
      status: 'pending'
    }).populate('requesterId', 'name email phoneNumber');

    if (!autoRequest) {
      return res.status(404).json({ msg: 'Request not found or already responded' });
    }

    // Update request status
    autoRequest.status = response === 'accept' ? 'accepted' : 'rejected';
    autoRequest.responseAt = new Date();
    if (message) {
      autoRequest.message += `\n\nDonor response: ${message}`;
    }

    await autoRequest.save();

    // Update user statistics
    if (response === 'accept') {
      await User.findByIdAndUpdate(donorId, { 
        $inc: { successfulDonations: 1 },
        lastDonationDate: new Date()
      });
      
      await User.findByIdAndUpdate(autoRequest.requesterId, { 
        $inc: { successfulDonations: 1 }
      });
    }

    res.json({
      msg: `Request ${response}ed successfully`,
      request: autoRequest
    });
  } catch (err) {
    console.error('Respond to auto request error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Check user for fraud
exports.checkFraud = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const fraudResult = await mlService.detectFraud(user.toObject());
    
    // Update user's suspicious activity flag if fraud detected
    if (fraudResult.is_fraud) {
      await User.findByIdAndUpdate(userId, { 
        suspiciousActivity: true 
      });
    }

    res.json({
      user_id: userId,
      user_name: user.name,
      ...fraudResult
    });
  } catch (err) {
    console.error('Check fraud error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Get fraud statistics
exports.getFraudStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({});
    const suspiciousUsers = await User.countDocuments({ suspiciousActivity: true });
    const fraudulentRequests = await AutoRequest.countDocuments({ isFraudulent: true });
    const totalRequests = await AutoRequest.countDocuments({});

    res.json({
      total_users: totalUsers,
      suspicious_users: suspiciousUsers,
      fraud_percentage: totalUsers > 0 ? (suspiciousUsers / totalUsers * 100).toFixed(2) : 0,
      fraudulent_requests: fraudulentRequests,
      total_requests: totalRequests,
      request_fraud_percentage: totalRequests > 0 ? (fraudulentRequests / totalRequests * 100).toFixed(2) : 0
    });
  } catch (err) {
    console.error('Get fraud stats error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
}; 