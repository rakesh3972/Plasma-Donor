# Plasma Donor Finder - Complete Project Overview

## 🎯 **Project Description**
A comprehensive web application that connects plasma donors with recipients in need using modern web technologies and blockchain integration for enhanced security and verification.

---

## 📁 **Project Structure Overview**

```
Plasma-Donor-Finder-main/
├── 📊 ARCHITECTURE_DIAGRAM.md         # System architecture documentation
├── 📦 package.json                    # Root package configuration
├── 🎨 postcss.config.js              # PostCSS configuration
├── ▶️ start.bat                       # Windows startup script
├── 🎨 tailwind.config.js             # Tailwind CSS configuration
├── 🔧 test-blockchain.js              # Blockchain testing utilities
├── 📋 test-flow.md                    # Testing flow documentation
├── 🔧 test-mongo.js                   # MongoDB testing utilities
├── 🌐 client/                         # React frontend application
└── 🖥️ server/                         # Node.js backend application
```

---

## 🚀 **Core Technologies & Dependencies**

### **Root Level Dependencies**
- **@react-google-maps/api**: Google Maps integration
- **@truffle/hdwallet-provider**: Ethereum wallet provider
- **axios**: HTTP client library
- **bcryptjs**: Password hashing
- **cors**: Cross-origin resource sharing
- **crypto-js**: Cryptographic utilities
- **dotenv**: Environment variable management
- **ethereum-cryptography**: Ethereum cryptographic functions
- **ethers**: Ethereum library for blockchain interactions
- **express**: Web framework for Node.js
- **express-rate-limit**: API rate limiting
- **express-validator**: Input validation middleware
- **jsonwebtoken**: JWT token management
- **mongoose**: MongoDB object modeling
- **nodemon**: Development server auto-restart
- **react-router-dom**: Client-side routing
- **react-toastify**: Toast notifications
- **socket.io & socket.io-client**: Real-time communication
- **tailwindcss**: Utility-first CSS framework
- **web3**: Ethereum JavaScript API

---

## 🌐 **Frontend (Client) - React Application**

### **📱 Main Application Structure**
- **Framework**: React 18.x with Create React App
- **Routing**: React Router DOM v6
- **Styling**: Tailwind CSS with custom configurations
- **State Management**: Local state + Context API patterns

### **📄 Pages Components**
1. **`Login.jsx`**
   - User authentication with email/password
   - Floating particles animation effect
   - Mobile-responsive design
   - Password visibility toggle
   - Remember me functionality

2. **`Register.jsx`**
   - User registration with role selection (donor/requester)
   - Blood group selection
   - Location services integration
   - Form validation with real-time feedback
   - Terms and conditions acceptance

3. **`Dashboard.jsx`**
   - Generic dashboard for role-based redirection
   - User profile overview
   - Quick navigation to role-specific dashboards

4. **`DonorDashboard.jsx`**
   - Donation statistics display
   - Recent donation history
   - Nearby requests visualization
   - Availability status management
   - Map integration for location-based requests

5. **`RequesterDashboard.jsx`**
   - Active requests tracking
   - Search for nearby donors
   - Request history management
   - Blood compatibility information
   - Quick action buttons for emergency requests

6. **`Search.jsx`**
   - Advanced donor search functionality
   - Geographic radius filtering
   - Blood group compatibility matching
   - Real-time availability checking
   - Interactive map with donor locations
   - Distance calculation and sorting

7. **`Chat.jsx`**
   - Real-time messaging between users
   - Message history persistence
   - Socket.IO integration
   - Typing indicators
   - Message status (sent, delivered, read)
   - File sharing capabilities

8. **`Profile.jsx`**
   - User profile management
   - Personal information editing
   - Location update with GPS
   - Blood group modification
   - Account settings
   - Privacy preferences

### **🧩 Reusable Components**

1. **`Header.jsx`**
   - Navigation header with user info
   - Mobile hamburger menu
   - Logout functionality
   - Responsive design
   - User avatar display

