const mongoose = require('mongoose');

const autoRequestSchema = new mongoose.Schema({
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requesterBloodGroup: {
    type: String,
    required: true
  },
  donorBloodGroup: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'expired'],
    default: 'pending'
  },
  requestType: {
    type: String,
    enum: ['automatic', 'manual'],
    default: 'automatic'
  },
  compatibilityScore: {
    type: Number,
    default: 0
  },
  mlScore: {
    type: Number,
    default: 0
  },
  distance: {
    type: Number,
    default: 0
  },
  urgencyLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  message: {
    type: String,
    default: ''
  },
  requesterContact: {
    name: String,
    phone: String,
    email: String,
    location: {
      lat: Number,
      lng: Number,
      address: String
    }
  },
  donorContact: {
    name: String,
    phone: String,
    email: String,
    location: {
      lat: Number,
      lng: Number,
      address: String
    }
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  },
  responseAt: {
    type: Date
  },
  fraudFlags: [{
    type: String,
    description: String,
    flaggedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isFraudulent: {
    type: Boolean,
    default: false
  },
  fraudScore: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better query performance
autoRequestSchema.index({ requesterId: 1 });
autoRequestSchema.index({ donorId: 1 });
autoRequestSchema.index({ status: 1 });
autoRequestSchema.index({ requestType: 1 });
autoRequestSchema.index({ createdAt: -1 });
autoRequestSchema.index({ expiresAt: 1 });
autoRequestSchema.index({ urgencyLevel: 1 });
autoRequestSchema.index({ isFraudulent: 1 });

// Compound indexes
autoRequestSchema.index({ donorId: 1, status: 1 });
autoRequestSchema.index({ requesterId: 1, status: 1 });
autoRequestSchema.index({ status: 1, expiresAt: 1 });

// Auto-expire requests after 24 hours
autoRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('AutoRequest', autoRequestSchema);