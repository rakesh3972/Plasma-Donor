const axios = require('axios');

async function testSearchEndpoints() {
    const baseURL = 'http://localhost:5000/api';
    
    console.log('🔍 Testing Search Endpoints...\n');
    
    // Test 1: Basic donors search
    try {
        console.log('1. Testing basic donors search...');
        const response1 = await axios.get(`${baseURL}/search/donors`, {
            params: {
                lat: 12.9716,
                lng: 77.5946,
                radius: 100
            }
        });
        console.log(`✅ Basic donors search: ${response1.status} - Found ${response1.data?.matches?.length || 0} donors`);
        if (response1.data?.matches && response1.data.matches.length > 0) {
            console.log(`   Sample: ${response1.data.matches[0].name} - ${response1.data.matches[0].bloodGroup}`);
        }
    } catch (error) {
        console.log(`❌ Basic donors search failed: ${error.response?.status || 'No response'} - ${error.message}`);
        if (error.response?.data) {
            console.log(`   Error data:`, error.response.data);
        }
    }
    
    // Test 2: ML search
    try {
        console.log('\n2. Testing ML search...');
        const response2 = await axios.get(`${baseURL}/search/ml`, {
            params: {
                bloodGroup: 'A-',
                lat: 12.9716,
                lng: 77.5946,
                radius: 100,
                autoRequest: true
            }
        });
        console.log(`✅ ML search: ${response2.status} - Found ${response2.data?.matches?.length || 0} matches`);
        if (response2.data?.matches && response2.data.matches.length > 0) {
            console.log(`   Sample: ${response2.data.matches[0].donor_name} - ${response2.data.matches[0].donor_blood_group}`);
        }
        console.log(`   Message: ${response2.data?.message || 'No message'}`);
    } catch (error) {
        console.log(`❌ ML search failed: ${error.response?.status || 'No response'} - ${error.message}`);
        if (error.response?.data) {
            console.log(`   Error data:`, error.response.data);
        }
    }
    
    // Test 3: Search without location
    try {
        console.log('\n3. Testing search without location...');
        const response3 = await axios.get(`${baseURL}/search/donors`);
        console.log(`✅ No location search: ${response3.status} - Found ${response3.data?.allUsers?.length || response3.data?.matches?.length || 0} donors`);
    } catch (error) {
        console.log(`❌ No location search failed: ${error.response?.status || 'No response'} - ${error.message}`);
        if (error.response?.data) {
            console.log(`   Error data:`, error.response.data);
        }
    }
    
    // Test 4: Get all users (debug endpoint)
    try {
        console.log('\n4. Testing debug endpoint...');
        const response4 = await axios.get(`${baseURL}/search/debug`);
        console.log(`✅ Debug endpoint: ${response4.status} - Found ${response4.data?.users?.length || 0} users total`);
        if (response4.data?.donors) {
            console.log(`   Donors: ${response4.data.donors.length}`);
        }
    } catch (error) {
        console.log(`❌ Debug endpoint failed: ${error.response?.status || 'No response'} - ${error.message}`);
    }
    
    console.log('\n🏁 API Tests Complete');
}

testSearchEndpoints();