const { ethers } = require('ethers');
const crypto = require('crypto');
const { keccak256, toUtf8Bytes } = require('ethers');

class BlockchainService {
  constructor() {
    // Initialize with Sepolia testnet (you can change to mainnet for production)
    this.provider = new ethers.JsonRpcProvider(
      process.env.ETHEREUM_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY'
    );
    
    // Contract ABI for user verification (we'll create this contract later)
    this.contractABI = [
      "function registerUser(address userAddress, string memory dataHash) public",
      "function verifyUser(address userAddress) public view returns (bool)",
      "function getUserData(address userAddress) public view returns (string memory)",
      "function updateUserData(address userAddress, string memory newDataHash) public",
      "event UserRegistered(address indexed user, string dataHash)",
      "event UserDataUpdated(address indexed user, string newDataHash)"
    ];
    
    // Contract address (deploy contract first)
    this.contractAddress = process.env.CONTRACT_ADDRESS || null;
    
    if (this.contractAddress) {
      this.contract = new ethers.Contract(
        this.contractAddress,
        this.contractABI,
        this.provider
      );
    }
  }

  /**
   * Generate a cryptographic hash of user data for blockchain storage
   */
  generateDataHash(userData) {
    try {
      const dataString = JSON.stringify(userData);
      return keccak256(toUtf8Bytes(dataString));
    } catch (error) {
      console.error('Error generating data hash:', error);
      throw new Error('Failed to generate data hash');
    }
  }

  /**
   * Verify Ethereum signature for authentication
   */
  async verifySignature(message, signature, expectedAddress) {
    try {
      const messageHash = ethers.hashMessage(message);
      const recoveredAddress = ethers.recoverAddress(messageHash, signature);
      
      return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
    } catch (error) {
      console.error('Error verifying signature:', error);
      return false;
    }
  }

  /**
   * Create a challenge message for user authentication
   */
  generateAuthChallenge(userAddress, timestamp = Date.now()) {
    const nonce = crypto.randomBytes(16).toString('hex');
    return {
      message: `Sign this message to authenticate with Plasma Donor.\nAddress: ${userAddress}\nTimestamp: ${timestamp}\nNonce: ${nonce}`,
      timestamp,
      nonce
    };
  }

  /**
   * Validate Ethereum address format
   */
  isValidAddress(address) {
    try {
      return ethers.isAddress(address);
    } catch (error) {
      return false;
    }
  }

  /**
   * Register user on blockchain (requires contract deployment)
   */
  async registerUserOnChain(userAddress, userData, privateKey) {
    try {
      if (!this.contract) {
        throw new Error('Smart contract not deployed or configured');
      }

      const wallet = new ethers.Wallet(privateKey, this.provider);
      const contractWithSigner = this.contract.connect(wallet);
      
      const dataHash = this.generateDataHash(userData);
      
      const tx = await contractWithSigner.registerUser(userAddress, dataHash);
      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        dataHash
      };
    } catch (error) {
      console.error('Error registering user on chain:', error);
      throw error;
    }
  }

  /**
   * Verify user exists on blockchain
   */
  async verifyUserOnChain(userAddress) {
    try {
      if (!this.contract) {
        return { verified: false, reason: 'Contract not available' };
      }

      const isVerified = await this.contract.verifyUser(userAddress);
      const userData = await this.contract.getUserData(userAddress);
      
      return {
        verified: isVerified,
        userData: userData || null,
        address: userAddress
      };
    } catch (error) {
      console.error('Error verifying user on chain:', error);
      return { verified: false, reason: error.message };
    }
  }

  /**
   * Get current gas price for transactions
   */
  async getGasPrice() {
    try {
      const feeData = await this.provider.getFeeData();
      return {
        gasPrice: feeData.gasPrice,
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
      };
    } catch (error) {
      console.error('Error getting gas price:', error);
      throw error;
    }
  }

  /**
   * Generate secure JWT payload with blockchain verification
   */
  generateSecurePayload(userAddress, userData) {
    const timestamp = Date.now();
    const dataHash = this.generateDataHash(userData);
    
    return {
      address: userAddress,
      dataHash,
      timestamp,
      chainId: 11155111, // Sepolia testnet
      version: '1.0'
    };
  }

  /**
   * Validate transaction hash
   */
  async validateTransaction(txHash) {
    try {
      const tx = await this.provider.getTransaction(txHash);
      const receipt = await this.provider.getTransactionReceipt(txHash);
      
      return {
        valid: !!tx && !!receipt,
        transaction: tx,
        receipt: receipt,
        confirmed: receipt ? receipt.confirmations > 0 : false
      };
    } catch (error) {
      console.error('Error validating transaction:', error);
      return { valid: false, error: error.message };
    }
  }
}

module.exports = BlockchainService;