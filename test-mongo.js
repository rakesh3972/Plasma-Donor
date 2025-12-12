const mongoose = require('mongoose');
require('dotenv').config();

console.log('Testing MongoDB connection...');
console.log('Current directory:', process.cwd());
console.log('All environment variables:');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGO_URI:', process.env.MONGO_URI);
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Found' : 'NOT FOUND');

const mongoUri = process.env.MONGO_URI;

if (mongoUri && mongoUri.includes('mongodb+srv')) {
  console.log('✅ MongoDB Atlas URI detected, testing connection...');
  mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
  })
  .then(() => {
    console.log('✅ MongoDB Atlas connection successful!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
} else if (mongoUri) {
  console.log('⚠️ Local MongoDB URI detected:', mongoUri);
  process.exit(1);
} else {
  console.error('❌ MONGO_URI not found in environment variables');
  process.exit(1);
}