2. **`Sidebar.jsx` / `DonorSidebar.jsx` / `RequesterSidebar.jsx`**
   - Role-based navigation menus
   - Active route highlighting
   - Mobile slide-out functionality
   - Quick access to main features

3. **`Map.jsx`**
   - Interactive map using React Leaflet
   - Donor/requester location markers
   - Distance calculation
   - Zoom controls and map layers
   - Custom marker icons

4. **`AIChatbot.jsx`**
   - AI-powered assistance
   - Natural language processing
   - Context-aware responses
   - Help and support features
   - Integration with main chat system

5. **`WalletConnection.jsx`**
   - MetaMask wallet integration
   - Blockchain network switching
   - Account balance display
   - Connection status monitoring
   - Error handling for wallet operations

6. **`BlockchainRegister.jsx`**
   - Blockchain-based user registration
   - Smart contract interactions
   - Data integrity verification
   - Ethereum address validation

7. **`BloodCompatibilityChart.jsx`**
   - Visual blood type compatibility matrix
   - Interactive donor-recipient matching
   - Educational compatibility information

8. **`PrivateRoute.jsx`**
   - Route protection middleware
   - Role-based access control
   - Authentication validation
   - Redirect handling for unauthorized access

### **🔧 Services & Utilities**

1. **`api.js`**
   - Axios HTTP client configuration
   - JWT token interceptors
   - Base URL configuration
   - Error response handling

2. **Blockchain Services**
   - **`blockchainAuthService.js`**: Blockchain authentication
   - **`web3Service.js`**: Web3 wallet interactions

3. **`socket.js`**
   - Socket.IO client configuration
   - Real-time event handling
   - Connection management

4. **`geocoding.js`**
   - GPS location services
   - Address geocoding
   - Reverse geocoding
   - Location permission handling

---

## 🖥️ **Backend (Server) - Node.js Application**

### **🛣️ API Routes & Endpoints**

1. **Authentication Routes** (`/api/auth`)
   - `POST /register` - User registration
   - `POST /login` - User authentication

2. **Profile Routes** (`/api/profile`)
   - `GET /` - Get user profile
   - `PUT /` - Update profile
   - `GET /availability` - Check availability
   - `PUT /availability` - Update availability

3. **Search Routes** (`/api/search`)
   - `GET /` - Search donors
   - `GET /donors` - Get all donors
   - `GET /recipients` - Search recipients
   - `GET /debug` - Debug donor information
   - `GET /test-distance` - Distance calculation testing
   - `GET /show-all` - Show all users (debugging)

4. **Chat Routes** (`/api/chat`)
   - `GET /matched-contacts` - Get matched contacts
   - `GET /check-match/:userId` - Check user match
   - `GET /:userId` - Get chat history

5. **Donation Routes** (`/api/donation`)
   - `POST /` - Log donation
   - `GET /history` - Donation history
   - `GET /request-history` - Request history
   - `GET /stats` - Donation statistics
   - `GET /nearby-requests` - Nearby requests
   - `GET /active-requests` - Active requests
   - `GET /confirmed-requests` - Confirmed requests
   - `POST /request/:donorId` - Create request
   - `POST /confirm/:requestId` - Confirm request
   - Various debug endpoints

6. **Notification Routes** (`/api/notifications`)
   - `GET /` - Get notifications
   - `GET /unread-count` - Unread count
   - `PUT /:notificationId/read` - Mark as read
   - `PUT /mark-all-read` - Mark all as read

7. **Blockchain Routes** (`/api/blockchain`)
   - Smart contract interactions
   - Wallet verification
   - Data integrity checks

### **🎮 Controllers**

1. **`authController.js`**
   - User registration with validation
   - JWT token generation
   - Password hashing with bcrypt
   - Email uniqueness validation
   - Role-based authentication

2. **`profileController.js`**
   - Profile data retrieval
   - Profile updates with validation
   - Availability status management
   - Location update handling

