const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const rateLimit = require('express-rate-limit');
const config = require('./config/config');
const initSocket = require('./socket');

// Load environment variables with absolute path
const path = require('path');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Debug: Show which MongoDB URI is being used
console.log('MongoDB URI being used:', config.mongoUri);
console.log('Environment variables loaded:', {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  MONGO_URI: process.env.MONGO_URI ? 'Set' : 'Not set'
});

const app = express();
const server = http.createServer(app);
initSocket(server);

// CORS middleware (must come before rate limiting)
app.use(cors({
  origin: config.clientUrl,
  credentials: true
}));

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
if (config.logging.enableRequestLogging) {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    });
    next();
  });
}

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/search', require('./routes/search'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/donation', require('./routes/donation'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/consent', require('./routes/consent'));
app.use('/api/blockchain', require('./routes/blockchain'));

// MongoDB connection with graceful error handling
let isMongoConnected = false;

mongoose.connect(config.mongoUri, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('MongoDB connected successfully');
  isMongoConnected = true;
})
.catch((err) => {
  console.error('MongoDB connection error:', err.message);
  console.log('Server will continue running but database operations will fail');
  console.log('Please install MongoDB locally or configure MongoDB Atlas connection in .env file');
  isMongoConnected = false;
});

// Middleware to check database connection
app.use((req, res, next) => {
  if (!isMongoConnected && (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE')) {
    return res.status(503).json({
      success: false,
      message: 'Database connection unavailable. Please check MongoDB configuration.',
      hint: 'Install MongoDB locally or configure MongoDB Atlas connection string in .env file'
    });
  }
  next();
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: config.nodeEnv === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Plasma Donor API running',
    version: '1.0.0',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString()
  });
});

// Auto-train ML models on server startup
const autoTrainML = async () => {
  try {
    console.log('Initializing AI/ML models...');
    const mlService = require('./services/mlService');
    const result = await mlService.autoTrainModels();
    
    if (result.status === 'success') {
      console.log(`AI Models trained successfully`);
      console.log(`Training samples: ${result.training_samples}`);
      console.log(`Logistic Regression accuracy: ${(result.logistic_accuracy * 100).toFixed(1)}%`);
      console.log(`Random Forest accuracy: ${(result.random_forest_accuracy * 100).toFixed(1)}%`);
      console.log(`Fraud detection: Active`);
      console.log(`AI-based donor ranking: Enabled`);
    } else {
      console.log(`ML training warning: ${result.message}`);
    }
  } catch (error) {
    console.log(`ML models will train on first request: ${error.message}`);
  }
};

server.listen(config.port, async () => {
  console.log(`Server running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Client URL: ${config.clientUrl}`);
  
  // Initialize AI/ML models
  await autoTrainML();
  
  // Blockchain status indicator
  if (process.env.ENABLE_BLOCKCHAIN_VERIFICATION === 'true') {
    console.log(`BLOCKCHAIN IS RUNNING - Ethereum Integration Active`);
    console.log(`Smart Contract: ${process.env.CONTRACT_ADDRESS}`);
    console.log(`Network: Sepolia Testnet`);
    console.log(`MetaMask Integration: Enabled`);
    console.log(`Blockchain Auth Endpoints: /api/blockchain/*`);
  } else {
    console.log(`WARNING: Blockchain integration is disabled`);
  }
  
  console.log(`\nADVANCED FEATURES ACTIVE:`);
  console.log(`   AI-Based Donor Ranking`);
  console.log(`   Privacy-Aware Consent Flow`);
  console.log(`   Real-Time Availability Toggle`);
  console.log(`   Anomaly Detection System`);
  console.log(`   Multi-Factor ML Scoring`);
  console.log(`\nPlasma Donor Finder - Research Edition Ready!`);
});