const Notification = require('../models/Notification');
const User = require('../models/User');

// Get notifications for current user
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await Notification.find({ userId })
      .populate('relatedUserId', 'name')
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json(notifications);
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;
    
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ msg: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    
    await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );
    
    res.json({ msg: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Create a notification (helper function for other controllers)
exports.createNotification = async (userId, title, message, type = 'system', relatedUserId = null, relatedRequestId = null) => {
  try {
    const notification = new Notification({
      userId,
      title,
      message,
      type,
      relatedUserId,
      relatedRequestId
    });
    
    await notification.save();
    return notification;
  } catch (err) {
    console.error('Create notification error:', err);
    return null;
  }
};

// Get unread notification count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await Notification.countDocuments({ userId, isRead: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
}; 