// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title PlasmaUserRegistry
 * @dev Smart contract for secure user registration and data integrity in Plasma Donor
 */
contract PlasmaUserRegistry {
    
    struct UserData {
        string dataHash;        // Keccak256 hash of user data
        uint256 registeredAt;   // Timestamp of registration
        bool isActive;          // User status
        uint256 lastUpdated;    // Last update timestamp
    }
    
    mapping(address => UserData) private users;
    mapping(address => bool) public authorizedUpdaters;
    
    address public owner;
    uint256 public totalUsers;
    
    event UserRegistered(address indexed user, string dataHash, uint256 timestamp);
    event UserDataUpdated(address indexed user, string newDataHash, uint256 timestamp);
    event UserDeactivated(address indexed user, uint256 timestamp);
    event AuthorizedUpdaterAdded(address indexed updater);
    event AuthorizedUpdaterRemoved(address indexed updater);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }
    
    modifier onlyAuthorized() {
        require(
            msg.sender == owner || authorizedUpdaters[msg.sender],
            "Not authorized to perform this action"
        );
        _;
    }
    
    modifier validAddress(address _addr) {
        require(_addr != address(0), "Invalid address");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        authorizedUpdaters[msg.sender] = true;
    }
    
    /**
     * @dev Register a new user with their data hash
     * @param userAddress The Ethereum address of the user
     * @param dataHash The keccak256 hash of user data
     */
    function registerUser(address userAddress, string memory dataHash) 
        external 
        onlyAuthorized 
        validAddress(userAddress) 
    {
        require(bytes(dataHash).length > 0, "Data hash cannot be empty");
        require(!users[userAddress].isActive, "User already registered");
        
        users[userAddress] = UserData({
            dataHash: dataHash,
            registeredAt: block.timestamp,
            isActive: true,
            lastUpdated: block.timestamp
        });
        
        totalUsers++;
        
        emit UserRegistered(userAddress, dataHash, block.timestamp);
    }
    
    /**
     * @dev Update user data hash
     * @param userAddress The Ethereum address of the user
     * @param newDataHash The new keccak256 hash of user data
     */
    function updateUserData(address userAddress, string memory newDataHash) 
        external 
        onlyAuthorized 
        validAddress(userAddress) 
    {
        require(bytes(newDataHash).length > 0, "Data hash cannot be empty");
        require(users[userAddress].isActive, "User not registered or inactive");
        
        users[userAddress].dataHash = newDataHash;
        users[userAddress].lastUpdated = block.timestamp;
        
        emit UserDataUpdated(userAddress, newDataHash, block.timestamp);
    }
    
    /**
     * @dev Verify if a user is registered and active
     * @param userAddress The Ethereum address to verify
     * @return bool True if user is registered and active
     */
    function verifyUser(address userAddress) 
        external 
        view 
        validAddress(userAddress) 
        returns (bool) 
    {
        return users[userAddress].isActive;
    }
    
    /**
     * @dev Get user data hash
     * @param userAddress The Ethereum address of the user
     * @return string The data hash of the user
     */
    function getUserData(address userAddress) 
        external 
        view 
        validAddress(userAddress) 
        returns (string memory) 
    {
        require(users[userAddress].isActive, "User not registered or inactive");
        return users[userAddress].dataHash;
    }
    
    /**
     * @dev Get complete user information
     * @param userAddress The Ethereum address of the user
     * @return UserData struct containing all user information
     */
    function getUserInfo(address userAddress) 
        external 
        view 
        validAddress(userAddress) 
        returns (UserData memory) 
    {
        require(users[userAddress].isActive, "User not registered or inactive");
        return users[userAddress];
    }
    
    /**
     * @dev Deactivate a user (only owner or authorized)
     * @param userAddress The Ethereum address to deactivate
     */
    function deactivateUser(address userAddress) 
        external 
        onlyAuthorized 
        validAddress(userAddress) 
    {
        require(users[userAddress].isActive, "User already inactive");
        
        users[userAddress].isActive = false;
        users[userAddress].lastUpdated = block.timestamp;
        totalUsers--;
        
        emit UserDeactivated(userAddress, block.timestamp);
    }
    
    /**
     * @dev Add authorized updater (only owner)
     * @param updater Address to authorize
     */
    function addAuthorizedUpdater(address updater) 
        external 
        onlyOwner 
        validAddress(updater) 
    {
        authorizedUpdaters[updater] = true;
        emit AuthorizedUpdaterAdded(updater);
    }
    
    /**
     * @dev Remove authorized updater (only owner)
     * @param updater Address to remove authorization
     */
    function removeAuthorizedUpdater(address updater) 
        external 
        onlyOwner 
        validAddress(updater) 
    {
        require(updater != owner, "Cannot remove owner authorization");
        authorizedUpdaters[updater] = false;
        emit AuthorizedUpdaterRemoved(updater);
    }
    
    /**
     * @dev Transfer ownership (only owner)
     * @param newOwner New owner address
     */
    function transferOwnership(address newOwner) 
        external 
        onlyOwner 
        validAddress(newOwner) 
    {
        require(newOwner != owner, "New owner must be different");
        
        authorizedUpdaters[owner] = false;
        owner = newOwner;
        authorizedUpdaters[newOwner] = true;
    }
    
    /**
     * @dev Check if an address is authorized
     * @param addr Address to check
     * @return bool True if authorized
     */
    function isAuthorized(address addr) external view returns (bool) {
        return authorizedUpdaters[addr];
    }
    
    /**
     * @dev Get contract statistics
     * @return totalUsers Total number of active users
     * @return contractOwner Owner address
     */
    function getStats() external view returns (uint256, address) {
        return (totalUsers, owner);
    }
}