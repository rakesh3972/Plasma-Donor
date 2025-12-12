const mongoose = require('mongoose');
const User = require('./server/models/User');
const bcrypt = require('bcryptjs');

// Load environment variables
require('dotenv').config();

// MongoDB connection using same config as the app
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://plasma_donor:Plasma%401234@plasmadonor.wfbjc5b.mongodb.net/plasmalink?retryWrites=true&w=majority&appName=Plasmadonor');

// Sample donor data with various blood groups and locations
const sampleDonors = [
  {
    name: 'John Smith',
    email: 'john.smith@email.com',
    password: 'password123',
    role: 'donor',
    bloodGroup: 'O+',
    phoneNumber: '+1-555-0101',
    isAvailable: true,
    location: {
      type: 'Point',
      coordinates: [72.8777, 19.0760], // Mumbai coordinates
      address: 'Bandra West, Mumbai, Maharashtra, India'
    },
    healthStatus: 'excellent',
    lastDonationDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    reliabilityScore: 0.95,
    donationCount: 12,
    isVerified: true
  },
  {
    name: 'Maria Garcia',
    email: 'maria.garcia@email.com',
    password: 'password123',
    role: 'donor',
    bloodGroup: 'A+',
    phoneNumber: '+1-555-0102',
    isAvailable: true,
    location: {
      type: 'Point',
      coordinates: [72.8658, 19.0725], // Near Mumbai
      address: 'Andheri East, Mumbai, Maharashtra, India'
    },
    healthStatus: 'good',
    lastDonationDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
    reliabilityScore: 0.88,
    donationCount: 8,
    isVerified: true
  },
  {
    name: 'David Wilson',
    email: 'david.wilson@email.com',
    password: 'password123',
    role: 'donor',
    bloodGroup: 'B+',
    phoneNumber: '+1-555-0103',
    isAvailable: false,
    location: {
      type: 'Point',
      coordinates: [72.8900, 19.0850], // Mumbai area
      address: 'Powai, Mumbai, Maharashtra, India'
    },
    healthStatus: 'excellent',
    lastDonationDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
    reliabilityScore: 0.92,
    donationCount: 15,
    isVerified: true
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    password: 'password123',
    role: 'donor',
    bloodGroup: 'AB+',
    phoneNumber: '+1-555-0104',
    isAvailable: true,
    location: {
      type: 'Point',
      coordinates: [72.8500, 19.0600], // Mumbai South
      address: 'Colaba, Mumbai, Maharashtra, India'
    },
    healthStatus: 'good',
    lastDonationDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
    reliabilityScore: 0.85,
    donationCount: 6,
    isVerified: true
  },
  {
    name: 'Michael Brown',
    email: 'michael.brown@email.com',
    password: 'password123',
    role: 'donor',
    bloodGroup: 'O-',
    phoneNumber: '+1-555-0105',
    isAvailable: true,
    location: {
      type: 'Point',
      coordinates: [72.8400, 19.0400], // Mumbai Central
      address: 'Dadar, Mumbai, Maharashtra, India'
    },
    healthStatus: 'excellent',
    lastDonationDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
    reliabilityScore: 0.98,
    donationCount: 20,
    isVerified: true
  },
  {
    name: 'Lisa Anderson',
    email: 'lisa.anderson@email.com',
    password: 'password123',
    role: 'donor',
    bloodGroup: 'A-',
    phoneNumber: '+1-555-0106',
    isAvailable: true,
    location: {
      type: 'Point',
      coordinates: [72.8200, 19.0300], // Mumbai South Central
      address: 'Fort, Mumbai, Maharashtra, India'
    },
    healthStatus: 'good',
    lastDonationDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // 35 days ago
    reliabilityScore: 0.90,
    donationCount: 10,
    isVerified: true
  },
  {
    name: 'Robert Davis',
    email: 'robert.davis@email.com',
    password: 'password123',
    role: 'donor',
    bloodGroup: 'B-',
    phoneNumber: '+1-555-0107',
    isAvailable: true,
    location: {
      type: 'Point',
      coordinates: [72.8600, 19.1000], // Mumbai North
      address: 'Malad West, Mumbai, Maharashtra, India'
    },
    healthStatus: 'excellent',
    lastDonationDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), // 40 days ago
    reliabilityScore: 0.87,
    donationCount: 9,
    isVerified: true
  },
  {
    name: 'Jennifer Miller',
    email: 'jennifer.miller@email.com',
    password: 'password123',
    role: 'donor',
    bloodGroup: 'AB-',
    phoneNumber: '+1-555-0108',
    isAvailable: false,
    location: {
      type: 'Point',
      coordinates: [72.8800, 19.1200], // Mumbai Far North
      address: 'Borivali East, Mumbai, Maharashtra, India'
    },
    healthStatus: 'good',
    lastDonationDate: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000), // 50 days ago
    reliabilityScore: 0.83,
    donationCount: 7,
    isVerified: true
  }
];

async function addSampleDonors() {
  try {
    console.log('🔗 Connected to MongoDB');
    
    // Clear existing donors (optional - remove this line if you want to keep existing data)
    // await User.deleteMany({ role: 'donor' });
    // console.log('🗑️ Cleared existing donors');
    
    // Check if donors already exist
    const existingDonors = await User.find({ role: 'donor' });
    console.log(`📊 Found ${existingDonors.length} existing donors`);
    
    if (existingDonors.length > 0) {
      console.log('✅ Donors already exist, skipping creation');
      console.log('📍 Existing donors:', existingDonors.map(d => ({ 
        name: d.name, 
        bloodGroup: d.bloodGroup, 
        available: d.isAvailable,
        location: d.location?.address || 'No address'
      })));
      process.exit(0);
    }
    
    // Hash passwords and add donors
    const donorsWithHashedPasswords = await Promise.all(
      sampleDonors.map(async (donor) => {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(donor.password, salt);
        return {
          ...donor,
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      })
    );
    
    // Insert all donors
    const createdDonors = await User.insertMany(donorsWithHashedPasswords);
    console.log(`✅ Successfully added ${createdDonors.length} sample donors to the database`);
    
    // Display summary
    console.log('\n📋 Summary of added donors:');
    createdDonors.forEach((donor, index) => {
      console.log(`${index + 1}. ${donor.name} - ${donor.bloodGroup} - ${donor.isAvailable ? 'Available' : 'Not Available'} - ${donor.location.address}`);
    });
    
    console.log('\n🎉 Sample donors added successfully! You can now test the search functionality.');
    
  } catch (error) {
    console.error('❌ Error adding sample donors:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔐 Database connection closed');
  }
}

// Run the script
addSampleDonors();