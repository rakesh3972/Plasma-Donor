const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const blockchainAuth = require('../blockchain/blockchainAuth');
const BlockchainService = require('../blockchain/blockchainService');

// Generate wallet authentication challenge
router.post('/challenge', authController.generateWalletChallenge);

// Register with blockchain verification
router.post('/register', 
  blockchainAuth.verifyAuthChallenge, 
  authController.registerWithBlockchain
);

// Login with blockchain wallet
router.post('/login',
  blockchainAuth.verifyAuthChallenge,
  authController.loginWithBlockchain
);

// Verify user data integrity
router.get('/verify-integrity',
  blockchainAuth.verifyBlockchainToken,
  authController.verifyDataIntegrity
);

// Get blockchain statistics
router.get('/stats', async (req, res) => {
  try {
    const blockchainService = new BlockchainService();
    
    // Get gas price information
    const gasPrice = await blockchainService.getGasPrice();
    
    res.json({
      success: true,
      blockchain: {
        network: 'Sepolia Testnet', // Update based on your configuration
        gasPrice: gasPrice,
        contractAddress: process.env.CONTRACT_ADDRESS || 'Not deployed',
        rpcUrl: process.env.ETHEREUM_RPC_URL || 'Default RPC'
      }
    });
  } catch (error) {
    console.error('Error fetching blockchain stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching blockchain statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Validate Ethereum address
router.post('/validate-address', (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Address is required'
      });
    }
    
    const blockchainService = new BlockchainService();
    const isValid = blockchainService.isValidAddress(address);
    
    res.json({
      success: true,
      isValid,
      address: isValid ? address.toLowerCase() : null
    });
  } catch (error) {
    console.error('Error validating address:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating address',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Verify transaction hash
router.post('/verify-transaction', 
  blockchainAuth.verifyBlockchainToken,
  async (req, res) => {
    try {
      const { transactionHash } = req.body;
      
      if (!transactionHash) {
        return res.status(400).json({
          success: false,
          message: 'Transaction hash is required'
        });
      }
      
      const blockchainService = new BlockchainService();
      const validation = await blockchainService.validateTransaction(transactionHash);
      
      res.json({
        success: true,
        transaction: validation
      });
    } catch (error) {
      console.error('Error verifying transaction:', error);
      res.status(500).json({
        success: false,
        message: 'Error verifying transaction',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Get user blockchain profile
router.get('/profile',
  blockchainAuth.verifyBlockchainToken,
  async (req, res) => {
    try {
      const User = require('../models/User');
      const user = await User.findById(req.user.id).select('-password');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      const blockchainService = new BlockchainService();
      let onChainVerification = null;
      
      // Check on-chain verification if wallet address exists
      if (user.walletAddress) {
        try {
          onChainVerification = await blockchainService.verifyUserOnChain(user.walletAddress);
        } catch (error) {
          console.warn('On-chain verification failed:', error.message);
        }
      }
      
      res.json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          bloodGroup: user.bloodGroup,
          walletAddress: user.walletAddress,
          isBlockchainVerified: user.isBlockchainVerified,
          dataHash: user.dataHash,
          blockchainRegisteredAt: user.blockchainRegisteredAt,
          lastLogin: user.lastLogin,
          onChainVerification
        }
      });
    } catch (error) {
      console.error('Error fetching blockchain profile:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching blockchain profile',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Update user data and generate new hash
router.put('/update-data',
  blockchainAuth.verifyBlockchainToken,
  async (req, res) => {
    try {
      const { name, email, bloodGroup, location } = req.body;
      const User = require('../models/User');
      
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Update user data
      if (name) user.name = name.trim();
      if (email) user.email = email.toLowerCase();
      if (bloodGroup) user.bloodGroup = bloodGroup;
      if (location) user.location = location;
      
      // Generate new data hash
      const blockchainService = new BlockchainService();
      const userData = {
        name: user.name,
        email: user.email,
        bloodGroup: user.bloodGroup,
        role: user.role
      };
      
      user.dataHash = blockchainService.generateDataHash(userData);
      await user.save();
      
      res.json({
        success: true,
        message: 'User data updated successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          bloodGroup: user.bloodGroup,
          dataHash: user.dataHash
        }
      });
    } catch (error) {
      console.error('Error updating user data:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating user data',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

module.exports = router;