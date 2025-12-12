const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class MLService {
  constructor() {
    this.pythonPath = process.env.PYTHON_PATH || 'python';
    this.mlScriptPath = path.join(__dirname, 'blood_matching_ml.py');
    this.modelsDir = path.join(__dirname, 'models');
    
    // Ensure models directory exists
    if (!fs.existsSync(this.modelsDir)) {
      fs.mkdirSync(this.modelsDir, { recursive: true });
    }
  }

  async executePythonScript(command, inputData = {}) {
    return new Promise((resolve, reject) => {
      const python = spawn(this.pythonPath, [this.mlScriptPath, command], {
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let error = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        error += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output);
            resolve(result);
          } catch (parseError) {
            reject(new Error(`Failed to parse JSON output: ${output}`));
          }
        } else {
          reject(new Error(`Python script failed with code ${code}: ${error}`));
        }
      });

      python.on('error', (err) => {
        reject(new Error(`Failed to start Python process. Please ensure Python 3 is installed and configured correctly. Error: ${err.message}`));
      });

      // Send input data to Python script
      if (inputData && Object.keys(inputData).length > 0) {
        python.stdin.write(JSON.stringify(inputData));
      }
      python.stdin.end();
    });
  }

  async trainModels(usersData) {
    try {
      console.log(`Training ML models with ${usersData.length} users...`);
      const result = await this.executePythonScript('train', { users: usersData });
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
      const result = await this.executePythonScript('predict', {
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
      const result = await this.executePythonScript('fraud', { user: userData });
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

  async findBestMatches(requesterData, donorsData, maxMatches = 5) {
    try {
      const result = await this.executePythonScript('match', {
        requester: requesterData,
        donors: donorsData,
        max_matches: maxMatches
      });
      return result.matches || [];
    } catch (error) {
      console.error('ML matching error:', error);
      return [];
    }
  }

  // Blood compatibility checking (for quick validation without ML)
  isBloodCompatible(donorBloodGroup, requesterBloodGroup) {
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

    return bloodCompatibility[donorBloodGroup]?.includes(requesterBloodGroup) || false;
  }

  // Calculate distance between two points (Haversine formula)
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Enhanced matching algorithm with ML and traditional logic
  async enhancedMatching(requesterData, allDonors) {
    try {
      // First, filter by blood compatibility
      const compatibleDonors = allDonors.filter(donor => 
        this.isBloodCompatible(donor.bloodGroup, requesterData.bloodGroup) &&
        donor.isAvailable &&
        donor.role === 'donor'
      );

      if (compatibleDonors.length === 0) {
        return {
          matches: [],
          message: 'No compatible donors found',
          total_compatible: 0
        };
      }

      // Use ML for enhanced matching
      const mlMatches = await this.findBestMatches(requesterData, compatibleDonors);
      
      // Fallback to traditional matching if ML fails
      if (mlMatches.length === 0) {
        console.log('ML matching failed, using traditional matching');
        const traditionalMatches = compatibleDonors.map(donor => {
          const distance = this.calculateDistance(
            requesterData.location?.lat || 0,
            requesterData.location?.lng || 0,
            donor.location?.lat || 0,
            donor.location?.lng || 0
          );

          return {
            donor_id: donor._id || donor.id,
            donor_name: donor.name,
            donor_blood_group: donor.bloodGroup,
            donor_phone: donor.phoneNumber,
            compatibility_score: distance > 0 ? Math.max(0, 1 - distance / 50) : 0.5,
            distance: distance,
            ml_score: 0.5,
            location: donor.location,
            fraud_risk: 0
          };
        }).sort((a, b) => b.compatibility_score - a.compatibility_score).slice(0, 5);

        return {
          matches: traditionalMatches,
          message: 'Matches found using traditional algorithm',
          total_compatible: compatibleDonors.length,
          ml_used: false
        };
      }

      return {
        matches: mlMatches,
        message: 'Matches found using ML algorithm',
        total_compatible: compatibleDonors.length,
        ml_used: true
      };

    } catch (error) {
      console.error('Enhanced matching error:', error);
      return {
        matches: [],
        message: `Matching failed: ${error.message}`,
        total_compatible: 0,
        error: error.message
      };
    }
  }
}

module.exports = new MLService();