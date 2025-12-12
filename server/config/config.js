const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const config = {
  // Server configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database configuration
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/plasma-donor',
  
  // JWT configuration
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // CORS configuration
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  
  // Rate limiting configuration
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.RATE_LIMIT_MAX || 1000, // Increased from 100 to 1000 for development
  },
  
  // Search configuration
  search: {
    defaultRadius: 25, // km
    maxRadius: 100, // km
    minRadius: 5, // km
  },
  
  // Blockchain configuration
  blockchain: {
    ethereumRpcUrl: process.env.ETHEREUM_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
    contractAddress: process.env.CONTRACT_ADDRESS || null,
    privateKey: process.env.BLOCKCHAIN_PRIVATE_KEY || null,
    requireOnChainVerification: process.env.ENABLE_BLOCKCHAIN_VERIFICATION === 'true',
    network: 'sepolia', // or 'mainnet' for production
    chainId: 11155111, // Sepolia testnet
  },
  
  // Logging configuration
  logging: {
    enableRequestLogging: process.env.NODE_ENV === 'development',
  },
  
  // Chat configuration
  chat: {
    messageLimit: 1000, // characters per message
    historyLimit: 50, // messages to load
  },
  
  // Validation configuration
  validation: {
    passwordMinLength: 6,
    nameMinLength: 2,
    emailMaxLength: 254,
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING !== 'false',
  }
};

module.exports = config; 