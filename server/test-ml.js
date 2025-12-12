// Test script to verify ML integration
const mlService = require('./services/mlService');

async function testMLIntegration() {
  console.log('🧪 Testing ML Integration...\n');

  // 1. Test Fraud Detection
  console.log('1. Testing Fraud Detection...');
  const testUser = {
    requestFrequency: 2,
    successfulDonations: 1,
    phoneNumber: '1234567890',
    suspiciousActivity: false
  };

  try {
    const fraudResult = await mlService.detectFraud(testUser);
    console.log('✅ Fraud Detection Result:', fraudResult);
  } catch (error) {
    console.log('❌ Fraud Detection Error:', error.message);
  }

  // 2. Test Basic Matching
  console.log('\n2. Testing Basic Matching...');
  const requester = {
    bloodGroup: 'A+',
    location: { lat: 19.0760, lng: 72.8777 }
  };

  const donors = [
    {
      _id: 'donor1',
      name: 'John Doe',
      bloodGroup: 'A+',
      phoneNumber: '9876543210',
      isAvailable: true,
      location: { lat: 19.0800, lng: 72.8800 }
    },
    {
      _id: 'donor2',
      name: 'Jane Smith',
      bloodGroup: 'O-',
      phoneNumber: '9876543211',
      isAvailable: true,
      location: { lat: 19.0700, lng: 72.8700 }
    }
  ];

  try {
    const matchResult = await mlService.enhancedMatching(requester, donors);
    console.log('✅ Enhanced Matching Result:', {
      matches_found: matchResult.matches.length,
      ml_used: matchResult.ml_used,
      algorithm: matchResult.algorithm
    });
    
    if (matchResult.matches.length > 0) {
      console.log('Top match:', {
        name: matchResult.matches[0].donor_name,
        blood_group: matchResult.matches[0].donor_blood_group,
        compatibility_score: matchResult.matches[0].compatibility_score,
        distance: matchResult.matches[0].distance
      });
    }
  } catch (error) {
    console.log('❌ Enhanced Matching Error:', error.message);
  }

  console.log('\n🎉 ML Integration Test Complete!');
}

// Run the test
testMLIntegration().catch(console.error);