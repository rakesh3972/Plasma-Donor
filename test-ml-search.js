const axios = require('axios');

async function testMLSearch() {
    try {
        console.log('🤖 Testing AI/ML Search endpoint...\n');
        
        // Test ML search endpoint
        const response = await axios.get('http://localhost:5000/api/search/ml', {
            params: {
                bloodGroup: 'A-',
                lat: 12.9716,
                lng: 77.5946,
                radius: 100,
                autoRequest: true
            }
        });
        
        console.log('✅ ML Search successful!');
        console.log('Response status:', response.status);
        console.log('Matches found:', response.data.matches?.length || 0);
        console.log('Compatible donors:', response.data.total_compatible || 0);
        console.log('Auto requests sent:', response.data.auto_requests_sent || 0);
        console.log('Message:', response.data.message);
        
        if (response.data.matches && response.data.matches.length > 0) {
            console.log('\n📋 Sample matches:');
            response.data.matches.slice(0, 3).forEach((match, index) => {
                console.log(`${index + 1}. ${match.donor_name} - ${match.donor_blood_group} - Score: ${match.compatibility_score || 'N/A'}`);
            });
        }
        
        return response.data;
        
    } catch (error) {
        console.error('❌ ML Search failed:', error.message || 'Unknown error');
        console.error('Full error:', error);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        if (error.request) {
            console.error('Request was made but no response received');
            console.error('Request:', error.request);
        }
        return null;
    }
}

// Test the endpoint
testMLSearch().then(result => {
    if (result) {
        console.log('\n🎉 AI Search is working correctly!');
    } else {
        console.log('\n❌ AI Search needs debugging');
    }
});