3. **`searchController.js`**
   - Geographic donor search
   - Blood compatibility filtering
   - Distance calculations using Haversine formula
   - Availability filtering
   - Debug and testing utilities

4. **`chatController.js`**
   - Chat history management
   - Matched contacts retrieval
   - User compatibility checking
   - Message persistence

5. **`donationController.js`**
   - Donation logging
   - Request management
   - History tracking
   - Statistics calculation
   - Notification integration
   - Request confirmation workflow

6. **`notificationController.js`**
   - Notification creation
   - Read/unread status management
   - User notification retrieval
   - Bulk operations

### **📊 Data Models (MongoDB)**

1. **`User.js`**
   ```javascript
   - name: String (required)
   - email: String (required, unique)
   - password: String (optional for blockchain users)
   - bloodGroup: String (required)
   - role: String ['donor', 'requester', 'admin']
   - location: { lat, lng, address }
   - isAvailable: Boolean
   - lastDonationDate: Date
   - walletAddress: String (unique, sparse)
   - isBlockchainVerified: Boolean
   - dataHash: String (for integrity verification)
   - blockchainRegisteredAt: Date
   ```

2. **`Chat.js`**
   - Message storage
   - User relationships
   - Conversation threading
   - Timestamp tracking

3. **`DonationHistory.js`**
   - Donation records
   - Donor-recipient relationships
   - Status tracking
   - Date and location logging

4. **`Notification.js`**
   - User notifications
   - Type categorization
   - Read status
   - Related entity references

### **🔧 Middleware**

1. **`auth.js`**
   - JWT token validation
   - User authentication
   - Protected route handling
   - Token expiration management

2. **Built-in Middleware**
   - CORS configuration
   - Rate limiting (1000 requests/15 minutes)
   - Body parsing (10MB limit)
   - Request logging
   - Error handling
   - Database connection checking

### **🧰 Utilities**

1. **`errorHandler.js`**
   - Standardized error responses
   - Success response helpers
   - Validation error formatting
   - Async error handling wrapper

### **🔌 Real-time Communication**
- **Socket.IO Integration**
  - Real-time messaging
  - Live notifications
  - Connection status monitoring
  - Room-based communication
  - Event broadcasting

---

## ⛓️ **Blockchain Integration (Ethereum)**

### **🔐 Smart Contract**
- **`PlasmaUserRegistry.sol`** (Solidity ^0.8.19)
  - User registration on blockchain
  - Data integrity verification
  - Immutable record keeping
  - Access control mechanisms
  - Event logging for transparency

### **🌐 Web3 Services**

1. **`web3Service.js` (Client)**
   - MetaMask integration
   - Wallet connection management
   - Network switching (Sepolia testnet)
   - Transaction signing
   - Balance checking
   - Account monitoring

2. **`blockchainAuthService.js` (Client)**
   - Blockchain authentication flow
   - Challenge-response authentication
   - Data integrity verification
   - Smart contract interactions

3. **`blockchainService.js` (Server)**
   - Server-side Web3 operations
   - Smart contract deployment
   - Data hash generation
   - Signature verification
   - Ethereum address validation

### **🔧 Blockchain Features**
- **Network**: Ethereum Sepolia Testnet
- **Wallet Support**: MetaMask integration
- **Authentication**: Cryptographic signature verification
- **Data Integrity**: Keccak256 hash verification
- **Deployment**: Hardhat/Remix IDE support

---

## 🗄️ **Database Configuration**

### **MongoDB Integration**
- **Connection**: Mongoose ODM
- **Configuration**: Connection pooling, timeout handling
- **Features**:
  - Graceful error handling
  - Automatic reconnection
  - Index optimization for geographic queries
  - Data validation at schema level

### **Geographic Features**
- **Location Storage**: Latitude/longitude coordinates
- **Distance Calculations**: Haversine formula implementation
- **Geocoding**: Address to coordinates conversion
- **Reverse Geocoding**: Coordinates to address conversion

