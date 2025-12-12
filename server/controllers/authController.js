const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const BlockchainService = require('../blockchain/blockchainService');
const blockchainAuth = require('../blockchain/blockchainAuth');

// Input validation helper
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

const validateBloodGroup = (bloodGroup) => {
  const validGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  return validGroups.includes(bloodGroup);
};

// Register a new user
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, phoneNumber, bloodGroup, role, location } = req.body;
    
    // Input validation
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ 
        success: false,
        message: 'Name must be at least 2 characters long' 
      });
    }
    
    if (!validateEmail(email)) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide a valid email address' 
      });
    }
    
    if (!validatePassword(password)) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 6 characters long' 
      });
    }
    
    if (!phoneNumber || phoneNumber.trim().length < 8 || phoneNumber.trim().length > 15) {
      return res.status(400).json({ 
        success: false,
        message: 'Phone number must be between 8 and 15 characters' 
      });
    }
    
    if (!validateBloodGroup(bloodGroup)) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide a valid blood group' 
      });
    }
    
    if (!['donor', 'requester'].includes(role)) {
      return res.status(400).json({ 
        success: false,
        message: 'Role must be either donor or requester' 
      });
    }
    
    const userLocation = location || { lat: 0, lng: 0, address: "" };
    userLocation.lat = Number(userLocation.lat) || 0;
    userLocation.lng = Number(userLocation.lng) || 0;
    
    // Check if user exists
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      return res.status(400).json({ 
        success: false,
        message: 'User with this email already exists' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    user = new User({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      phoneNumber: phoneNumber.trim(),
      bloodGroup,
      role,
      location: userLocation
    });
    await user.save();

    // Create JWT
    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    res.status(201).json({ 
      success: true,
      message: 'User registered successfully',
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        bloodGroup: user.bloodGroup
      } 
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Login user
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Input validation
    if (!validateEmail(email)) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide a valid email address' 
      });
    }
    
    if (!validatePassword(password)) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide a valid password' 
      });
    }
    
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    res.json({ 
      success: true,
      message: 'Login successful',
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        bloodGroup: user.bloodGroup
      } 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Blockchain Authentication Methods

// Generate wallet authentication challenge
exports.generateWalletChallenge = blockchainAuth.generateAuthChallenge;

// Register user with blockchain verification
exports.registerWithBlockchain = async (req, res) => {
  try {
    const { name, email, bloodGroup, role, location, walletAddress } = req.body;
    const { verifiedChallenge } = req;

    // Input validation
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ 
        success: false,
        message: 'Name must be at least 2 characters long' 
      });
    }
    
    if (!validateEmail(email)) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide a valid email address' 
      });
    }
    
    if (!validateBloodGroup(bloodGroup)) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide a valid blood group' 
      });
    }
    
    if (!['donor', 'requester'].includes(role)) {
      return res.status(400).json({ 
        success: false,
        message: 'Role must be either donor or requester' 
      });
    }

    if (!walletAddress || walletAddress.toLowerCase() !== verifiedChallenge.address) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address mismatch'
      });
    }

    const userLocation = location || { lat: 0, lng: 0, address: "" };
    userLocation.lat = Number(userLocation.lat) || 0;
    userLocation.lng = Number(userLocation.lng) || 0;
    
    // Check if user exists by email or wallet address
    let existingUser = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { walletAddress: walletAddress.toLowerCase() }
      ]
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User with this email or wallet address already exists' 
      });
    }

    // Create user with blockchain verification
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase(),
      bloodGroup,
      role,
      location: userLocation,
      walletAddress: walletAddress.toLowerCase(),
      isBlockchainVerified: true,
      blockchainRegisteredAt: new Date()
    });

    await user.save();

    // Generate blockchain-secured token
    const token = blockchainAuth.generateBlockchainToken(user, verifiedChallenge);
    
    // Optional: Register on blockchain smart contract
    const blockchainService = new BlockchainService();
    try {
      const userData = {
        name: user.name,
        email: user.email,
        bloodGroup: user.bloodGroup,
        role: user.role
      };
      const dataHash = blockchainService.generateDataHash(userData);
      
      // Store the hash for verification later
      user.dataHash = dataHash;
      await user.save();
    } catch (blockchainError) {
      console.warn('Blockchain registration failed:', blockchainError.message);
      // Continue without blockchain registration
    }
    
    res.status(201).json({ 
      success: true,
      message: 'User registered successfully with blockchain verification',
      token,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        bloodGroup: user.bloodGroup,
        walletAddress: user.walletAddress,
        isBlockchainVerified: user.isBlockchainVerified
      } 
    });
  } catch (err) {
    console.error('Blockchain registration error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error during blockchain registration',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Login with blockchain wallet
exports.loginWithBlockchain = async (req, res) => {
  try {
    const { walletAddress } = req.body;
    const { verifiedChallenge } = req;

    if (!walletAddress || walletAddress.toLowerCase() !== verifiedChallenge.address) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address mismatch'
      });
    }
    
    const user = await User.findOne({ 
      walletAddress: walletAddress.toLowerCase() 
    });
    
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'No account found for this wallet address. Please register first.' 
      });
    }

    if (!user.isBlockchainVerified) {
      return res.status(400).json({
        success: false,
        message: 'Account not blockchain verified. Please use traditional login or re-register.'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate blockchain-secured token
    const token = blockchainAuth.generateBlockchainToken(user, verifiedChallenge);
    
    res.json({ 
      success: true,
      message: 'Blockchain login successful',
      token,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        bloodGroup: user.bloodGroup,
        walletAddress: user.walletAddress,
        isBlockchainVerified: user.isBlockchainVerified
      } 
    });
  } catch (err) {
    console.error('Blockchain login error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error during blockchain login',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Verify blockchain user data integrity
exports.verifyDataIntegrity = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isBlockchainVerified || !user.dataHash) {
      return res.status(400).json({
        success: false,
        message: 'User not blockchain verified or no data hash available'
      });
    }

    const blockchainService = new BlockchainService();
    const userData = {
      name: user.name,
      email: user.email,
      bloodGroup: user.bloodGroup,
      role: user.role
    };

    const currentDataHash = blockchainService.generateDataHash(userData);
    const isIntegrityValid = currentDataHash === user.dataHash;

    res.json({
      success: true,
      dataIntegrity: {
        isValid: isIntegrityValid,
        storedHash: user.dataHash,
        currentHash: currentDataHash,
        walletAddress: user.walletAddress,
        verifiedAt: new Date()
      }
    });
  } catch (err) {
    console.error('Data integrity verification error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error verifying data integrity',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}; 