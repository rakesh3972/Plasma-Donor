const DonationHistory = require('../models/DonationHistory');
const User = require('../models/User');

// Blood group compatibility mapping
const bloodCompatibility = {
  'A+': ['A+', 'AB+'],
  'A-': ['A+', 'A-', 'AB+', 'AB-'],
  'B+': ['B+', 'AB+'],
  'B-': ['B+', 'B-', 'AB+', 'AB-'],
  'AB+': ['AB+'],
  'AB-': ['AB+', 'AB-'],
  'O+': ['A+', 'B+', 'AB+', 'O+'],
  'O-': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
};

// Check if donor can donate to requester
function isCompatible(donorBloodGroup, requesterBloodGroup) {
  return bloodCompatibility[donorBloodGroup]?.includes(requesterBloodGroup) || false;
}

// Log a new donation
exports.logDonation = async (req, res) => {
  try {
    const { recipientId, date, notes } = req.body;
    const donorId = req.user.id;
    const donation = new DonationHistory({ donorId, recipientId, date, notes });
    await donation.save();
    res.status(201).json(donation);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Get donation history for current donor
exports.getDonationHistory = async (req, res) => {
  try {
    const donorId = req.user.id;
    const history = await DonationHistory.find({ donorId }).sort({ date: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Get request history for current requester
exports.getRequestHistory = async (req, res) => {
  try {
    const recipientId = req.user.id;
    const history = await DonationHistory.find({ recipientId })
      .populate('donorId', 'name email bloodGroup location')
      .sort({ date: -1 });
    
    // Add additional details to each request
    const historyWithDetails = history.map(request => {
      const donor = request.donorId;
      let distance = null;
      
      // Calculate distance if both users have location
      if (donor && donor.location && donor.location.lat && donor.location.lng) {
        // For now, we'll use a placeholder distance calculation
        // In a real app, you'd calculate distance between requester and donor
        distance = 'Calculated distance';
      }

      return {
        ...request.toObject(),
        donorDetails: donor ? {
          name: donor.name,
          bloodGroup: donor.bloodGroup,
          location: donor.location,
          distance: distance
        } : null,
        // Use the bloodGroup from the request itself, not from donor
        bloodGroup: request.bloodGroup || 'Not specified'
      };
    });
    
    res.json(historyWithDetails);
  } catch (err) {
    console.error('Get request history error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Get donation stats for current donor
exports.getDonationStats = async (req, res) => {
  try {
    const donorId = req.user.id;
    const history = await DonationHistory.find({ donorId }).sort({ date: -1 });
    const totalDonations = history.length;
    const lastDonation = history[0]?.date || null;
    let nextEligibleDate = null;
    if (lastDonation) {
      const next = new Date(lastDonation);
      next.setDate(next.getDate() + 14);
      nextEligibleDate = next;
    }
    res.json({ totalDonations, lastDonation, nextEligibleDate });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

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

// Get nearby requests for a donor
exports.getNearbyRequests = async (req, res) => {
  try {
    const donorId = req.user.id;
    const donor = await User.findById(donorId);
    if (!donor) return res.status(404).json({ msg: 'Donor not found' });
    
    console.log('=== DEBUG: Getting nearby requests ===');
    console.log('Donor ID:', donorId);
    console.log('Donor details:', { name: donor.name, bloodGroup: donor.bloodGroup, role: donor.role });
    
    // Find pending donation requests where this donor is the target
    const pendingRequests = await DonationHistory.find({
      donorId: donorId,
      status: 'pending'
    })
    .populate('recipientId', 'name email bloodGroup location')
    .sort({ date: -1 });

    console.log('Found pending requests:', pendingRequests.length);
    console.log('Pending requests details:', pendingRequests.map(r => ({
      id: r._id,
      donorId: r.donorId,
      recipientId: r.recipientId,
      recipientName: r.recipientId?.name,
      bloodGroup: r.bloodGroup,
      status: r.status,
      date: r.date
    })));

    // Add distance calculations, compatibility info, and additional details
    const requestsWithDetails = pendingRequests.map(request => {
      const requester = request.recipientId;
      let distance = null;
      
      if (donor.location && requester.location && 
          donor.location.lat && donor.location.lng && 
          requester.location.lat && requester.location.lng) {
        // Calculate distance using Haversine formula
        const R = 6371; // Earth's radius in km
        const dLat = (requester.location.lat - donor.location.lat) * Math.PI / 180;
        const dLng = (requester.location.lng - donor.location.lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(donor.location.lat * Math.PI / 180) * Math.cos(requester.location.lat * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        distance = R * c;
      }

      // Check compatibility
      const requestedBloodGroup = request.bloodGroup || requester.bloodGroup;
      const isCompatibleRequest = isCompatible(donor.bloodGroup, requestedBloodGroup);

      return {
        ...request.toObject(),
        name: requester.name,
        bloodGroup: requestedBloodGroup,
        location: requester.location,
        dist: { calculated: distance ? distance * 1000 : null }, // Convert to meters for consistency
        isCompatible: isCompatibleRequest,
        compatibilityMessage: isCompatibleRequest 
          ? `✅ Compatible: You can donate ${donor.bloodGroup} to ${requestedBloodGroup}`
          : `❌ Incompatible: You cannot donate ${donor.bloodGroup} to ${requestedBloodGroup}`
      };
    });

    // Filter by distance (10km = 10000m) if donor has location
    // Temporarily disabled distance filtering to show all requests
    const nearbyRequests = requestsWithDetails;
    
    // Original distance filtering (commented out for debugging):
    // const nearbyRequests = donor.location && donor.location.lat && donor.location.lng
    //   ? requestsWithDetails.filter(request => 
    //       request.dist.calculated && request.dist.calculated <= 10000
    //     )
    //   : requestsWithDetails;

    console.log('Final nearby requests:', nearbyRequests.length);
    console.log('Distance filtering applied:', donor.location && donor.location.lat && donor.location.lng);
    console.log('Donor location:', donor.location);
    console.log('=== END DEBUG ===');

    res.json(nearbyRequests);
  } catch (err) {
    console.error('Get nearby requests error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Get notifications for the current user (placeholder)
exports.getNotifications = async (req, res) => {
  try {
    // In a real app, fetch notifications from a collection
    res.json([]);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Get active requests for current requester
exports.getActiveRequests = async (req, res) => {
  try {
    const recipientId = req.user.id;
    const activeRequests = await DonationHistory.find({
      recipientId,
      status: { $in: ['pending', 'accepted'] }
    })
    .populate('donorId', 'name email bloodGroup location') // Populate donor details
    .sort({ date: -1 });
    
    // Add bloodGroup from the request itself
    const requestsWithBloodGroup = activeRequests.map(request => ({
      ...request.toObject(),
      bloodGroup: request.bloodGroup || 'Not specified'
    }));
    
    res.json(requestsWithBloodGroup);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Get confirmed requests for current donor (can chat with these)
exports.getConfirmedRequests = async (req, res) => {
  try {
    const donorId = req.user.id;
    const donor = await User.findById(donorId);
    
    const confirmedRequests = await DonationHistory.find({
      donorId,
      status: 'accepted'
    })
    .populate('recipientId', 'name email bloodGroup location')
    .sort({ date: -1 });

    // Add distance calculations and additional details
    const requestsWithDetails = confirmedRequests.map(request => {
      const requester = request.recipientId;
      let distance = null;
      
      if (donor.location && requester.location && 
          donor.location.lat && donor.location.lng && 
          requester.location.lat && requester.location.lng) {
        // Calculate distance using Haversine formula
        const R = 6371; // Earth's radius in km
        const dLat = (requester.location.lat - donor.location.lat) * Math.PI / 180;
        const dLng = (requester.location.lng - donor.location.lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(donor.location.lat * Math.PI / 180) * Math.cos(requester.location.lat * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        distance = R * c;
      }

      return {
        ...request.toObject(),
        requesterDetails: {
          name: requester.name,
          bloodGroup: requester.bloodGroup,
          location: requester.location,
          distance: distance ? distance.toFixed(2) : null
        }
      };
    });

    res.json(requestsWithDetails);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Confirm a donation request (donor accepts a request)
exports.confirmRequest = async (req, res) => {
  try {
    const { requestId } = req.params; // This is actually the requester's user ID
    const donorId = req.user.id;
    
    // Get donor and requester details
    const donor = await User.findById(donorId);
    const requester = await User.findById(requestId);
    
    if (!donor || !requester) {
      return res.status(404).json({ msg: 'Donor or requester not found' });
    }
    
    // Find the specific request
    const donationRequest = await DonationHistory.findOne({
      donorId: donorId,
      recipientId: requestId,
      status: 'pending'
    });
    
    if (!donationRequest) {
      return res.status(404).json({ msg: 'Donation request not found' });
    }
    
    // Check blood group compatibility
    const requestedBloodGroup = donationRequest.bloodGroup || requester.bloodGroup;
    const isCompatibleRequest = isCompatible(donor.bloodGroup, requestedBloodGroup);
    
    if (!isCompatibleRequest) {
      return res.status(400).json({ 
        msg: `Cannot confirm request: Blood group ${donor.bloodGroup} is not compatible with ${requestedBloodGroup}`,
        error: 'INCOMPATIBLE_BLOOD_GROUP',
        donorBloodGroup: donor.bloodGroup,
        requestedBloodGroup: requestedBloodGroup
      });
    }
    
    // Update existing record to accepted
    donationRequest.status = 'accepted';
    await donationRequest.save();
    
    // Create notification for requester
    try {
      const { createNotification } = require('./notificationController');
      await createNotification(
        requestId,
        'Request Confirmed!',
        `${donor.name} has confirmed your blood donation request. You can now chat with them.`,
        'confirmation',
        donorId,
        donationRequest._id
      );
    } catch (notificationError) {
      // Log notification error but don't fail the request
      console.error('Notification creation failed:', notificationError);
    }
    
    res.json({ 
      msg: 'Request confirmed successfully', 
      donation: donationRequest,
      compatibility: {
        donorBloodGroup: donor.bloodGroup,
        requestedBloodGroup: requestedBloodGroup,
        isCompatible: true
      }
    });
  } catch (err) {
    console.error('Confirm request error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Create a request from requester to donor
exports.createRequest = async (req, res) => {
  try {
    const { donorId } = req.params;
    const requesterId = req.user.id;
    const { bloodGroup } = req.body;
    
    console.log('=== DEBUG: Creating request ===');
    console.log('Donor ID:', donorId);
    console.log('Requester ID:', requesterId);
    console.log('Blood Group:', bloodGroup);
    
    // Check if requester is requesting to themselves
    if (donorId === requesterId) {
      return res.status(400).json({ msg: 'Cannot request to yourself' });
    }
    
    // Check if donor exists and is actually a donor
    const donor = await User.findById(donorId);
    if (!donor || donor.role !== 'donor') {
      console.log('Donor not found or not a donor:', { donor: !!donor, role: donor?.role });
      return res.status(404).json({ msg: 'Donor not found' });
    }
    
    console.log('Donor found:', { name: donor.name, bloodGroup: donor.bloodGroup, role: donor.role });
    
    // Check if a request already exists
    const existingRequest = await DonationHistory.findOne({
      donorId: donorId,
      recipientId: requesterId,
      status: { $in: ['pending', 'accepted'] }
    });
    
    if (existingRequest) {
      console.log('Existing request found:', existingRequest._id);
      return res.status(400).json({ msg: 'Request already exists' });
    }
    
    // Create new request
    const request = new DonationHistory({
      donorId: donorId,
      recipientId: requesterId,
      date: new Date(),
      status: 'pending',
      bloodGroup: bloodGroup
    });
    
    await request.save();
    console.log('Request created successfully:', request._id);
    console.log('Request details:', {
      id: request._id,
      donorId: request.donorId,
      recipientId: request.recipientId,
      bloodGroup: request.bloodGroup,
      status: request.status,
      date: request.date
    });
    console.log('=== END DEBUG ===');
    
    // Create notification for donor
    try {
      const requester = await User.findById(requesterId);
      const { createNotification } = require('./notificationController');
      await createNotification(
        donorId,
        'New Blood Request',
        `${requester.name} has requested your blood donation (${bloodGroup}). Check your dashboard to respond.`,
        'request',
        requesterId,
        request._id
      );
    } catch (notificationError) {
      // Log notification error but don't fail the request
      console.error('Notification creation failed:', notificationError);
    }
    
    res.status(201).json({ 
      msg: 'Request sent successfully', 
      request: {
        ...request.toObject(),
        donorName: donor.name,
        donorBloodGroup: donor.bloodGroup
      }
    });
  } catch (err) {
    console.error('Create request error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
}; 

// Debug endpoint to check all donation requests
exports.debugAllRequests = async (req, res) => {
  try {
    const allRequests = await DonationHistory.find({})
      .populate('donorId', 'name email bloodGroup role')
      .populate('recipientId', 'name email bloodGroup role')
      .sort({ date: -1 });
    
    const requestsWithDetails = allRequests.map(request => ({
      id: request._id,
      donorId: request.donorId,
      recipientId: request.recipientId,
      donorName: request.donorId?.name || 'Unknown',
      recipientName: request.recipientId?.name || 'Unknown',
      donorRole: request.donorId?.role || 'Unknown',
      recipientRole: request.recipientId?.role || 'Unknown',
      bloodGroup: request.bloodGroup,
      status: request.status,
      date: request.date,
      notes: request.notes
    }));
    
    res.json({
      totalRequests: allRequests.length,
      requests: requestsWithDetails,
      statusCounts: {
        pending: allRequests.filter(r => r.status === 'pending').length,
        accepted: allRequests.filter(r => r.status === 'accepted').length,
        fulfilled: allRequests.filter(r => r.status === 'fulfilled').length,
        cancelled: allRequests.filter(r => r.status === 'cancelled').length
      }
    });
  } catch (err) {
    console.error('Debug all requests error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
}; 

// Simple debug endpoint to check all requests
exports.debugRequests = async (req, res) => {
  try {
    const allRequests = await DonationHistory.find({})
      .populate('donorId', 'name email role')
      .populate('recipientId', 'name email role')
      .sort({ date: -1 });
    
    const requestsInfo = allRequests.map(req => ({
      id: req._id,
      donorId: req.donorId,
      recipientId: req.recipientId,
      donorName: req.donorId?.name || 'Unknown',
      recipientName: req.recipientId?.name || 'Unknown',
      donorRole: req.donorId?.role || 'Unknown',
      recipientRole: req.recipientId?.role || 'Unknown',
      bloodGroup: req.bloodGroup,
      status: req.status,
      date: req.date
    }));
    
    res.json({
      totalRequests: allRequests.length,
      requests: requestsInfo,
      statusCounts: {
        pending: allRequests.filter(r => r.status === 'pending').length,
        accepted: allRequests.filter(r => r.status === 'accepted').length,
        fulfilled: allRequests.filter(r => r.status === 'fulfilled').length,
        cancelled: allRequests.filter(r => r.status === 'cancelled').length
      }
    });
  } catch (err) {
    console.error('Debug requests error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
}; 

// Test endpoint to create a sample request
exports.createTestRequest = async (req, res) => {
  try {
    const { donorId, requesterId, bloodGroup } = req.body;
    
    console.log('=== TEST: Creating test request ===');
    console.log('Donor ID:', donorId);
    console.log('Requester ID:', requesterId);
    console.log('Blood Group:', bloodGroup);
    
    // Check if donor and requester exist
    const donor = await User.findById(donorId);
    const requester = await User.findById(requesterId);
    
    if (!donor || !requester) {
      return res.status(404).json({ msg: 'Donor or requester not found' });
    }
    
    console.log('Donor:', { name: donor.name, role: donor.role });
    console.log('Requester:', { name: requester.name, role: requester.role });
    
    // Create test request
    const testRequest = new DonationHistory({
      donorId: donorId,
      recipientId: requesterId,
      date: new Date(),
      status: 'pending',
      bloodGroup: bloodGroup || 'A+'
    });
    
    await testRequest.save();
    console.log('Test request created:', testRequest._id);
    console.log('=== END TEST ===');
    
    res.json({ 
      msg: 'Test request created successfully', 
      request: testRequest 
    });
  } catch (err) {
    console.error('Create test request error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
}; 