const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { logDonation, getDonationHistory, getRequestHistory, getDonationStats, getNearbyRequests, getActiveRequests, getConfirmedRequests, confirmRequest, createRequest, debugAllRequests, debugRequests, createTestRequest } = require('../controllers/donationController');

// POST /api/donation - log a donation
router.post('/', auth, logDonation);

// GET /api/donation/history - get donation history for current donor
router.get('/history', auth, getDonationHistory);

// GET /api/donation/request-history - get request history for current requester
router.get('/request-history', auth, getRequestHistory);

// GET /api/donation/stats - get donation stats for current donor
router.get('/stats', auth, getDonationStats);

// GET /api/donation/nearby-requests - get nearby requests for current donor
router.get('/nearby-requests', auth, getNearbyRequests);

// GET /api/donation/active-requests - get active requests for current requester
router.get('/active-requests', auth, getActiveRequests);

// GET /api/donation/confirmed-requests - get confirmed requests for current donor
router.get('/confirmed-requests', auth, getConfirmedRequests);

// POST /api/donation/request/:donorId - create a request from requester to donor
router.post('/request/:donorId', auth, createRequest);

// POST /api/donation/confirm/:requestId - confirm a donation request
router.post('/confirm/:requestId', auth, confirmRequest);

// GET /api/donation/debug-all - Debug endpoint to check all donation requests
router.get('/debug-all', auth, debugAllRequests);

// GET /api/donation/debug - Simple debug endpoint
router.get('/debug', auth, debugRequests);

// POST /api/donation/test-request - Create a test request
router.post('/test-request', auth, createTestRequest);

module.exports = router; 