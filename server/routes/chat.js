const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getChatHistory, getMatchedContacts, checkMatch } = require('../controllers/chatController');

// More specific routes first
router.get('/matched-contacts', auth, getMatchedContacts);
router.get('/check-match/:userId', auth, checkMatch);
router.get('/:userId', auth, getChatHistory);

module.exports = router; 