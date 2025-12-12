import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import socket from '../socket/socket';

function Chat() {
  const { userId } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [myId, setMyId] = useState('');
  const [error, setError] = useState('');
  const [isMatched, setIsMatched] = useState(false);
  const [checkingMatch, setCheckingMatch] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Validate userId (should be a MongoDB ObjectId)
    if (!userId || !/^[a-fA-F0-9]{24}$/.test(userId)) {
      setError('Invalid chat user ID.');
      setCheckingMatch(false);
      return;
    }
    setError('');
    // Get my user id and check if matched with the target user
    api.get('/profile').then(res => {
      setMyId(res.data._id);
      socket.emit('join', res.data._id);
      // Check if matched with the target user
      api.get(`/chat/check-match/${userId}`)
        .then(matchRes => {
          setIsMatched(matchRes.data.isMatched);
          setCheckingMatch(false);
          if (matchRes.data.isMatched) {
            // Fetch chat history only if matched
            api.get(`/chat/${userId}`)
              .then(chatRes => {
                setMessages(chatRes.data);
              })
              .catch(err => {
                setError('Could not load chat. Please try again later.');
              });
          } else {
            setError('You are not allowed to chat with this user. A request must be made and accepted first.');
          }
        })
        .catch(err => {
          setError('Could not verify chat permission. Please try again later.');
          setCheckingMatch(false);
        });
    });
    // Listen for new messages
    socket.on('receiveMessage', msg => {
      if (msg.senderId === userId || msg.receiverId === userId) {
        setMessages(m => [...m, msg]);
      }
    });
    return () => {
      socket.off('receiveMessage');
    };
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = e => {
    e.preventDefault();
    if (!input.trim()) return;
    if (!isMatched) {
      setError('You are not allowed to chat with this user.');
      return;
    }
    socket.emit('sendMessage', {
      senderId: myId,
      receiverId: userId,
      message: input
    });
    setMessages(m => [...m, { senderId: myId, receiverId: userId, message: input, timestamp: new Date() }]);
    setInput('');
  };

  return (
    <div className="min-h-screen bg-red-50 text-gray-800">
      <div className="max-w-4xl mx-auto p-4 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-red-800">Chat</h1>
        
        {checkingMatch ? (
          <div className="bg-white text-red-700 p-4 sm:p-6 rounded-xl shadow-lg text-lg font-semibold text-center border border-red-200">
            Checking chat permissions...
          </div>
        ) : error ? (
          <div className="bg-white text-red-700 p-4 sm:p-6 rounded-xl shadow-lg text-lg font-semibold text-center border border-red-200">
            {error}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow border border-red-200 overflow-hidden">
            {/* Messages Container */}
            <div className="h-96 sm:h-[500px] overflow-y-auto p-4 flex flex-col">
              {messages.map((msg, i) => (
                <div key={i} className={`mb-3 flex ${msg.senderId === myId ? 'justify-end' : 'justify-start'}`}>
                  <div className={`px-3 py-2 rounded-lg max-w-xs sm:max-w-md ${msg.senderId === myId ? 'bg-red-600 text-white' : 'bg-red-100 text-gray-800'}`}> 
                    <div className="text-sm sm:text-base">{msg.message}</div>
                    <div className="text-xs text-gray-500 mt-1 text-right">
                      {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Message Input */}
            <form onSubmit={sendMessage} className="flex gap-2 p-4 border-t border-gray-200">
              <input
                className="flex-1 border p-3 rounded-lg bg-white text-gray-800 border-red-300 focus:ring-2 focus:ring-red-600 text-sm sm:text-base"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type a message..."
                disabled={!isMatched}
              />
              <button 
                type="submit" 
                className="bg-red-600 text-white px-4 py-3 rounded-lg font-semibold shadow hover:bg-red-700 transition text-sm sm:text-base" 
                disabled={!isMatched}
              >
                Send
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default Chat; 