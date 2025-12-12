# Smart Contract Deployment Guide

This guide will help you deploy the PlasmaUserRegistry smart contract to the Sepolia testnet.

## Prerequisites

1. **Node.js and npm** installed
2. **MetaMask wallet** with Sepolia ETH
3. **Infura account** for RPC access
4. **Basic understanding** of Ethereum and smart contracts

## Step 1: Install Dependencies

```bash
npm install -g @remix-project/remixd
# OR use Hardhat (recommended)
npm install --save-dev hardhat @nomiclabs/hardhat-ethers ethers
```

## Step 2: Get Sepolia ETH

1. Go to [Sepolia Faucet](https://sepoliafaucet.com/)
2. Connect your MetaMask wallet
3. Request test ETH (you'll need about 0.01 ETH for deployment)

## Step 3: Get Infura API Key

1. Sign up at [Infura.io](https://infura.io/)
2. Create a new project
3. Copy the project ID
4. Your RPC URL will be: `https://sepolia.infura.io/v3/YOUR_PROJECT_ID`

## Step 4: Deploy using Remix IDE (Easiest Method)

1. Go to [Remix IDE](https://remix.ethereum.org/)
2. Create a new file named `PlasmaUserRegistry.sol`
3. Copy the contract code from `server/blockchain/PlasmaUserRegistry.sol`
4. Compile the contract (Solidity compiler 0.8.19+)
5. Deploy to Sepolia testnet:
   - Select "Injected Provider - MetaMask" as environment
   - Make sure you're connected to Sepolia network
   - Click "Deploy"
   - Confirm the transaction in MetaMask

## Step 5: Deploy using Hardhat (Advanced)

### 5.1 Initialize Hardhat Project

```bash
cd server/blockchain
npx hardhat init
```

### 5.2 Configure Hardhat

Create `hardhat.config.js`:

```javascript
require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: "0.8.19",
  networks: {
    sepolia: {
      url: "https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID",
      accounts: ["YOUR_PRIVATE_KEY_HERE"] // Never commit this!
    }
  }
};
```

### 5.3 Create Deployment Script

Create `scripts/deploy.js`:

```javascript
async function main() {
  const PlasmaUserRegistry = await ethers.getContractFactory("PlasmaUserRegistry");
  const contract = await PlasmaUserRegistry.deploy();
  
  await contract.deployed();
  
  console.log("PlasmaUserRegistry deployed to:", contract.address);
  console.log("Transaction hash:", contract.deployTransaction.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### 5.4 Deploy

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

## Step 6: Update Environment Variables

After deployment, update your `.env` file:

```env
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
CONTRACT_ADDRESS=0xYourDeployedContractAddress
BLOCKCHAIN_PRIVATE_KEY=YourPrivateKey
ENABLE_BLOCKCHAIN_VERIFICATION=true
```

## Step 7: Verify Deployment

1. Go to [Sepolia Etherscan](https://sepolia.etherscan.io/)
2. Search for your contract address
3. Verify the contract code (optional but recommended)

## Smart Contract Functions

### Public Functions:
- `registerUser(address, string)` - Register a new user
- `verifyUser(address)` - Check if user is verified
- `getUserData(address)` - Get user data hash
- `updateUserData(address, string)` - Update user data

### Admin Functions:
- `addAuthorizedUpdater(address)` - Add authorized updater
- `removeAuthorizedUpdater(address)` - Remove updater
- `deactivateUser(address)` - Deactivate user

## Security Notes

1. **Never commit private keys** to version control
2. **Use environment variables** for sensitive data
3. **Test on testnet first** before mainnet deployment
4. **Verify contract source code** on Etherscan
5. **Use multi-signature wallets** for production

## Troubleshooting

### Common Issues:

1. **Insufficient funds**: Make sure you have enough Sepolia ETH
2. **Gas estimation failed**: Increase gas limit manually
3. **Network issues**: Check Infura status and RPC URL
4. **Compilation errors**: Ensure Solidity version compatibility

### Gas Optimization:

- Current deployment cost: ~1,500,000 gas (~0.003 ETH on testnet)
- Function calls: ~50,000-100,000 gas each
- Consider batching operations for efficiency

## Testing

Create test files to verify contract functionality:

```javascript
// test/PlasmaUserRegistry.test.js
const { expect } = require("chai");

describe("PlasmaUserRegistry", function () {
  it("Should deploy and register users", async function () {
    const PlasmaUserRegistry = await ethers.getContractFactory("PlasmaUserRegistry");
    const contract = await PlasmaUserRegistry.deploy();
    await contract.deployed();
    
    // Test user registration
    const userAddress = "0x742d35Cc7000C05e7C2B3c21D3c5b7F297A4D5c7";
    const dataHash = "0x123...";
    
    await contract.registerUser(userAddress, dataHash);
    expect(await contract.verifyUser(userAddress)).to.equal(true);
  });
});
```

Run tests:
```bash
npx hardhat test
```

## Production Deployment

For production (Ethereum mainnet):

1. Use a hardware wallet or multi-sig
2. Audit the contract code
3. Use a proxy pattern for upgradeability
4. Implement additional access controls
5. Consider gas optimization
6. Set up monitoring and alerts

## Support

If you encounter issues:

1. Check the console logs in your browser
2. Verify network configuration
3. Ensure sufficient gas and ETH balance
4. Test contract functions individually
5. Review transaction logs on Etherscan