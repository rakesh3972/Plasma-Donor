import React, { useState, useEffect } from 'react';
import { FaWallet, FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';
import blockchainAuthService from '../services/blockchain/blockchainAuthService';
import web3Service from '../services/blockchain/web3Service';

const WalletConnection = ({ onConnectionChange, showBalance = false }) => {
  const [walletState, setWalletState] = useState({
    isConnected: false,
    account: null,
    chainId: null,
    networkName: null,
    balance: null,
    isConnecting: false,
    error: null
  });

  useEffect(() => {
    // Check if MetaMask is installed
    if (!web3Service.constructor.isMetaMaskInstalled()) {
      setWalletState(prev => ({
        ...prev,
        error: 'MetaMask is not installed. Please install MetaMask to continue.'
      }));
      return;
    }

    // Auto-connect if previously connected
    autoConnect();

    // Listen for wallet events
    const handleWalletDisconnected = () => {
      setWalletState(prev => ({
        ...prev,
        isConnected: false,
        account: null,
        chainId: null,
        networkName: null,
        balance: null
      }));
      onConnectionChange && onConnectionChange(false, null);
    };

    const handleAccountChanged = (event) => {
      const { account } = event.detail;
      setWalletState(prev => ({
        ...prev,
        account
      }));
      onConnectionChange && onConnectionChange(true, account);
    };

    const handleChainChanged = (event) => {
      const { chainId, networkName } = event.detail;
      setWalletState(prev => ({
        ...prev,
        chainId,
        networkName
      }));
    };

    window.addEventListener('walletDisconnected', handleWalletDisconnected);
    window.addEventListener('walletAccountChanged', handleAccountChanged);
    window.addEventListener('walletChainChanged', handleChainChanged);

    return () => {
      window.removeEventListener('walletDisconnected', handleWalletDisconnected);
      window.removeEventListener('walletAccountChanged', handleAccountChanged);
      window.removeEventListener('walletChainChanged', handleChainChanged);
    };
  }, [onConnectionChange]);

  const autoConnect = async () => {
    try {
      const result = await blockchainAuthService.autoConnect();
      if (result.success) {
        const status = blockchainAuthService.getAuthStatus();
        setWalletState(prev => ({
          ...prev,
          isConnected: status.isConnected,
          account: status.account,
          chainId: status.chainId,
          networkName: status.networkName,
          error: null
        }));
        
        if (showBalance && status.account) {
          await fetchBalance();
        }

        onConnectionChange && onConnectionChange(status.isConnected, status.account);
      }
    } catch (error) {
      console.error('Auto-connect failed:', error);
    }
  };

  const connectWallet = async () => {
    try {
      setWalletState(prev => ({ ...prev, isConnecting: true, error: null }));

      const result = await blockchainAuthService.connectWallet();
      
      if (result.success) {
        const status = blockchainAuthService.getAuthStatus();
        setWalletState(prev => ({
          ...prev,
          isConnected: true,
          account: result.account,
          chainId: result.chainId,
          networkName: web3Service.getNetworkName(result.chainId),
          isConnecting: false,
          error: null
        }));

        if (showBalance) {
          await fetchBalance();
        }

        onConnectionChange && onConnectionChange(true, result.account);
      }
    } catch (error) {
      setWalletState(prev => ({
        ...prev,
        isConnecting: false,
        error: error.message
      }));
    }
  };

  const disconnectWallet = async () => {
    try {
      await blockchainAuthService.disconnectWallet();
      setWalletState(prev => ({
        ...prev,
        isConnected: false,
        account: null,
        chainId: null,
        networkName: null,
        balance: null,
        error: null
      }));
      onConnectionChange && onConnectionChange(false, null);
    } catch (error) {
      setWalletState(prev => ({
        ...prev,
        error: error.message
      }));
    }
  };

  const fetchBalance = async () => {
    try {
      const balanceResult = await web3Service.getBalance();
      if (balanceResult.success) {
        setWalletState(prev => ({
          ...prev,
          balance: parseFloat(balanceResult.balance).toFixed(4)
        }));
      }
    } catch (error) {
      console.error('Balance fetch error:', error);
    }
  };

  const switchToSepolia = async () => {
    try {
      await web3Service.switchToSepoliaNetwork();
    } catch (error) {
      setWalletState(prev => ({
        ...prev,
        error: `Failed to switch network: ${error.message}`
      }));
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const isSepoliaNetwork = walletState.chainId === '0xaa36a7';

  return (
    <div className="wallet-connection">
      {/* Error Display */}
      {walletState.error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <div className="flex items-center">
            <FaTimes className="mr-2" />
            <span>{walletState.error}</span>
          </div>
          {walletState.error.includes('MetaMask') && (
            <a
              href={web3Service.constructor.getMetaMaskDownloadUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline ml-6 text-sm"
            >
              Download MetaMask
            </a>
          )}
        </div>
      )}

      {/* Connection Status */}
      {!walletState.isConnected ? (
        <button
          onClick={connectWallet}
          disabled={walletState.isConnecting}
          className={`flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors ${
            walletState.isConnecting
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {walletState.isConnecting ? (
            <>
              <FaSpinner className="animate-spin mr-2" />
              Connecting...
            </>
          ) : (
            <>
              <FaWallet className="mr-2" />
              Connect Wallet
            </>
          )}
        </button>
      ) : (
        <div className="space-y-3">
          {/* Connected Status */}
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <FaCheck className="text-green-600 mr-2" />
              <div>
                <div className="font-medium text-green-800">
                  Wallet Connected
                </div>
                <div className="text-sm text-green-600">
                  {formatAddress(walletState.account)}
                </div>
              </div>
            </div>
            <button
              onClick={disconnectWallet}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Disconnect
            </button>
          </div>

          {/* Network Info */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-800">Network</div>
                <div className="text-sm text-gray-600">
                  {walletState.networkName || 'Unknown Network'}
                </div>
              </div>
              {!isSepoliaNetwork && (
                <button
                  onClick={switchToSepolia}
                  className="px-3 py-1 bg-orange-500 text-white text-sm rounded hover:bg-orange-600"
                >
                  Switch to Sepolia
                </button>
              )}
            </div>
          </div>

          {/* Balance Info */}
          {showBalance && walletState.balance && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="font-medium text-gray-800">Balance</div>
              <div className="text-sm text-gray-600">
                {walletState.balance} ETH
              </div>
            </div>
          )}

          {/* Network Warning */}
          {!isSepoliaNetwork && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-yellow-800 text-sm">
                ⚠️ Please switch to Sepolia Testnet for full functionality
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WalletConnection;