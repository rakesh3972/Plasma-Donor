# Plasma Donor Finder - Overall Architecture Diagram

## System Overview
The Plasma Donor Finder is a comprehensive web application that connects plasma donors with recipients using modern web technologies and blockchain integration for enhanced security and verification.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER (React)                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │   Pages Layer   │  │ Components Layer│  │ Services Layer  │                │
│  │                 │  │                 │  │                 │                │
│  │ • Login         │  │ • Header        │  │ • API Service  │                │
│  │ • Register      │  │ • Map           │  │ • Blockchain   │                │
│  │ • Dashboard     │  │ • Sidebar       │  │ • Socket       │                │
│  │ • DonorDash     │  │ • AIChatbot     │  │ • Web3Service  │                │
│  │ • RequesterDash │  │ • WalletConn    │  │ • Geocoding    │                │
│  │ • Search        │  │ • PrivateRoute  │  │                │                │
│  │ • Chat          │  │ • BloodChart    │  │                │                │
│  │ • Profile       │  │                 │  │                │                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
│                                     │                                          │
└─────────────────────────────────────┼─────────────────────────────────────────┘
                                      │ HTTP/WebSocket
                                      │ REST API Calls
┌─────────────────────────────────────┼─────────────────────────────────────────┐
│                                     │        SERVER LAYER (Node.js)          │
├─────────────────────────────────────┼─────────────────────────────────────────┤
│                                     ▼                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │   API Routes    │  │   Controllers   │  │   Middleware    │              │
│  │                 │  │                 │  │                 │              │
│  │ • /auth         │  │ • authController│  │ • Authentication│              │
│  │ • /profile      │  │ • chatController│  │ • Rate Limiting │              │
│  │ • /search       │  │ • donationCtrl  │  │ • CORS         │              │
│  │ • /chat         │  │ • notifCtrl     │  │ • Error Handler │              │
│  │ • /donation     │  │ • profileCtrl   │  │ • Logging      │              │
│  │ • /notifications│  │ • searchCtrl    │  │                │              │
│  │ • /blockchain   │  │                 │  │                │              │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘              │
│                                     │                                         │
│  ┌─────────────────┐               │        ┌─────────────────┐              │
│  │   Socket.IO     │               │        │   Data Models   │              │
│  │                 │               │        │                 │              │
│  │ • Real-time     │               └────────┤ • User          │              │
│  │   Messaging     │                        │ • Chat          │              │
│  │ • Notifications │                        │ • DonationHist  │              │
│  │ • Live Updates  │                        │ • Notification  │              │
│  └─────────────────┘                        └─────────────────┘              │
│                                                      │                        │
└──────────────────────────────────────────────────────┼───────────────────────┘
                                                       │ Mongoose ODM
┌──────────────────────────────────────────────────────┼───────────────────────┐
│                              DATABASE LAYER          ▼                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        MongoDB Database                             │    │
│  │                                                                     │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │    │
│  │  │    Users    │ │    Chats    │ │ Donations   │ │Notifications│   │    │
│  │  │             │ │             │ │             │ │             │   │    │
│  │  │ • Personal  │ │ • Messages  │ │ • History   │ │ • Alerts    │   │    │
│  │  │   Info      │ │ • Rooms     │ │ • Status    │ │ • Updates   │   │    │
│  │  │ • Location  │ │ • Users     │ │ • Tracking  │ │ • System    │   │    │
│  │  │ • Blood     │ │ • Time      │ │             │ │             │   │    │
│  │  │   Group     │ │             │ │             │ │             │   │    │
│  │  │ • Wallet    │ │             │ │             │ │             │   │    │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          BLOCKCHAIN LAYER (Ethereum)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │  Smart Contract │  │   Web3 Services │  │   MetaMask      │             │
│  │                 │  │                 │  │   Integration   │             │
│  │ • PlasmaUser    │  │ • Registration  │  │                 │             │
│  │   Registry      │  │ • Verification  │  │ • Wallet Conn   │             │
│  │ • User Data     │  │ • Data Integrity│  │ • Transaction   │             │
│  │   Verification  │  │ • Blockchain    │  │   Signing       │             │
│  │ • Immutable     │  │   Auth          │  │ • Account       │             │
│  │   Records       │  │                 │  │   Management    │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                     │                                       │
└─────────────────────────────────────┼───────────────────────────────────────┘
                                      │ Web3 RPC
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ETHEREUM NETWORK                                  │
│                          (Sepolia Testnet)                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL SERVICES                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │   Mapping APIs  │  │   Geocoding     │  │   AI Services   │             │
│  │                 │  │   Services      │  │                 │             │
│  │ • Google Maps   │  │                 │  │ • Chatbot       │             │
│  │ • Leaflet       │  │ • Address       │  │ • NLP Processing│             │
│  │ • Location      │  │   Resolution    │  │ • Automated     │             │
│  │   Services      │  │ • Coordinates   │  │   Responses     │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend (Client)
- **Framework**: React 18.x
- **Routing**: React Router DOM v6
- **Styling**: Tailwind CSS 4.x
- **State Management**: Local state + Context API
- **HTTP Client**: Axios
- **Real-time**: Socket.IO Client
- **Blockchain**: Web3.js, Ethers.js
- **Maps**: React Leaflet, Google Maps API
- **UI Components**: React Icons, React Toastify

