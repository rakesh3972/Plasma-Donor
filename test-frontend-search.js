// Test script to simulate frontend search functionality
const axios = require('axios');

const baseURL = 'http://localhost:5000/api';

async function testFrontendSearch() {
    console.log('🔍 Testing Frontend Search Simulation...\n');

    // Test 1: Simulate "Show All Available Donors" button
    try {
        console.log('1. Testing "Show All Available Donors" button...');
        
        // Try the frontend fallback sequence
        let donorsData = [];
        
        // First try: Search with very large radius
        try {
            const response1 = await axios.get(`${baseURL}/search/donors`, { 
                params: {
                    lat: 19.0760,
                    lng: 72.8777,
                    radius: 1000
                }
            });
            
            // Handle API response structure: { matches: [...], compatible_count: 0, total_donors: 22 }
            if (response1.data && response1.data.matches) {
                donorsData = response1.data.matches;
            } else if (Array.isArray(response1.data)) {
                donorsData = response1.data;
            } else {
                donorsData = [];
            }
            
            console.log(`✅ Large radius search: Found ${donorsData.length} donors`);
            if (donorsData.length > 0) {
                console.log(`   Sample donor: ${donorsData[0].name} - ${donorsData[0].bloodGroup}`);
            }
        } catch (error1) {
            console.log(`❌ Large radius search failed: ${error1.message}`);
        }
        
    } catch (error) {
        console.log(`❌ Show All Donors failed: ${error.message}`);
    }

    // Test 2: Simulate "Smart Search (AI-Powered)" button
    try {
        console.log('\n2. Testing "Smart Search (AI-Powered)" button...');
        
        const response = await axios.get(`${baseURL}/search/ml`, { 
            params: {
                bloodGroup: 'A+',
                lat: 12.9716,
                lng: 77.5946,
                radius: 100,
                autoRequest: true
            }
        });
        
        // Process AI search results like frontend does
        const aiResults = response.data.matches || [];
        
        const processedResults = aiResults.map(match => ({
            _id: match.donor_id,
            name: match.donor_name,
            bloodGroup: match.donor_blood_group,
            phoneNumber: match.donor_phone,
            isAvailable: true,
            location: match.location || { address: 'Location not specified' },
            distance: match.distance,
            ml_score: match.ml_score,
            compatibility_score: match.compatibility_score,
            fraud_risk: match.fraud_risk
        }));
        
        console.log(`✅ AI Search: Found ${processedResults.length} compatible donors`);
        if (processedResults.length > 0) {
            console.log(`   Sample AI match: ${processedResults[0].name} - ${processedResults[0].bloodGroup}`);
            console.log(`   ML Score: ${processedResults[0].ml_score}, Compatibility: ${processedResults[0].compatibility_score}`);
        }
        
    } catch (error) {
        console.log(`❌ AI Search failed: ${error.message}`);
    }

    console.log('\n🏁 Frontend Search Test Complete');
}

testFrontendSearch();