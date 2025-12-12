const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  getUnreadCount 
} = require('../controllers/notificationController');

// GET /api/notifications - get notifications for current user
router.get('/', auth, getNotifications);

// GET /api/notifications/unread-count - get unread notification count
router.get('/unread-count', auth, getUnreadCount);

// PUT /api/notifications/:notificationId/read - mark notification as read
router.put('/:notificationId/read', auth, markAsRead);

// PUT /api/notifications/mark-all-read - mark all notifications as read
router.put('/mark-all-read', auth, markAllAsRead);

module.exports = router; 