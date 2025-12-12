const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['request', 'confirmation', 'chat', 'system'], 
    default: 'system' 
  },
  relatedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  relatedRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'DonationHistory' },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema); 