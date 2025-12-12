const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
  getProfile, 
  updateProfile, 
  getAvailability, 
  updateAvailability,
  updatePrivacySettings,
  getUserStats
} = require('../controllers/profileController');

// Get current user profile
router.get('/', auth, getProfile);
// Update profile
router.put('/', auth, updateProfile);

// Advanced availability management
router.get('/availability', auth, getAvailability);
router.put('/availability', auth, updateAvailability);

// Privacy settings management
router.put('/privacy', auth, updatePrivacySettings);

// User statistics and analytics
router.get('/stats', auth, getUserStats);

module.exports = router; 