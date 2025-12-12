const { Server } = require('socket.io');
const Chat = require('../models/Chat');

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    // Join user room
    socket.on('join', (userId) => {
      console.log('User joining room:', userId);
      socket.join(userId);
    });

    // Handle sending message
    socket.on('sendMessage', async (data) => {
      const { senderId, receiverId, message } = data;
      console.log('Received message:', { senderId, receiverId, message });
      const chat = new Chat({ senderId, receiverId, message });
      await chat.save();
      console.log('Saved chat message:', chat._id);
      // Emit to receiver
      io.to(receiverId).emit('receiveMessage', chat);
      console.log('Emitted message to:', receiverId);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
}

module.exports = initSocket; 