import React, { useState } from 'react';
import { FaShield, FaUserPlus, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-toastify';
import WalletConnection from './WalletConnection';
import blockchainAuthService from '../services/blockchain/blockchainAuthService';

const BlockchainRegister = ({ onSuccess, switchToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bloodGroup: '',
    role: 'donor',
    location: {
      lat: 0,
      lng: 0,
      address: ''
    }
  });

  const [walletData, setWalletData] = useState({
    isConnected: false,
    account: null
  });

  const [isRegistering, setIsRegistering] = useState(false);
  const [useBlockchain, setUseBlockchain] = useState(false);

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleWalletConnection = (isConnected, account) => {
    setWalletData({
      isConnected,
      account
    });
  };

  const validateForm = () => {
    const { name, email, bloodGroup, role } = formData;
    
    if (!name.trim() || name.trim().length < 2) {
      toast.error('Name must be at least 2 characters long');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please provide a valid email address');
      return false;
    }

    if (!bloodGroups.includes(bloodGroup)) {
      toast.error('Please select a valid blood group');
      return false;
    }

    if (!['donor', 'requester'].includes(role)) {
      toast.error('Please select a valid role');
      return false;
    }

    if (useBlockchain && !walletData.isConnected) {
      toast.error('Please connect your wallet for blockchain registration');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsRegistering(true);

    try {
      let result;
      
      if (useBlockchain && walletData.isConnected) {
        // Blockchain registration
        result = await blockchainAuthService.registerWithBlockchain(
          formData,
          walletData.account
        );
        
        if (result.success) {
          toast.success('🎉 Registration successful with blockchain verification!');
          onSuccess && onSuccess(result.user, result.token, true);
        }
      } else {
        // Traditional registration (you'd need to implement this)
        toast.error('Traditional registration not implemented in this example');
        return;
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Create Account
        </h2>
        <p className="text-gray-600">
          Join the Plasma Donor Network
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your full name"
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your email address"
          />
        </div>

        {/* Blood Group */}
        <div>
          <label htmlFor="bloodGroup" className="block text-sm font-medium text-gray-700 mb-1">
            Blood Group *
          </label>
          <select
            id="bloodGroup"
            name="bloodGroup"
            value={formData.bloodGroup}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select Blood Group</option>
            {bloodGroups.map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
        </div>

        {/* Role */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            Role *
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="donor">Donor</option>
            <option value="requester">Requester</option>
          </select>
        </div>

        {/* Blockchain Option */}
        <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
          <div className="flex items-center mb-3">
            <input
              type="checkbox"
              id="useBlockchain"
              checked={useBlockchain}
              onChange={(e) => setUseBlockchain(e.target.checked)}
              className="mr-3"
            />
            <label htmlFor="useBlockchain" className="flex items-center font-medium text-gray-800">
              <FaShield className="mr-2 text-blue-600" />
              Enhanced Security with Blockchain
            </label>
          </div>
          
          <p className="text-sm text-gray-600 mb-3">
            Register with blockchain verification for enhanced security and data integrity
          </p>

          {useBlockchain && (
            <WalletConnection 
              onConnectionChange={handleWalletConnection}
              showBalance={false}
            />
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isRegistering || (useBlockchain && !walletData.isConnected)}
          className={`w-full flex items-center justify-center px-4 py-3 rounded-md font-medium transition-colors ${
            isRegistering || (useBlockchain && !walletData.isConnected)
              ? 'bg-gray-300 cursor-not-allowed text-gray-500'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isRegistering ? (
            <>
              <FaSpinner className="animate-spin mr-2" />
              {useBlockchain ? 'Registering with Blockchain...' : 'Registering...'}
            </>
          ) : (
            <>
              <FaUserPlus className="mr-2" />
              {useBlockchain ? 'Register with Blockchain' : 'Register'}
            </>
          )}
        </button>
      </form>

      {/* Login Link */}
      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Already have an account?{' '}
          <button
            onClick={switchToLogin}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Sign In
          </button>
        </p>
      </div>

      {/* Blockchain Benefits */}
      {useBlockchain && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2">Blockchain Benefits:</h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Enhanced security with cryptographic verification</li>
            <li>• Data integrity protection</li>
            <li>• Decentralized authentication</li>
            <li>• Tamper-proof user verification</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default BlockchainRegister;