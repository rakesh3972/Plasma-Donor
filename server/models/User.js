const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false }, // Optional for blockchain-only users
  phoneNumber: { type: String, required: true }, // Contact number for donors and requesters
  bloodGroup: { type: String, required: true },
  role: { type: String, enum: ['donor', 'requester', 'admin'], default: 'donor' },
  location: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    address: { type: String, default: '' }
  },
  isAvailable: { type: Boolean, default: true },
  lastDonationDate: { type: Date },
  
  // Advanced AI and Privacy Features
  availabilityStatus: { 
    type: String, 
    enum: ['available', 'busy', 'unavailable'], 
    default: 'available' 
  },
  healthStatus: { 
    type: String, 
    enum: ['excellent', 'good', 'fair', 'post_covid', 'recovering', 'unavailable'], 
    default: 'good' 
  },
  
  // ML and fraud detection related fields
  requestFrequency: { type: Number, default: 0 }, // Track request frequency for fraud detection
  successfulDonations: { type: Number, default: 0 }, // Track successful donations
  totalRequests: { type: Number, default: 0 }, // Total requests received (for reliability score)
  lastRequestTime: { type: Date }, // Track last request time
  suspiciousActivity: { type: Boolean, default: false }, // Flag for suspicious users
  mlScore: { type: Number, default: 0 }, // ML compatibility score
  aiRankingScore: { type: Number, default: 0 }, // Latest AI ranking score
  fraudRiskScore: { type: Number, default: 0 }, // Fraud detection score
  
  // Privacy and Consent Settings
  privacySettings: {
    shareContactInfo: { type: Boolean, default: true },
    requireConsent: { type: Boolean, default: true },
    anonymousMode: { type: Boolean, default: false }
  },
  
  // Reliability Metrics
  responseRate: { type: Number, default: 0 }, // Percentage of requests responded to
  averageResponseTime: { type: Number, default: 0 }, // Average response time in hours
  lastActiveDate: { type: Date, default: Date.now }, // Last activity date
  
  // Location History (for anomaly detection)
  locationHistory: [{
    lat: Number,
    lng: Number,
    timestamp: { type: Date, default: Date.now },
    city: String
  }],
  
  // Consent Logs
  consentLogs: [{
    requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: String, // 'granted', 'denied', 'revoked'
    timestamp: { type: Date, default: Date.now },
    dataShared: [String] // Array of data types shared
  }],
  
  // Blockchain-specific fields
  walletAddress: { 
    type: String, 
    unique: true, 
    sparse: true, // Allows multiple null values
    lowercase: true 
  },
  isBlockchainVerified: { type: Boolean, default: false },
  dataHash: { type: String }, // Keccak256 hash of user data for integrity verification
  blockchainRegisteredAt: { type: Date },
  lastLogin: { type: Date },
  
  createdAt: { type: Date, default: Date.now }
});

// Database indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ bloodGroup: 1 });
userSchema.index({ isAvailable: 1 });
userSchema.index({ 'location.lat': 1, 'location.lng': 1 });
userSchema.index({ role: 1, bloodGroup: 1, isAvailable: 1 });
userSchema.index({ createdAt: -1 });

// Blockchain-specific indexes
userSchema.index({ walletAddress: 1 });
userSchema.index({ isBlockchainVerified: 1 });
userSchema.index({ walletAddress: 1, isBlockchainVerified: 1 });

// No geospatial indexing - we'll use manual distance calculations
// This prevents the "Can't extract geo keys" error

module.exports = mongoose.model('User', userSchema); 