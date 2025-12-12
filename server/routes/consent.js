const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ConsentRequest = require('../models/ConsentRequest');
const User = require('../models/User');

// Create a consent request (requester asks for donor's contact info)
router.post('/request', auth, async (req, res) => {
  try {
    const { donorId, requestType, urgencyLevel, message, medicalReason } = req.body;
    const requesterId = req.user.id;

    // Validate input
    if (!donorId) {
      return res.status(400).json({ msg: 'Donor ID is required' });
    }

    // Check if donor exists and is available
    const donor = await User.findById(donorId);
    if (!donor || donor.role !== 'donor') {
      return res.status(404).json({ msg: 'Donor not found' });
    }

    if (donor.availabilityStatus === 'unavailable') {
      return res.status(400).json({ msg: 'Donor is currently unavailable' });
    }

    // Get requester info
    const requester = await User.findById(requesterId);
    if (!requester) {
      return res.status(404).json({ msg: 'Requester not found' });
    }

    // Check if there's already a pending/granted request
    const existingRequest = await ConsentRequest.findOne({
      requesterId,
      donorId,
      status: { $in: ['pending', 'granted'] }
    });

    if (existingRequest) {
      return res.status(409).json({ 
        msg: 'A consent request already exists for this donor',
        requestId: existingRequest._id,
        status: existingRequest.status
      });
    }

    // Calculate approximate distance for anonymization
    const approximateDistance = Math.floor(Math.random() * 5) + 1; // 1-5 km range for privacy

    // Create consent request with anonymized requester info
    const consentRequest = new ConsentRequest({
      requesterId,
      donorId,
      requestType: requestType || 'contact_info',
      urgencyLevel: urgencyLevel || 'medium',
      anonymousRequesterInfo: {
        bloodGroup: requester.bloodGroup,
        urgencyLevel: urgencyLevel || 'medium',
        location: {
          city: requester.location?.address?.split(',')[0] || 'Unknown',
          approximateDistance
        },
        message: message || `Blood donation request from a ${requester.bloodGroup} patient`,
        medicalReason: medicalReason || 'Medical treatment'
      }
    });

    // Add audit log entry
    consentRequest.auditLog.push({
      action: 'created',
      actor: 'requester',
      details: `Consent request created for ${requestType || 'contact_info'}`
    });

    await consentRequest.save();

    // Update donor's request count
    await User.findByIdAndUpdate(donorId, {
      $inc: { totalRequests: 1 }
    });

    res.status(201).json({
      success: true,
      message: 'Consent request sent to donor',
      requestId: consentRequest._id,
      anonymousInfo: consentRequest.anonymousRequesterInfo
    });

  } catch (error) {
    console.error('Consent request error:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
});

// Get consent requests for donor (to approve/deny)
router.get('/donor-requests', auth, async (req, res) => {
  try {
    const donorId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { donorId };
    if (status) {
      query.status = status;
    }

    const requests = await ConsentRequest.find(query)
      .populate('requesterId', 'name bloodGroup')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ConsentRequest.countDocuments(query);

    // Add audit log for viewing requests
    for (const request of requests) {
      if (request.status === 'pending') {
        request.auditLog.push({
          action: 'viewed',
          actor: 'donor',
          details: 'Donor viewed consent request'
        });
        await request.save();
      }
    }

    res.json({
      success: true,
      requests: requests.map(req => ({
        id: req._id,
        anonymousRequesterInfo: req.anonymousRequesterInfo,
        urgencyLevel: req.urgencyLevel,
        requestType: req.requestType,
        status: req.status,
        createdAt: req.createdAt,
        expiresAt: req.consentExpiresAt
      })),
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: requests.length,
        totalRequests: total
      }
    });

  } catch (error) {
    console.error('Get donor requests error:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
});

// Grant consent (donor approves request)
router.post('/grant/:requestId', auth, async (req, res) => {
  try {
    const { requestId } = req.params;
    const donorId = req.user.id;
    const { permissions, message, conditions, contactMethod } = req.body;

    const consentRequest = await ConsentRequest.findOne({
      _id: requestId,
      donorId,
      status: 'pending'
    }).populate('requesterId', 'name email phoneNumber');

    if (!consentRequest) {
      return res.status(404).json({ msg: 'Consent request not found or already processed' });
    }

    // Check if request has expired
    if (consentRequest.isExpired()) {
      consentRequest.status = 'expired';
      await consentRequest.save();
      return res.status(410).json({ msg: 'Consent request has expired' });
    }

    // Default permissions if not specified
    const defaultPermissions = {
      name: true,
      phoneNumber: true,
      email: false,
      exactLocation: false,
      medicalHistory: false,
      lastDonationDate: false
    };

    const finalPermissions = { ...defaultPermissions, ...permissions };

    // Grant consent with specified permissions
    const donorResponse = {
      message: message || 'I\'m available to help with blood donation',
      conditions: conditions || '',
      preferredContactMethod: contactMethod || 'phone'
    };

    await consentRequest.grantConsent(finalPermissions, donorResponse);

    // Update donor's successful response count
    await User.findByIdAndUpdate(donorId, {
      $inc: { successfulDonations: 1 }
    });

    // Prepare response with granted data
    const donor = await User.findById(donorId);
    const sharedData = {};

    if (finalPermissions.name) sharedData.name = donor.name;
    if (finalPermissions.phoneNumber) sharedData.phoneNumber = donor.phoneNumber;
    if (finalPermissions.email) sharedData.email = donor.email;
    if (finalPermissions.exactLocation) sharedData.exactLocation = donor.location;
    if (finalPermissions.lastDonationDate) sharedData.lastDonationDate = donor.lastDonationDate;

    res.json({
      success: true,
      message: 'Consent granted successfully',
      requestId: consentRequest._id,
      sharedData,
      donorResponse: donorResponse,
      expiresAt: consentRequest.consentExpiresAt
    });

  } catch (error) {
    console.error('Grant consent error:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
});

// Deny consent (donor rejects request)
router.post('/deny/:requestId', auth, async (req, res) => {
  try {
    const { requestId } = req.params;
    const donorId = req.user.id;
    const { reason } = req.body;

    const consentRequest = await ConsentRequest.findOne({
      _id: requestId,
      donorId,
      status: 'pending'
    });

    if (!consentRequest) {
      return res.status(404).json({ msg: 'Consent request not found or already processed' });
    }

    await consentRequest.denyConsent(reason || 'Donor declined the request');

    res.json({
      success: true,
      message: 'Consent request denied',
      requestId: consentRequest._id
    });

  } catch (error) {
    console.error('Deny consent error:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
});

// Get requester's sent requests
router.get('/my-requests', auth, async (req, res) => {
  try {
    const requesterId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { requesterId };
    if (status) {
      query.status = status;
    }

    const requests = await ConsentRequest.find(query)
      .populate('donorId', 'name bloodGroup availabilityStatus')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ConsentRequest.countDocuments(query);

    res.json({
      success: true,
      requests,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: requests.length,
        totalRequests: total
      }
    });

  } catch (error) {
    console.error('Get my requests error:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
});

// Get granted consent data (requester accesses shared info)
router.get('/granted/:requestId', auth, async (req, res) => {
  try {
    const { requestId } = req.params;
    const requesterId = req.user.id;

    const consentRequest = await ConsentRequest.findOne({
      _id: requestId,
      requesterId,
      status: 'granted'
    }).populate('donorId');

    if (!consentRequest) {
      return res.status(404).json({ msg: 'Granted consent not found' });
    }

    // Check if consent has expired
    if (consentRequest.isExpired()) {
      consentRequest.status = 'expired';
      await consentRequest.save();
      return res.status(410).json({ msg: 'Consent has expired' });
    }

    // Prepare shared data based on permissions
    const donor = consentRequest.donorId;
    const permissions = consentRequest.permissionsGranted;
    const sharedData = {};

    if (permissions.name) sharedData.name = donor.name;
    if (permissions.phoneNumber) sharedData.phoneNumber = donor.phoneNumber;
    if (permissions.email) sharedData.email = donor.email;
    if (permissions.exactLocation) sharedData.exactLocation = donor.location;
    if (permissions.lastDonationDate) sharedData.lastDonationDate = donor.lastDonationDate;

    // Log data access
    consentRequest.dataSharedLog.push({
      dataType: Object.keys(sharedData).join(', '),
      sharedAt: new Date(),
      accessedBy: req.ip || 'unknown'
    });

    await consentRequest.save();

    res.json({
      success: true,
      sharedData,
      donorResponse: consentRequest.donorResponse,
      expiresAt: consentRequest.consentExpiresAt,
      permissions
    });

  } catch (error) {
    console.error('Get granted consent error:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
});

module.exports = router;