const User = require('../models/User');

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    
    // Prevent email and password update here for simplicity
    delete updates.email;
    delete updates.password;
    
    // Handle location data carefully
    if (updates.location) {
      // Ensure location data is properly formatted
      updates.location = {
        lat: updates.location.lat ? parseFloat(updates.location.lat) : null,
        lng: updates.location.lng ? parseFloat(updates.location.lng) : null,
        address: updates.location.address || ''
      };
    }
    
    // Use findByIdAndUpdate with proper options
    const user = await User.findByIdAndUpdate(
      req.user.id, 
      updates, 
      { 
        new: true, 
        runValidators: true,
        setDefaultsOnInsert: true
      }
    ).select('-password');
    
    if (!user) return res.status(404).json({ msg: 'User not found' });
    
    res.json(user);
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Get current user's availability and status
exports.getAvailability = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('isAvailable availabilityStatus healthStatus lastActiveDate');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    
    res.json({ 
      available: user.isAvailable,
      availabilityStatus: user.availabilityStatus,
      healthStatus: user.healthStatus,
      lastActiveDate: user.lastActiveDate
    });
  } catch (err) {
    console.error('Get availability error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Advanced availability toggle - update availability status
exports.updateAvailability = async (req, res) => {
  try {
    const { available, availabilityStatus, healthStatus } = req.body;
    
    const updateData = {
      lastActiveDate: new Date()
    };
    
    // Update availability flag
    if (available !== undefined) {
      updateData.isAvailable = available;
    }
    
    // Update detailed availability status
    if (availabilityStatus) {
      const validStatuses = ['available', 'busy', 'unavailable'];
      if (validStatuses.includes(availabilityStatus)) {
        updateData.availabilityStatus = availabilityStatus;
        updateData.isAvailable = availabilityStatus === 'available';
      } else {
        return res.status(400).json({ 
          msg: 'Invalid availability status', 
          validOptions: validStatuses 
        });
      }
    }
    
    // Update health status
    if (healthStatus) {
      const validHealthStatuses = ['excellent', 'good', 'fair', 'post_covid', 'recovering', 'unavailable'];
      if (validHealthStatuses.includes(healthStatus)) {
        updateData.healthStatus = healthStatus;
        // Auto-set availability based on health status
        if (healthStatus === 'unavailable' || healthStatus === 'recovering') {
          updateData.isAvailable = false;
          updateData.availabilityStatus = 'unavailable';
        }
      } else {
        return res.status(400).json({ 
          msg: 'Invalid health status', 
          validOptions: validHealthStatuses 
        });
      }
    }
    
    const user = await User.findByIdAndUpdate(
      req.user.id, 
      updateData, 
      { new: true, runValidators: true }
    ).select('isAvailable availabilityStatus healthStatus lastActiveDate');
    
    if (!user) return res.status(404).json({ msg: 'User not found' });
    
    res.json({ 
      success: true,
      message: 'Availability updated successfully',
      data: {
        available: user.isAvailable,
        availabilityStatus: user.availabilityStatus,
        healthStatus: user.healthStatus,
        lastActiveDate: user.lastActiveDate
      }
    });
    
  } catch (err) {
    console.error('Update availability error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Update privacy settings
exports.updatePrivacySettings = async (req, res) => {
  try {
    const { shareContactInfo, requireConsent, anonymousMode } = req.body;
    
    const updateData = {};
    
    if (shareContactInfo !== undefined) {
      updateData['privacySettings.shareContactInfo'] = shareContactInfo;
    }
    if (requireConsent !== undefined) {
      updateData['privacySettings.requireConsent'] = requireConsent;
    }
    if (anonymousMode !== undefined) {
      updateData['privacySettings.anonymousMode'] = anonymousMode;
    }
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('privacySettings');
    
    if (!user) return res.status(404).json({ msg: 'User not found' });
    
    res.json({
      success: true,
      message: 'Privacy settings updated',
      privacySettings: user.privacySettings
    });
    
  } catch (err) {
    console.error('Update privacy settings error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Get user statistics for dashboard
exports.getUserStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      'successfulDonations totalRequests responseRate averageResponseTime aiRankingScore fraudRiskScore'
    );
    
    if (!user) return res.status(404).json({ msg: 'User not found' });
    
    // Calculate reliability score
    const reliabilityScore = user.totalRequests > 0 
      ? (user.successfulDonations / user.totalRequests * 100).toFixed(1)
      : 0;
    
    res.json({
      success: true,
      stats: {
        successfulDonations: user.successfulDonations || 0,
        totalRequests: user.totalRequests || 0,
        responseRate: user.responseRate || 0,
        averageResponseTime: user.averageResponseTime || 0,
        reliabilityScore: parseFloat(reliabilityScore),
        aiRankingScore: user.aiRankingScore || 0,
        fraudRiskScore: user.fraudRiskScore || 0,
        safetyStatus: user.fraudRiskScore < 0.3 ? 'Safe' : user.fraudRiskScore < 0.7 ? 'Moderate' : 'High Risk'
      }
    });
    
  } catch (err) {
    console.error('Get user stats error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
}; 