### Backend (Server)
- **Runtime**: Node.js (>=14.0.0)
- **Framework**: Express.js 4.x
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.IO
- **Security**: bcryptjs, CORS, Rate Limiting
- **Blockchain**: Web3.js, Ethers.js, Truffle HDWallet

### Blockchain
- **Network**: Ethereum (Sepolia Testnet)
- **Smart Contract**: Solidity ^0.8.19
- **Wallet Integration**: MetaMask
- **Development**: Truffle Suite
- **Contract**: PlasmaUserRegistry for user verification

### Database Schema
- **Users**: Personal info, location, blood group, wallet address
- **Chats**: Real-time messaging between users
- **DonationHistory**: Track donation records
- **Notifications**: System alerts and updates

## Key Features

### 1. User Management
- Traditional email/password authentication
- Blockchain wallet authentication (MetaMask)
- Role-based access (Donor/Requester/Admin)
- Profile management with location services

### 2. Search & Matching
- Geographic search for nearby donors
- Blood compatibility matching
- Real-time availability status
- Advanced filtering options

### 3. Communication
- Real-time chat system (Socket.IO)
- Push notifications
- AI-powered chatbot assistance
- In-app messaging between users

### 4. Blockchain Integration
- Immutable user registration
- Data integrity verification
- Smart contract-based authentication
- Decentralized identity management

### 5. Mapping & Location
- Interactive maps (Leaflet/Google Maps)
- Geocoding services
- Location-based search
- Distance calculation

## Data Flow

### 1. User Registration Flow
```
User Input → Client Validation → API Request → Server Validation → 
Database Storage → Blockchain Registration → Wallet Integration
```

### 2. Search Flow
```
Search Criteria → Geographic Filtering → Blood Compatibility Check → 
Database Query → Results Ranking → Map Visualization
```

### 3. Chat Flow
```
Message Composition → Socket.IO Emission → Server Relay → 
Target User Reception → Database Storage → Real-time Display
```

### 4. Blockchain Verification Flow
```
User Data → Hash Generation → Smart Contract Call → 
Ethereum Transaction → Block Confirmation → Verification Status Update
```

## Security Features

- **Authentication**: JWT tokens with expiration
- **Authorization**: Role-based access control
- **Rate Limiting**: Request throttling protection
- **Data Validation**: Server-side input validation
- **Blockchain Security**: Immutable data storage
- **Wallet Security**: MetaMask integration
- **CORS Protection**: Cross-origin request filtering

## Scalability Considerations

- **Horizontal Scaling**: Stateless server design
- **Database Optimization**: Indexed queries, connection pooling
- **Real-time Optimization**: Socket.IO clustering support
- **Caching Strategy**: Redis integration ready
- **CDN Integration**: Static asset optimization
- **Blockchain Efficiency**: Gas optimization in smart contracts

## Deployment Architecture

- **Development**: Local MongoDB, Ganache blockchain
- **Production**: MongoDB Atlas, Ethereum Mainnet/Testnet
- **Server Deployment**: Node.js with PM2 process manager
- **Client Deployment**: Build optimization, static hosting
- **Environment Variables**: Secure configuration management