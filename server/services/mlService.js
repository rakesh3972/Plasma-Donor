const { spawn } = require('child_process');
const path = require('path');

class MLService {
  constructor() {
    this.pythonPath = process.env.PYTHON_PATH || 'python';
    this.scriptPath = path.join(__dirname, '..', 'ml', 'blood_matching_ml.py');
  }

  async callPythonScript(command, data = {}) {
    return new Promise((resolve, reject) => {
      const python = spawn(this.pythonPath, [this.scriptPath, command]);
      
      let output = '';
      let errorOutput = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      python.on('close', (code) => {
        if (code !== 0) {
          console.error('Python script error:', errorOutput);
          reject(new Error(`Python script failed with code ${code}: ${errorOutput}`));
          return;
        }

        try {
          // Clean the output by extracting only the JSON part
          const lines = output.trim().split('\n');
          let jsonLine = '';
          
          // Find the line that contains valid JSON (starts with { or [)
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('{') || trimmedLine.startsWith('[')) {
              jsonLine = trimmedLine;
              break;
            }
          }
          
          if (!jsonLine) {
            // If no JSON found, try parsing the last line
            jsonLine = lines[lines.length - 1];
          }
          
          const result = JSON.parse(jsonLine);
          resolve(result);
        } catch (parseError) {
          console.error('Failed to parse Python output:', output);
          reject(new Error(`Failed to parse Python output: ${parseError.message}`));
        }
      });

      // Send input data to Python script
      if (Object.keys(data).length > 0) {
        python.stdin.write(JSON.stringify(data));
      }
      python.stdin.end();
    });
  }

  async trainModels(usersData) {
    try {
      console.log(`Training ML models with ${usersData.length} users...`);
      const result = await this.callPythonScript('train', { users: usersData });
      console.log('ML training result:', result);
      return result;
    } catch (error) {
      console.error('ML training error:', error);
      return {
        status: 'error',
        message: error.message
      };
    }
  }

  async predictCompatibility(donorData, requesterData) {
    try {
      const result = await this.callPythonScript('predict', {
        donor: donorData,
        requester: requesterData
      });
      return result;
    } catch (error) {
      console.error('ML prediction error:', error);
      return {
        compatible: false,
        compatibility_score: 0.0,
        ml_score: 0.0,
        distance: 0,
        error: error.message
      };
    }
  }

  async detectFraud(userData) {
    try {
      const result = await this.callPythonScript('fraud', { user: userData });
      return result;
    } catch (error) {
      console.error('Fraud detection error:', error);
      return {
        is_fraud: false,
        fraud_score: 0.0,
        error: error.message
      };
    }
  }

  async enhancedMatching(requesterData, donorsData) {
    try {
      console.log(`Enhanced matching for requester with ${donorsData.length} donors...`);
      
      const result = await this.callPythonScript('match', {
        requester: requesterData,
        donors: donorsData,
        max_matches: 10
      });
      
      console.log(`Enhanced matching found ${result.matches?.length || 0} matches`);
      
      return {
        matches: result.matches || [],
        ml_used: true,
        total_donors_analyzed: donorsData.length,
        algorithm: 'Logistic Regression + Random Forest'
      };
    } catch (error) {
      console.error('Enhanced matching error:', error);
      
      // Fallback to basic compatibility checking
      console.log('Falling back to basic compatibility matching...');
      return this.basicMatching(requesterData, donorsData);
    }
  }

  // Fallback method for basic matching without ML
  basicMatching(requesterData, donorsData) {
    const bloodCompatibility = {
      'A+': ['A+', 'AB+'],
      'A-': ['A+', 'A-', 'AB+', 'AB-'],
      'B+': ['B+', 'AB+'],
      'B-': ['B+', 'B-', 'AB+', 'AB-'],
      'AB+': ['AB+'],
      'AB-': ['AB+', 'AB-'],
      'O+': ['A+', 'B+', 'AB+', 'O+'],
      'O-': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    };

    const isCompatible = (donorBlood, requesterBlood) => {
      return bloodCompatibility[donorBlood]?.includes(requesterBlood) || false;
    };

    const calculateDistance = (lat1, lng1, lat2, lng2) => {
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    const matches = donorsData
      .filter(donor => {
        if (!donor.isAvailable) return false;
        return isCompatible(donor.bloodGroup, requesterData.bloodGroup);
      })
      .map(donor => {
        const distance = calculateDistance(
          requesterData.location.lat,
          requesterData.location.lng,
          donor.location.lat,
          donor.location.lng
        );

        // Advanced ranking score calculation
        let rankingScore = 0;
        
        // 1. Blood Compatibility (40%)
        const bloodMatch = isCompatible(donor.bloodGroup, requesterData.bloodGroup);
        if (bloodMatch) {
          rankingScore += 0.4;
          // Exact match bonus
          if (donor.bloodGroup === requesterData.bloodGroup) {
            rankingScore += 0.05;
          }
        }
        
        // 2. Distance Score (30%)
        const distanceScore = Math.max(0, 1 - distance / 50);
        rankingScore += distanceScore * 0.3;
        
        // 3. Activity Status (20%)
        if (donor.isAvailable) {
          rankingScore += 0.2;
        }
        // Recent activity bonus
        if (donor.lastActive) {
          const daysSinceActive = (Date.now() - new Date(donor.lastActive).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceActive < 7) {
            rankingScore += 0.05;
          } else if (daysSinceActive < 30) {
            rankingScore += 0.03;
          }
        }
        
        // 4. Donation History (10%)
        const successfulDonations = donor.successfulDonations || 0;
        const historyScore = Math.min(0.1, successfulDonations * 0.02);
        rankingScore += historyScore;

        return {
          donor_id: donor._id || donor.id,
          donor_name: donor.name,
          donor_blood_group: donor.bloodGroup,
          donor_phone: donor.phoneNumber,
          compatibility_score: rankingScore,
          distance: distance,
          ml_score: rankingScore,
          location: donor.location,
          fraud_risk: 0,
          blood_compatibility_score: bloodMatch ? 1.0 : 0.0,
          // Additional ranking details
          distance_km: distance.toFixed(2),
          is_available: donor.isAvailable,
          donation_count: successfulDonations
        };
      })
      .sort((a, b) => {
        // Primary sort: compatibility score (higher is better)
        if (Math.abs(b.compatibility_score - a.compatibility_score) > 0.01) {
          return b.compatibility_score - a.compatibility_score;
        }
        // Secondary sort: distance (closer is better)
        return a.distance - b.distance;
      })
      .slice(0, 10);

    return {
      matches: matches,
      ml_used: false,
      total_donors_analyzed: donorsData.length,
      algorithm: 'Basic Blood Compatibility'
    };
  }

  async autoTrainModels() {
    try {
      console.log('🤖 Starting automatic ML model training with synthetic data...');
      const result = await this.callPythonScript('auto-train');
      
      if (result.status === 'success') {
        console.log('✅ ML models trained and saved successfully');
        return result;
      } else {
        throw new Error(result.message || 'Training failed');
      }
    } catch (error) {
      console.error('❌ ML auto-training failed:', error.message);
      return {
        status: 'error',
        message: `Auto-training failed: ${error.message}`,
        fallback: 'Will use basic matching until manual training'
      };
    }
  }
}

module.exports = new MLService();