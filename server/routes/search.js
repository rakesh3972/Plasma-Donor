const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
  searchDonors, 
  searchRecipients, 
  debugDonors, 
  testDistance, 
  showAllDonors,
  searchDonorsML,
  getAutoRequests,
  respondToAutoRequest,
  checkFraud,
  getFraudStats
} = require('../controllers/searchController');

// Original search endpoints
// GET /api/search?bloodGroup=&lat=&lng=&radius=&isAvailable=
router.get('/', searchDonors);
// GET /api/search/donors?bloodGroup=&lat=&lng=&radius=&isAvailable=
router.get('/donors', searchDonors);
// GET /api/search/all-donors - Get all donors without location requirement
router.get('/all-donors', showAllDonors);
// GET /api/search/recipients?bloodGroup=&lat=&lng=&radius=
router.get('/recipients', searchRecipients);

// New ML-enhanced search endpoints
// GET /api/search/ml?bloodGroup=&lat=&lng=&radius=&autoRequest=true
router.get('/ml', searchDonorsML);

// Auto-request management
// GET /api/search/auto-requests - Get automatic requests for current donor
router.get('/auto-requests', auth, getAutoRequests);
// POST /api/search/auto-requests/:requestId/respond - Respond to automatic request
router.post('/auto-requests/:requestId/respond', auth, respondToAutoRequest);



// Fraud detection
// GET /api/search/fraud/:userId - Check specific user for fraud
router.get('/fraud/:userId', auth, checkFraud);
// GET /api/search/fraud - Check current user for fraud
router.get('/fraud', auth, checkFraud);
// GET /api/search/fraud-stats - Get fraud statistics
router.get('/fraud-stats', auth, getFraudStats);

// Debug endpoints
// GET /api/search/debug - Debug endpoint to check all donors
router.get('/debug', debugDonors);
// GET /api/search/test-distance?lat1=&lng1=&lat2=&lng2= - Test distance calculation
router.get('/test-distance', testDistance);
// GET /api/search/show-all - Show all users and donors (for debugging)
router.get('/show-all', showAllDonors);

module.exports = router; 