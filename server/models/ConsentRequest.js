const mongoose = require('mongoose');

const consentRequestSchema = new mongoose.Schema({
  // Request participants
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
  
  // Request details
  requestType: { 
    type: String, 
    enum: ['contact_info', 'full_profile', 'emergency_contact'], 
    default: 'contact_info' 
  },
  urgencyLevel: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'emergency'], 
    default: 'medium' 
  },
  
  // Anonymous requester information (shown to donor before consent)
  anonymousRequesterInfo: {
    bloodGroup: String,
    urgencyLevel: String,
    location: {
      city: String,
      approximateDistance: Number // in km
    },
    message: String,
    medicalReason: String
  },
  
  // Consent status
  status: { 
    type: String, 
    enum: ['pending', 'granted', 'denied', 'expired', 'revoked'], 
    default: 'pending' 
  },
  consentGrantedAt: Date,
  consentExpiresAt: Date, // Auto-expire after 7 days
  
  // Data access permissions (what donor allows to share)
  permissionsGranted: {
    name: { type: Boolean, default: false },
    phoneNumber: { type: Boolean, default: false },
    email: { type: Boolean, default: false },
    exactLocation: { type: Boolean, default: false },
    medicalHistory: { type: Boolean, default: false },
    lastDonationDate: { type: Boolean, default: false }
  },
  
  // Privacy compliance
  dataSharedLog: [{
    dataType: String,
    sharedAt: { type: Date, default: Date.now },
    accessedBy: String // IP or identifier
  }],
  
  // Response from donor
  donorResponse: {
    message: String,
    conditions: String, // Any conditions set by donor
    preferredContactMethod: { 
      type: String, 
      enum: ['phone', 'email', 'app'], 
      default: 'phone' 
    }
  },
  
  // AI scoring (from ML model)
  aiCompatibilityScore: Number,
  fraudRiskScore: Number,
  
  // Audit trail
  auditLog: [{
    action: String, // 'created', 'viewed', 'granted', 'denied', 'expired'
    timestamp: { type: Date, default: Date.now },
    actor: String, // 'system', 'donor', 'requester', 'admin'
    details: String
  }],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for performance
consentRequestSchema.index({ requesterId: 1, createdAt: -1 });
consentRequestSchema.index({ donorId: 1, status: 1, createdAt: -1 });
consentRequestSchema.index({ status: 1, consentExpiresAt: 1 });
consentRequestSchema.index({ createdAt: -1 });

// Auto-expire consent requests after 7 days
consentRequestSchema.index({ consentExpiresAt: 1 }, { expireAfterSeconds: 0 });

// Middleware to update timestamps
consentRequestSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Set expiration date if consent is granted
  if (this.status === 'granted' && !this.consentExpiresAt) {
    this.consentExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  }
  
  next();
});

// Methods
consentRequestSchema.methods.grantConsent = function(permissions, donorResponse) {
  this.status = 'granted';
  this.consentGrantedAt = new Date();
  this.consentExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  this.permissionsGranted = { ...this.permissionsGranted, ...permissions };
  this.donorResponse = donorResponse;
  
  this.auditLog.push({
    action: 'granted',
    actor: 'donor',
    details: `Consent granted with permissions: ${Object.keys(permissions).filter(k => permissions[k]).join(', ')}`
  });
  
  return this.save();
};

consentRequestSchema.methods.denyConsent = function(reason) {
  this.status = 'denied';
  this.auditLog.push({
    action: 'denied',
    actor: 'donor',
    details: reason || 'Consent denied by donor'
  });
  
  return this.save();
};

consentRequestSchema.methods.isExpired = function() {
  return this.consentExpiresAt && new Date() > this.consentExpiresAt;
};

module.exports = mongoose.model('ConsentRequest', consentRequestSchema);