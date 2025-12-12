const jwt = require('jsonwebtoken');
const BlockchainService = require('./blockchainService');
const config = require('../config/config');

class BlockchainAuth {
  constructor() {
    this.blockchainService = new BlockchainService();
    this.authChallenges = new Map(); // Store temporary auth challenges
  }

  /**
   * Middleware to verify blockchain-based JWT tokens
   */
  verifyBlockchainToken = async (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. No token provided.'
        });
      }

      // Verify JWT token
      const decoded = jwt.verify(token, config.jwtSecret);
      
      // Verify blockchain signature if present
      if (decoded.blockchainAuth) {
        const isValidSignature = await this.blockchainService.verifySignature(
          decoded.blockchainAuth.message,
          decoded.blockchainAuth.signature,
          decoded.address
        );

        if (!isValidSignature) {
          return res.status(401).json({
            success: false,
            message: 'Invalid blockchain signature'
          });
        }

        // Optional: Verify user on blockchain
        if (config.blockchain?.requireOnChainVerification) {
          const chainVerification = await this.blockchainService.verifyUserOnChain(decoded.address);
          if (!chainVerification.verified) {
            return res.status(401).json({
              success: false,
              message: 'User not verified on blockchain'
            });
          }
        }
      }

      req.user = decoded;
      next();
    } catch (error) {
      console.error('Blockchain auth error:', error);
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Authentication error',
        error: config.nodeEnv === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * Middleware to verify Ethereum wallet signatures
   */
  verifyWalletSignature = async (req, res, next) => {
    try {
      const { address, message, signature } = req.body;

      if (!address || !message || !signature) {
        return res.status(400).json({
          success: false,
          message: 'Address, message, and signature are required'
        });
      }

      // Validate Ethereum address format
      if (!this.blockchainService.isValidAddress(address)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Ethereum address'
        });
      }

      // Verify the signature
      const isValid = await this.blockchainService.verifySignature(message, signature, address);
      
      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid wallet signature'
        });
      }

      req.walletAuth = {
        address: address.toLowerCase(),
        message,
        signature,
        verified: true
      };

      next();
    } catch (error) {
      console.error('Wallet signature verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Signature verification failed',
        error: config.nodeEnv === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * Generate authentication challenge for wallet
   */
  generateAuthChallenge = async (req, res) => {
    try {
      const { address } = req.body;

      if (!address) {
        return res.status(400).json({
          success: false,
          message: 'Ethereum address is required'
        });
      }

      if (!this.blockchainService.isValidAddress(address)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Ethereum address'
        });
      }

      const challenge = this.blockchainService.generateAuthChallenge(address);
      
      // Store challenge temporarily (expires in 5 minutes)
      const challengeKey = `${address.toLowerCase()}_${challenge.nonce}`;
      this.authChallenges.set(challengeKey, {
        ...challenge,
        expiresAt: Date.now() + (5 * 60 * 1000) // 5 minutes
      });

      // Clean up expired challenges
      this.cleanupExpiredChallenges();

      res.json({
        success: true,
        challenge: challenge.message,
        nonce: challenge.nonce,
        timestamp: challenge.timestamp
      });
    } catch (error) {
      console.error('Error generating auth challenge:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate authentication challenge',
        error: config.nodeEnv === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * Verify authentication challenge response
   */
  verifyAuthChallenge = async (req, res, next) => {
    try {
      const { address, signature, nonce } = req.body;

      if (!address || !signature || !nonce) {
        return res.status(400).json({
          success: false,
          message: 'Address, signature, and nonce are required'
        });
      }

      const challengeKey = `${address.toLowerCase()}_${nonce}`;
      const challenge = this.authChallenges.get(challengeKey);

      if (!challenge) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired challenge'
        });
      }

      if (Date.now() > challenge.expiresAt) {
        this.authChallenges.delete(challengeKey);
        return res.status(401).json({
          success: false,
          message: 'Challenge expired'
        });
      }

      // Verify signature against challenge message
      const isValid = await this.blockchainService.verifySignature(
        challenge.message,
        signature,
        address
      );

      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid signature for challenge'
        });
      }

      // Remove used challenge
      this.authChallenges.delete(challengeKey);

      req.verifiedChallenge = {
        address: address.toLowerCase(),
        message: challenge.message,
        signature,
        timestamp: challenge.timestamp
      };

      next();
    } catch (error) {
      console.error('Error verifying auth challenge:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify authentication challenge',
        error: config.nodeEnv === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * Clean up expired challenges
   */
  cleanupExpiredChallenges() {
    const now = Date.now();
    for (const [key, challenge] of this.authChallenges.entries()) {
      if (now > challenge.expiresAt) {
        this.authChallenges.delete(key);
      }
    }
  }

  /**
   * Generate blockchain-secured JWT token
   */
  generateBlockchainToken(userData, walletAuth) {
    const payload = {
      id: userData._id,
      email: userData.email,
      address: walletAuth.address,
      blockchainAuth: {
        message: walletAuth.message,
        signature: walletAuth.signature,
        timestamp: Date.now()
      },
      securePayload: this.blockchainService.generateSecurePayload(
        walletAuth.address,
        userData
      )
    };

    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
      issuer: 'plasma-donor',
      subject: userData._id.toString(),
      audience: 'plasma-donor-app'
    });
  }

  /**
   * Middleware to require blockchain verification
   */
  requireBlockchainAuth = (req, res, next) => {
    if (!req.user?.blockchainAuth) {
      return res.status(401).json({
        success: false,
        message: 'Blockchain authentication required'
      });
    }
    next();
  };
}

module.exports = new BlockchainAuth();