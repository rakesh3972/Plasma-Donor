# 🩸 Plasma Donor Finder

> A comprehensive web application that connects plasma donors with recipients in need using modern web technologies and blockchain integration for enhanced security and verification.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0%2B-green.svg)](https://mongodb.com/)
[![Ethereum](https://img.shields.io/badge/Ethereum-Sepolia-purple.svg)](https://ethereum.org/)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)

## 🌟 **Features**

### 🔐 **Dual Authentication System**
- **Traditional Auth**: Email/password with JWT tokens
- **Blockchain Auth**: MetaMask wallet integration with cryptographic verification
- **Role-based Access**: Separate interfaces for donors and requesters

### 🔍 **Advanced Search & Matching**
- **Geographic Search**: Find donors/recipients within customizable radius
- **Blood Compatibility**: Smart matching based on blood type compatibility
- **Real-time Availability**: Live status updates for donor availability
- **Distance Calculation**: Haversine formula for accurate distance measurements

### 💬 **Real-time Communication**
- **Live Messaging**: Socket.IO powered chat between users
- **Push Notifications**: Real-time alerts for requests and updates
- **AI Chatbot**: Automated assistance and support
- **Message History**: Persistent conversation storage

### 📍 **Location Services**
- **Interactive Maps**: Leaflet-based mapping with custom markers
- **GPS Integration**: Automatic location detection
- **Geocoding**: Address to coordinates conversion
- **Reverse Geocoding**: Coordinates to address conversion

### 📊 **Analytics & Tracking**
- **Donation Statistics**: Personal donation history and stats
- **Request Management**: Track active and completed requests
- **Availability Dashboard**: Manage donor availability status
- **Compatibility Charts**: Visual blood type compatibility matrix

### ⛓️ **Blockchain Integration**
- **Smart Contracts**: Ethereum-based user verification
- **Data Integrity**: Cryptographic hash verification
- **Immutable Records**: Blockchain-stored user data
- **MetaMask Support**: Seamless wallet integration

---

## 🏗️ **Architecture Overview**

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (React)                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │    Pages    │ │ Components  │ │     Services        │   │
│  │             │ │             │ │                     │   │
│  │ • Login     │ │ • Header    │ │ • API Client        │   │
│  │ • Register  │ │ • Map       │ │ • Blockchain        │   │
│  │ • Dashboard │ │ • Chat      │ │ • Socket.IO         │   │
│  │ • Search    │ │ • Sidebar   │ │ • Geocoding         │   │
│  │ • Profile   │ │ • Chatbot   │ │ • Web3              │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                    HTTP/WebSocket/Web3
                              │
┌─────────────────────────────────────────────────────────────┐
│                   SERVER (Node.js)                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │   Routes    │ │ Controllers │ │     Services        │   │
│  │             │ │             │ │                     │   │
│  │ • /auth     │ │ • Auth      │ │ • Blockchain        │   │
│  │ • /profile  │ │ • Profile   │ │ • Socket.IO         │   │
│  │ • /search   │ │ • Search    │ │ • Validation        │   │
│  │ • /chat     │ │ • Chat      │ │ • Error Handling    │   │
│  │ • /donation │ │ • Donation  │ │ • Rate Limiting     │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                          Mongoose ODM
                              │
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE (MongoDB)                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │    Users    │ │    Chats    │ │    Donations        │   │
│  │             │ │             │ │                     │   │
│  │ • Profile   │ │ • Messages  │ │ • History           │   │
│  │ • Location  │ │ • Rooms     │ │ • Requests          │   │
│  │ • BloodType │ │ • Status    │ │ • Status            │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                BLOCKCHAIN (Ethereum)                       │
│            Smart Contract: PlasmaUserRegistry              │
│                  Network: Sepolia Testnet                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 **Quick Start**

### Prerequisites
- **Node.js** (v14.0.0 or higher)
- **MongoDB** (v6.0 or higher)
- **MetaMask** browser extension
- **Git** for version control

### 1. Clone Repository
```bash
git clone https://github.com/your-username/plasma-donor-finder.git
cd plasma-donor-finder
```

### 2. Install Dependencies
```bash
# Install all dependencies (root + client)
npm run install-all

# Or install separately
npm install
cd client && npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/plasma-donor

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Client URL
CLIENT_URL=http://localhost:3000

# Blockchain Configuration (Optional)
ENABLE_BLOCKCHAIN_VERIFICATION=false
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
CONTRACT_ADDRESS=0x...
PRIVATE_KEY=your-ethereum-private-key

# Rate Limiting
RATE_LIMIT_MAX=1000
```

### 4. Database Setup
Make sure MongoDB is running locally:
```bash
# Start MongoDB (Windows)
mongod

# Or use MongoDB Atlas cloud database
# Update MONGO_URI in .env with your Atlas connection string
```

### 5. Start Development Servers

**Option 1: Start both servers separately**
```bash
# Terminal 1 - Backend Server
npm run dev

# Terminal 2 - Frontend Client
npm run client
```

**Option 2: Use the startup script (Windows)**
```bash
start.bat
```

### 6. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000 (returns API status)

---

## 📱 **Usage Guide**

### **For Plasma Donors**

1. **Registration**
   - Create account with donor role
   - Provide blood group and location
   - Optional: Connect MetaMask wallet for blockchain verification

2. **Dashboard Management**
   - View donation statistics and history
   - Manage availability status
   - See nearby requests from recipients
   - Track donation eligibility dates

3. **Responding to Requests**
   - Receive notifications for nearby requests
   - View requester profiles and urgency levels
   - Accept or decline donation requests
   - Communicate via built-in chat system

### **For Plasma Recipients**

1. **Registration**
   - Create account with requester role
   - Provide required blood group and location
   - Set up emergency contact information

2. **Finding Donors**
   - Use advanced search with radius filtering
   - Filter by blood compatibility and availability
   - View donor locations on interactive map
   - Sort results by distance and compatibility

3. **Making Requests**
   - Send donation requests to compatible donors
   - Track request status (pending, accepted, fulfilled)
   - Communicate with donors via secure messaging
   - Receive real-time updates and notifications

### **Blood Compatibility Guide**
The application automatically handles blood type compatibility:

| Recipient | Can Receive From |
|-----------|------------------|
| O+ | O+, O- |
| O- | O- |
| A+ | A+, A-, O+, O- |
| A- | A-, O- |
| B+ | B+, B-, O+, O- |
| B- | B-, O- |
| AB+ | All blood types |
| AB- | AB-, A-, B-, O- |

---

## 🛠️ **Technology Stack**

### **Frontend**
- **React 18.x**: Modern UI library with hooks
- **React Router DOM**: Client-side routing
- **Tailwind CSS**: Utility-first styling framework
- **Axios**: HTTP client for API communication
- **Socket.IO Client**: Real-time communication
- **React Leaflet**: Interactive maps
- **Web3.js & Ethers.js**: Blockchain integration
- **React Icons**: Comprehensive icon library
- **React Toastify**: Toast notifications

### **Backend**
- **Node.js**: JavaScript runtime environment
- **Express.js**: Web application framework
- **MongoDB**: NoSQL document database
- **Mongoose**: MongoDB object modeling
- **Socket.IO**: Real-time bidirectional communication
- **JWT**: Secure authentication tokens
- **bcrypt.js**: Password hashing
- **Express Rate Limit**: API rate limiting
- **CORS**: Cross-origin resource sharing

### **Blockchain**
- **Ethereum**: Blockchain network (Sepolia testnet)
- **Solidity**: Smart contract programming language
- **MetaMask**: Ethereum wallet integration
- **Truffle Suite**: Development framework
- **Infura**: Ethereum node service

### **Development Tools**
- **Nodemon**: Development server auto-restart
- **PostCSS**: CSS post-processing
- **Create React App**: React development setup
- **ESLint**: Code linting (configurable)

---

## 📁 **Project Structure**

```
plasma-donor-finder/
├── 📄 README.md                    # Project documentation
├── 📊 ARCHITECTURE_DIAGRAM.md      # System architecture
├── 📋 PROJECT_OVERVIEW.md          # Complete project overview
├── 📦 package.json                 # Root dependencies
├── ⚙️ .env                         # Environment variables
├── 🎨 tailwind.config.js          # Tailwind configuration
├── 🎨 postcss.config.js           # PostCSS configuration
├── ▶️ start.bat                    # Windows startup script
├── 🧪 test-blockchain.js          # Blockchain testing
├── 🧪 test-mongo.js               # Database testing
├── 📋 test-flow.md                # Testing procedures
│
├── 🌐 client/                      # React frontend
│   ├── 📦 package.json
│   ├── 🌐 public/
│   │   └── index.html
│   └── 📁 src/
│       ├── 📄 App.jsx              # Main app component
│       ├── 📄 index.js             # App entry point
│       ├── 🎨 index.css            # Global styles
│       ├── 📁 pages/               # Page components
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── Dashboard.jsx
│       │   ├── DonorDashboard.jsx
│       │   ├── RequesterDashboard.jsx
│       │   ├── Search.jsx
│       │   ├── Chat.jsx
│       │   └── Profile.jsx
│       ├── 🧩 components/          # Reusable components
│       │   ├── Header.jsx
│       │   ├── Sidebar.jsx
│       │   ├── Map.jsx
│       │   ├── AIChatbot.jsx
│       │   ├── WalletConnection.jsx
│       │   ├── BlockchainRegister.jsx
│       │   ├── BloodCompatibilityChart.jsx
│       │   └── PrivateRoute.jsx
│       ├── 🔧 services/            # API and external services
│       │   ├── api.js
│       │   └── blockchain/
│       │       ├── web3Service.js
│       │       └── blockchainAuthService.js
│       ├── 🔌 socket/
│       │   └── socket.js
│       └── 🛠️ utils/
│           └── geocoding.js
│
└── 🖥️ server/                      # Node.js backend
    ├── 📄 index.js                 # Server entry point
    ├── ⚙️ config/
    │   └── config.js               # Server configuration
    ├── 🛣️ routes/                  # API routes
    │   ├── auth.js
    │   ├── profile.js
    │   ├── search.js
    │   ├── chat.js
    │   ├── donation.js
    │   ├── notifications.js
    │   └── blockchain.js
    ├── 🎮 controllers/             # Business logic
    │   ├── authController.js
    │   ├── profileController.js
    │   ├── searchController.js
    │   ├── chatController.js
    │   ├── donationController.js
    │   └── notificationController.js
    ├── 📊 models/                  # Database schemas
    │   ├── User.js
    │   ├── Chat.js
    │   ├── DonationHistory.js
    │   └── Notification.js
    ├── 🔒 middleware/
    │   └── auth.js                 # Authentication middleware
    ├── ⛓️ blockchain/              # Blockchain integration
    │   ├── PlasmaUserRegistry.sol  # Smart contract
    │   ├── blockchainService.js
    │   ├── blockchainAuth.js
    │   └── DEPLOYMENT_GUIDE.md
    ├── 🔌 socket/
    │   └── index.js                # Socket.IO setup
    └── 🛠️ utils/
        └── errorHandler.js         # Error handling utilities
```

---

## 🔧 **API Documentation**

### **Authentication Endpoints**
```http
POST /api/auth/register    # User registration
POST /api/auth/login       # User login
```

### **Profile Endpoints**
```http
GET    /api/profile             # Get user profile
PUT    /api/profile             # Update profile
GET    /api/profile/availability # Get availability status
PUT    /api/profile/availability # Update availability
```

### **Search Endpoints**
```http
GET /api/search?bloodGroup=O+&lat=40.7128&lng=-74.0060&radius=25
GET /api/search/donors          # Search donors
GET /api/search/recipients      # Search recipients
```

### **Donation Endpoints**
```http
POST   /api/donation                    # Log donation
GET    /api/donation/history            # Get donation history
GET    /api/donation/stats              # Get donation statistics
POST   /api/donation/request/:donorId   # Create donation request
POST   /api/donation/confirm/:requestId # Confirm donation request
```

### **Chat Endpoints**
```http
GET /api/chat/matched-contacts     # Get matched contacts
GET /api/chat/:userId              # Get chat history
```

### **Notification Endpoints**
```http
GET /api/notifications                        # Get notifications
PUT /api/notifications/:id/read               # Mark as read
PUT /api/notifications/mark-all-read          # Mark all as read
```

### **Blockchain Endpoints**
```http
POST /api/blockchain/register        # Blockchain registration
POST /api/blockchain/verify          # Verify blockchain data
GET  /api/blockchain/stats           # Get blockchain statistics
```

---

## ⛓️ **Blockchain Setup (Optional)**

### **Smart Contract Deployment**

1. **Get Sepolia ETH**
   - Visit [Sepolia Faucet](https://sepoliafaucet.com/)
   - Connect MetaMask and request test ETH

2. **Deploy Contract**
   - Use [Remix IDE](https://remix.ethereum.org/)
   - Copy contract from `server/blockchain/PlasmaUserRegistry.sol`
   - Compile with Solidity 0.8.19+
   - Deploy to Sepolia testnet

3. **Configure Environment**
   ```env
   ENABLE_BLOCKCHAIN_VERIFICATION=true
   CONTRACT_ADDRESS=0x...your-deployed-contract-address
   ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
   ```

4. **MetaMask Setup**
   - Install MetaMask extension
   - Add Sepolia testnet
   - Import account with test ETH

For detailed deployment instructions, see: `server/blockchain/DEPLOYMENT_GUIDE.md`

---

## 🧪 **Testing**

### **Backend Testing**
```bash
# Test MongoDB connection
node test-mongo.js

# Test blockchain functionality
node test-blockchain.js
```

### **Frontend Testing**
```bash
cd client
npm test
```

### **End-to-End Testing**
Follow the testing flow in `test-flow.md` for complete system testing.

---

## 📊 **Performance & Security**

### **Security Features**
- 🔐 **JWT Authentication**: Secure token-based authentication
- 🛡️ **Rate Limiting**: Protection against abuse (1000 requests/15min)
- 🔒 **Password Hashing**: bcrypt with salt rounds
- ✅ **Input Validation**: Server-side validation for all inputs
- 🌐 **CORS Protection**: Configured cross-origin policies
- ⛓️ **Blockchain Security**: Cryptographic signature verification

### **Performance Optimizations**
- 🚀 **Database Indexing**: Optimized queries for geographic data
- 📦 **Connection Pooling**: Efficient database connections
- ⚡ **Lazy Loading**: Component and route-based code splitting
- 🔄 **Real-time Optimization**: Socket.IO clustering support
- 📊 **Caching Ready**: Redis integration ready for production

---

## 🚀 **Deployment**

### **Development Environment**
```bash
# Install dependencies
npm run install-all

# Start development servers
npm run dev        # Backend server
npm run client     # Frontend development server
```

### **Production Build**
```bash
# Build frontend for production
npm run build

# Start production server
npm start
```

### **Environment Variables for Production**
```env
NODE_ENV=production
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/plasma-donor
JWT_SECRET=your-production-secret
CLIENT_URL=https://your-domain.com
```

### **Deployment Platforms**
- **Frontend**: Vercel, Netlify, GitHub Pages
- **Backend**: Heroku, AWS, DigitalOcean, Railway
- **Database**: MongoDB Atlas, AWS DocumentDB
- **Blockchain**: Ethereum Mainnet, Polygon, BSC

---

## 🤝 **Contributing**

### **Development Guidelines**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### **Code Style**
- Use ESLint for JavaScript linting
- Follow React best practices
- Use meaningful variable and function names
- Add comments for complex logic
- Write tests for new features

### **Issue Reporting**
- Use GitHub Issues for bug reports
- Provide detailed reproduction steps
- Include environment information
- Suggest potential solutions

---

## 📄 **License**

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 **Acknowledgments**

- **React Team**: For the amazing UI library
- **MongoDB**: For the flexible NoSQL database
- **Ethereum Foundation**: For blockchain technology
- **MetaMask**: For wallet integration
- **Leaflet**: For mapping functionality
- **Socket.IO**: For real-time communication
- **Tailwind CSS**: For the utility-first CSS framework

---

## 📞 **Support**

### **Getting Help**
- 📚 **Documentation**: Check the docs in this repository
- 💬 **Issues**: Open a GitHub issue for bugs or questions
- 📧 **Email**: Contact the maintainers for urgent issues
- 🤖 **AI Chatbot**: Use the built-in chatbot for basic help

### **Useful Links**
- [React Documentation](https://reactjs.org/docs)
- [Node.js Documentation](https://nodejs.org/docs)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Ethereum Documentation](https://ethereum.org/developers)
- [MetaMask Documentation](https://docs.metamask.io/)

---

## 🔮 **Roadmap**

### **Upcoming Features**
- [ ] Mobile app development (React Native)
- [ ] Advanced AI matching algorithms
- [ ] Multi-language support
- [ ] SMS/Email notifications
- [ ] Advanced analytics dashboard
- [ ] Integration with healthcare systems
- [ ] Video calling functionality
- [ ] Donation appointment scheduling
- [ ] Gamification and rewards system
- [ ] Social sharing features

### **Technical Improvements**
- [ ] GraphQL API implementation
- [ ] Microservices architecture
- [ ] Advanced caching with Redis
- [ ] Load balancing setup
- [ ] CI/CD pipeline
- [ ] Docker containerization
- [ ] Kubernetes orchestration
- [ ] Advanced monitoring and logging

---

Made with ❤️ for the plasma donation community

*Help save lives by connecting donors with those in need!*