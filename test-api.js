const axios = require('axios');

async function testSearchAPI() {
    try {
        console.log('🔍 Testing search endpoints...\n');
        
        // Test basic donor search
        console.log('1. Testing basic donor search...');
        const response1 = await axios.get('http://localhost:5000/api/search/donors', {
            params: {
                lat: 19.0760,
                lng: 72.8777,
                radius: 50
            }
        });
        console.log(`✅ Basic search: Found ${response1.data.length} donors`);
        
        // Test ML search
        console.log('\n2. Testing ML search...');
        try {
            const response2 = await axios.get('http://localhost:5000/api/search/ml', {
                params: {
                    bloodGroup: 'A+',
                    lat: 19.0760,
                    lng: 72.8777,
                    radius: 50,
                    autoRequest: true
                }
            });
            console.log(`✅ ML search: Found ${response2.data.matches?.length || 0} matches`);
            if (response2.data.auto_requests_sent) {
                console.log(`📤 Auto requests sent: ${response2.data.auto_requests_sent}`);
            }
        } catch (mlError) {
            console.log(`❌ ML search failed: ${mlError.message}`);
        }
        
        // Test search with blood group filter
        console.log('\n3. Testing search with blood group filter...');
        const response3 = await axios.get('http://localhost:5000/api/search/donors', {
            params: {
                bloodGroup: 'O+',
                lat: 19.0760,
                lng: 72.8777,
                radius: 100
            }
        });
        console.log(`✅ Blood group O+ search: Found ${response3.data.length} donors`);
        
        console.log('\n🎉 API endpoints are working correctly!');
        
        // Show sample donors
        if (response1.data.length > 0) {
            console.log('\n📋 Sample donors found:');
            response1.data.slice(0, 5).forEach((donor, index) => {
                console.log(`${index + 1}. ${donor.name} - ${donor.bloodGroup} - ${donor.isAvailable ? 'Available' : 'Not Available'}`);
            });
        }
        
    } catch (error) {
        console.error('❌ API test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

testSearchAPI();