import { ethers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';

class Web3Service {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.account = null;
    this.chainId = null;
    this.isConnected = false;
  }

  /**
   * Initialize Web3 connection
   */
  async initialize() {
    try {
      // Detect MetaMask or other Web3 providers
      const ethereumProvider = await detectEthereumProvider();
      
      if (!ethereumProvider) {
        throw new Error('Please install MetaMask or another Web3 wallet');
      }

      // Initialize ethers provider
      this.provider = new ethers.BrowserProvider(window.ethereum);
      
      // Check if already connected
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        this.account = accounts[0];
        this.signer = await this.provider.getSigner();
        this.chainId = await window.ethereum.request({ method: 'eth_chainId' });
        this.isConnected = true;
      }

      // Listen for account changes
      window.ethereum.on('accountsChanged', this.handleAccountsChanged.bind(this));
      
      // Listen for chain changes
      window.ethereum.on('chainChanged', this.handleChainChanged.bind(this));

      return {
        success: true,
        account: this.account,
        chainId: this.chainId,
        isConnected: this.isConnected
      };
    } catch (error) {
      console.error('Web3 initialization error:', error);
      throw error;
    }
  }

  /**
   * Connect to MetaMask wallet
   */
  async connectWallet() {
    try {
      if (!this.provider) {
        await this.initialize();
      }

      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please unlock your wallet.');
      }

      this.account = accounts[0];
      this.signer = await this.provider.getSigner();
      this.chainId = await window.ethereum.request({ method: 'eth_chainId' });
      this.isConnected = true;

      return {
        success: true,
        account: this.account,
        chainId: this.chainId
      };
    } catch (error) {
      console.error('Wallet connection error:', error);
      throw error;
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnectWallet() {
    this.provider = null;
    this.signer = null;
    this.account = null;
    this.chainId = null;
    this.isConnected = false;
    
    return { success: true };
  }

  /**
   * Sign a message with the connected wallet
   */
  async signMessage(message) {
    try {
      if (!this.signer) {
        throw new Error('No wallet connected. Please connect your wallet first.');
      }

      const signature = await this.signer.signMessage(message);
      
      return {
        success: true,
        signature,
        message,
        address: this.account
      };
    } catch (error) {
      console.error('Message signing error:', error);
      throw error;
    }
  }

  /**
   * Get current account balance
   */
  async getBalance() {
    try {
      if (!this.provider || !this.account) {
        throw new Error('No wallet connected');
      }

      const balance = await this.provider.getBalance(this.account);
      const balanceInEth = ethers.formatEther(balance);

      return {
        success: true,
        balance: balanceInEth,
        balanceWei: balance.toString(),
        address: this.account
      };
    } catch (error) {
      console.error('Balance fetch error:', error);
      throw error;
    }
  }

  /**
   * Switch to the correct network (Sepolia testnet)
   */
  async switchToSepoliaNetwork() {
    try {
      const sepoliaChainId = '0xaa36a7'; // Sepolia testnet chain ID
      
      try {
        // Try to switch to Sepolia
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: sepoliaChainId }],
        });
      } catch (switchError) {
        // If Sepolia is not added, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: sepoliaChainId,
              chainName: 'Sepolia Test Network',
              nativeCurrency: {
                name: 'SepoliaETH',
                symbol: 'SEP',
                decimals: 18
              },
              rpcUrls: ['https://sepolia.infura.io/v3/'],
              blockExplorerUrls: ['https://sepolia.etherscan.io/']
            }]
          });
        } else {
          throw switchError;
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Network switch error:', error);
      throw error;
    }
  }

  /**
   * Validate Ethereum address
   */
  isValidAddress(address) {
    return ethers.isAddress(address);
  }

  /**
   * Get network name from chain ID
   */
  getNetworkName(chainId) {
    const networks = {
      '0x1': 'Ethereum Mainnet',
      '0x3': 'Ropsten Testnet',
      '0x4': 'Rinkeby Testnet',
      '0x5': 'Goerli Testnet',
      '0xaa36a7': 'Sepolia Testnet',
      '0x89': 'Polygon Mainnet',
      '0x13881': 'Polygon Mumbai Testnet'
    };
    
    return networks[chainId] || `Unknown Network (${chainId})`;
  }

  /**
   * Handle account changes
   */
  handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
      // User disconnected
      this.disconnectWallet();
      window.dispatchEvent(new CustomEvent('walletDisconnected'));
    } else if (accounts[0] !== this.account) {
      // User switched accounts
      this.account = accounts[0];
      window.dispatchEvent(new CustomEvent('walletAccountChanged', {
        detail: { account: this.account }
      }));
    }
  }

  /**
   * Handle chain changes
   */
  handleChainChanged(chainId) {
    this.chainId = chainId;
    window.dispatchEvent(new CustomEvent('walletChainChanged', {
      detail: { chainId, networkName: this.getNetworkName(chainId) }
    }));
  }

  /**
   * Get current connection status
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      account: this.account,
      chainId: this.chainId,
      networkName: this.chainId ? this.getNetworkName(this.chainId) : null
    };
  }

  /**
   * Check if MetaMask is installed
   */
  static isMetaMaskInstalled() {
    return typeof window !== 'undefined' && Boolean(window.ethereum?.isMetaMask);
  }

  /**
   * Get MetaMask download URL
   */
  static getMetaMaskDownloadUrl() {
    return 'https://metamask.io/download/';
  }
}

export default new Web3Service();