const Chat = require('../models/Chat');
const DonationHistory = require('../models/DonationHistory');

// Get chat history between two users
exports.getChatHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const myId = req.user.id;
    console.log('Getting chat history between:', myId, 'and', userId);
    const chats = await Chat.find({
      $or: [
        { senderId: myId, receiverId: userId },
        { senderId: userId, receiverId: myId }
      ]
    }).sort({ timestamp: 1 });
    console.log('Found chat messages:', chats.length);
    res.json(chats);
  } catch (err) {
    console.error('Chat history error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Get matched contacts for the current user
exports.getMatchedContacts = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      console.error('getMatchedContacts error: userId is undefined');
      return res.status(400).json({ msg: 'User ID is undefined' });
    }
    // Find all donation records where the user is donor or recipient AND status is accepted
    const donations = await DonationHistory.find({
      $or: [
        { donorId: userId },
        { recipientId: userId }
      ],
      status: 'accepted' // Only return confirmed matches
    });
    if (!donations) {
      console.error('getMatchedContacts error: donations is null');
      return res.status(500).json({ msg: 'Donations query returned null' });
    }
    // Collect unique user IDs that are matched
    const matchedUserIds = new Set();
    donations.forEach(d => {
      if (!d.donorId || !d.recipientId) {
        console.error('getMatchedContacts error: donation record missing donorId or recipientId', d);
        return;
      }
      if (d.donorId.toString() !== userId) matchedUserIds.add(d.donorId.toString());
      if (d.recipientId.toString() !== userId) matchedUserIds.add(d.recipientId.toString());
    });
    res.json(Array.from(matchedUserIds));
  } catch (err) {
    console.error('getMatchedContacts error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Check if the current user is matched with another user (for chat access)
exports.checkMatch = async (req, res) => {
  try {
    const userId = req.user.id;
    const otherUserId = req.params.userId;
    const match = await DonationHistory.findOne({
      $or: [
        { donorId: userId, recipientId: otherUserId },
        { donorId: otherUserId, recipientId: userId }
      ],
      status: 'accepted' // Only allow chat if request is confirmed
    });
    res.json({ isMatched: !!match });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
}; 