---

## 🎨 **UI/UX Features**

### **Design System**
- **CSS Framework**: Tailwind CSS 4.x
- **Color Scheme**: Red/pink gradient theme
- **Typography**: Custom font configurations
- **Animations**: CSS transitions and keyframes
- **Responsive Design**: Mobile-first approach

### **Interactive Elements**
- **Floating Particles**: Animated background effects
- **Loading States**: Spinners and progress indicators
- **Toast Notifications**: Success/error messaging
- **Modal Dialogs**: User interactions
- **Gradient Backgrounds**: Modern visual appeal

### **Accessibility Features**
- **Screen Reader Support**: ARIA labels
- **Keyboard Navigation**: Full keyboard accessibility
- **High Contrast**: Color contrast compliance
- **Responsive Text**: Scalable font sizes

---

## 🔧 **Development Tools & Scripts**

### **Package Scripts**
```json
{
  "start": "node server/index.js",
  "dev": "nodemon server/index.js",
  "client": "cd client && npm start",
  "build": "cd client && npm run build",
  "install-all": "npm install && cd client && npm install"
}
```

### **Configuration Files**
- **`postcss.config.js`**: PostCSS processing
- **`tailwind.config.js`**: Tailwind CSS customization
- **`.env`**: Environment variables
- **`.gitignore`**: Version control exclusions

### **Testing Utilities**
- **`test-blockchain.js`**: Blockchain functionality testing
- **`test-mongo.js`**: Database connection testing
- **`test-flow.md`**: Complete testing flow documentation

---

## 🌟 **Key Features Summary**

### **Core Functionality**
1. ✅ **User Management**: Registration, authentication, profiles
2. 🔍 **Advanced Search**: Geographic, blood type, availability filtering  
3. 💬 **Real-time Chat**: Socket.IO messaging between users
4. 📍 **Location Services**: GPS integration, mapping, geocoding
5. 🩸 **Blood Compatibility**: Smart matching algorithms
6. 📊 **Analytics**: Donation statistics, request tracking
7. 🔔 **Notifications**: Real-time alerts and updates
8. ⛓️ **Blockchain Integration**: Ethereum-based verification
9. 🗺️ **Interactive Maps**: Leaflet-based location visualization
10. 🤖 **AI Chatbot**: Automated assistance and support

### **Security Features**
- 🔐 JWT token authentication
- 🛡️ Rate limiting protection
- 🔒 Password hashing (bcrypt)
- ⚡ Input validation and sanitization
- 🌐 CORS configuration
- 📱 Blockchain-based identity verification

### **Performance Optimizations**
- ⚡ Connection pooling
- 📦 Asset compression
- 🔄 Lazy loading
- 📊 Database indexing
- 🚀 CDN ready
- 💾 Caching strategies

---

## 🚀 **Deployment Readiness**

### **Environment Support**
- 🖥️ **Development**: Local MongoDB, Ganache blockchain
- ☁️ **Production**: MongoDB Atlas, Ethereum Mainnet/Testnet
- 🐳 **Containerization**: Docker support ready
- 📦 **Process Management**: PM2 integration

### **Scalability Features**
- 🔄 Horizontal scaling support
- 📡 Load balancer ready
- 🗄️ Database optimization
- ⚡ Real-time clustering
- 📊 Performance monitoring hooks

---

## 📚 **Documentation**

1. **`ARCHITECTURE_DIAGRAM.md`**: Complete system architecture
2. **`DEPLOYMENT_GUIDE.md`**: Smart contract deployment
3. **`test-flow.md`**: End-to-end testing procedures
4. **API Documentation**: RESTful endpoint specifications
5. **Component Documentation**: React component usage guides

---

This Plasma Donor Finder project is a comprehensive, production-ready web application that combines modern web development practices with cutting-edge blockchain technology to create a secure, efficient, and user-friendly platform for connecting plasma donors with recipients in need.