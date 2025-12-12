import api from '../api';
import web3Service from './web3Service';

class BlockchainAuthService {
  constructor() {
    this.isAuthenticating = false;
  }

  /**
   * Generate authentication challenge from backend
   */
  async generateChallenge(walletAddress) {
    try {
      const response = await api.post('/blockchain/challenge', {
        address: walletAddress
      });

      return response.data;
    } catch (error) {
      console.error('Challenge generation error:', error);
      throw error;
    }
  }

  /**
   * Register user with blockchain verification
   */
  async registerWithBlockchain(userData, walletAddress) {
    try {
      this.isAuthenticating = true;

      // Step 1: Generate challenge
      const challengeResponse = await this.generateChallenge(walletAddress);
      
      // Step 2: Sign the challenge
      const signatureResponse = await web3Service.signMessage(challengeResponse.challenge);
      
      // Step 3: Register with backend
      const registrationData = {
        ...userData,
        walletAddress,
        signature: signatureResponse.signature,
        nonce: challengeResponse.nonce
      };

      const response = await api.post('/blockchain/register', registrationData);
      
      // Store token
      if (response.data.success && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('isBlockchainAuth', 'true');
      }

      this.isAuthenticating = false;
      return response.data;
    } catch (error) {
      this.isAuthenticating = false;
      console.error('Blockchain registration error:', error);
      throw error;
    }
  }

  /**
   * Login with blockchain wallet
   */
  async loginWithBlockchain(walletAddress) {
    try {
      this.isAuthenticating = true;

      // Step 1: Generate challenge
      const challengeResponse = await this.generateChallenge(walletAddress);
      
      // Step 2: Sign the challenge
      const signatureResponse = await web3Service.signMessage(challengeResponse.challenge);
      
      // Step 3: Login with backend
      const loginData = {
        walletAddress,
        signature: signatureResponse.signature,
        nonce: challengeResponse.nonce
      };

      const response = await api.post('/blockchain/login', loginData);
      
      // Store token
      if (response.data.success && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('isBlockchainAuth', 'true');
      }

      this.isAuthenticating = false;
      return response.data;
    } catch (error) {
      this.isAuthenticating = false;
      console.error('Blockchain login error:', error);
      throw error;
    }
  }

  /**
   * Verify data integrity
   */
  async verifyDataIntegrity() {
    try {
      const response = await api.get('/blockchain/verify-integrity');
      return response.data;
    } catch (error) {
      console.error('Data integrity verification error:', error);
      throw error;
    }
  }

  /**
   * Get blockchain profile
   */
  async getBlockchainProfile() {
    try {
      const response = await api.get('/blockchain/profile');
      return response.data;
    } catch (error) {
      console.error('Blockchain profile fetch error:', error);
      throw error;
    }
  }

  /**
   * Validate Ethereum address
   */
  async validateAddress(address) {
    try {
      const response = await api.post('/blockchain/validate-address', { address });
      return response.data;
    } catch (error) {
      console.error('Address validation error:', error);
      throw error;
    }
  }

  /**
   * Get blockchain statistics
   */
  async getBlockchainStats() {
    try {
      const response = await api.get('/blockchain/stats');
      return response.data;
    } catch (error) {
      console.error('Blockchain stats error:', error);
      throw error;
    }
  }

  /**
   * Connect wallet and get account info
   */
  async connectWallet() {
    try {
      // Initialize Web3 if not already done
      const initResult = await web3Service.initialize();
      
      if (!initResult.isConnected) {
        // Request connection
        const connectResult = await web3Service.connectWallet();
        return connectResult;
      }
      
      return initResult;
    } catch (error) {
      console.error('Wallet connection error:', error);
      throw error;
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnectWallet() {
    try {
      // Clear blockchain auth tokens
      localStorage.removeItem('isBlockchainAuth');
      
      // Disconnect Web3
      return await web3Service.disconnectWallet();
    } catch (error) {
      console.error('Wallet disconnection error:', error);
      throw error;
    }
  }

  /**
   * Check if user is authenticated with blockchain
   */
  isBlockchainAuthenticated() {
    const token = localStorage.getItem('token');
    const isBlockchainAuth = localStorage.getItem('isBlockchainAuth') === 'true';
    return token && isBlockchainAuth;
  }

  /**
   * Get authentication status
   */
  getAuthStatus() {
    const walletStatus = web3Service.getConnectionStatus();
    const isBlockchainAuth = this.isBlockchainAuthenticated();
    
    return {
      ...walletStatus,
      isAuthenticated: isBlockchainAuth,
      isAuthenticating: this.isAuthenticating
    };
  }

  /**
   * Auto-connect if previously connected
   */
  async autoConnect() {
    try {
      if (this.isBlockchainAuthenticated()) {
        const initResult = await web3Service.initialize();
        return initResult;
      }
      return { success: false, message: 'No previous blockchain authentication found' };
    } catch (error) {
      console.error('Auto-connect error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Logout (clear tokens and disconnect wallet)
   */
  async logout() {
    try {
      // Clear all auth tokens
      localStorage.removeItem('token');
      localStorage.removeItem('isBlockchainAuth');
      
      // Disconnect wallet
      await web3Service.disconnectWallet();
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }
}

export default new BlockchainAuthService();