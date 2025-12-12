const mongoose = require('mongoose');

const donationHistorySchema = new mongoose.Schema({
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  notes: { type: String },
  bloodGroup: { type: String },
  status: { type: String, enum: ['pending', 'accepted', 'fulfilled', 'cancelled'], default: 'pending' }
});

module.exports = mongoose.model('DonationHistory', donationHistorySchema); 