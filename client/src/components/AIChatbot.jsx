import React, { useState, useRef, useEffect } from 'react';
import { FaRobot, FaTimes, FaPaperPlane, FaUser, FaHeartbeat } from 'react-icons/fa';

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm your Plasma Donor Assistant. I can help you with questions about blood donation, plasma, compatibility, and how to use this platform. How can I assist you today?",
      isBot: true,
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Predefined responses for common plasma donation queries
  const getAIResponse = (userMessage) => {
    const message = userMessage.toLowerCase();
    
    // Blood type compatibility queries
    if (message.includes('blood type') || message.includes('compatibility') || message.includes('can donate') || message.includes('can receive')) {
      return "Blood compatibility is crucial for safe donations! Here's a quick guide:\n\n🔴 O- (Universal Donor): Can donate to everyone\n🔴 AB+ (Universal Recipient): Can receive from everyone\n🔴 A+ can donate to: A+, AB+\n🔴 B+ can donate to: B+, AB+\n\nAlways consult with medical professionals for specific compatibility questions. Would you like to know about any specific blood type?";
    }
    
    // Plasma donation process
    if (message.includes('plasma') || message.includes('donation process') || message.includes('how to donate')) {
      return "Plasma donation is a life-saving process! Here's what you need to know:\n\n💉 Process takes 60-90 minutes\n🩺 Health screening required\n💪 Must be 18+ years old\n⚖️ Weight minimum: 110 lbs\n🕐 Can donate twice per week\n\nPlasma helps treat immune disorders, bleeding disorders, and more. Ready to save lives? Use our 'Search Donors' feature to get started!";
    }
    
    // Eligibility requirements
    if (message.includes('eligible') || message.includes('requirements') || message.includes('can i donate')) {
      return "To be eligible for plasma donation, you must:\n\n✅ Be 18-65 years old\n✅ Weigh at least 110 lbs\n✅ Be in good health\n✅ Pass medical screening\n✅ Have valid ID\n✅ No recent tattoos/piercings (varies by location)\n\nSome medications may affect eligibility. Always check with medical staff for your specific situation!";
    }
    
    // Platform usage
    if (message.includes('how to use') || message.includes('website') || message.includes('platform') || message.includes('search')) {
      return "Welcome to Plasma Donor! Here's how to use our platform:\n\n🎯 **For Requesters:**\n• Use 'Search Donors' to find compatible donors\n• Filter by blood type and location\n• Send requests to donors\n\n🩸 **For Donors:**\n• Complete your profile with blood type\n• Set availability status\n• Respond to requests\n\n💬 Chat feature available for communication\n📍 Location-based matching for convenience";
    }
    
    // Safety and side effects
    if (message.includes('safe') || message.includes('side effects') || message.includes('risks')) {
      return "Plasma donation is generally very safe when done at licensed facilities:\n\n✅ **Safety Measures:**\n• Sterile, single-use equipment\n• Trained medical staff\n• Health screening before each donation\n\n⚠️ **Possible Side Effects:**\n• Mild fatigue\n• Temporary dehydration\n• Bruising at needle site\n\n💡 **Tips:** Stay hydrated, eat well before donating, and rest afterward!";
    }
    
    // Recovery and aftercare
    if (message.includes('after') || message.includes('recovery') || message.includes('care') || message.includes('rest')) {
      return "Post-donation care is important:\n\n🥤 **Hydration:** Drink plenty of fluids for 24 hours\n🍎 **Nutrition:** Eat iron-rich foods and proteins\n😴 **Rest:** Avoid strenuous activity for a few hours\n🩹 **Care:** Keep bandage on for 3-4 hours\n\n⚡ Most people feel normal within a few hours. If you experience dizziness or unusual symptoms, contact medical staff immediately!";
    }
    
    // Emergency or urgent queries
    if (message.includes('emergency') || message.includes('urgent') || message.includes('help') || message.includes('contact')) {
      return "For medical emergencies, please contact:\n\n🚨 **Emergency:** Call 911 immediately\n🏥 **Non-emergency medical:** Contact your healthcare provider\n📞 **Platform support:** Use the contact form in your profile\n\nThis chatbot provides general information only and cannot replace professional medical advice.";
    }
    
    // Benefits of donation
    if (message.includes('benefits') || message.includes('why donate') || message.includes('helps')) {
      return "Plasma donation saves lives and offers benefits:\n\n💖 **Lives Saved:**\n• Treats immune deficiencies\n• Helps trauma patients\n• Supports cancer treatments\n• Aids burn victims\n\n🎁 **For Donors:**\n• Compensation for time\n• Free health screening\n• Satisfaction of helping others\n• Regular health monitoring\n\nOne donation can help multiple patients!";
    }
    
    // Blockchain security (since your app has blockchain integration)
    if (message.includes('blockchain') || message.includes('security') || message.includes('private') || message.includes('data')) {
      return "Our platform uses advanced blockchain security:\n\n🔐 **Blockchain Features:**\n• Encrypted data storage\n• Immutable donation records\n• Secure wallet authentication\n• Privacy protection\n\n🛡️ **Your Privacy:**\n• Medical data is encrypted\n• Only authorized access\n• HIPAA compliant measures\n• You control data sharing\n\nYour information is safe and secure with us!";
    }
    
    // Default response for unrecognized queries
    return "I'd be happy to help! I can assist with questions about:\n\n🩸 Blood type compatibility\n💉 Plasma donation process\n📋 Eligibility requirements\n🌐 How to use this platform\n🔒 Security and privacy\n⚕️ Safety and aftercare\n\nPlease ask me anything specific, or try one of these topics. For medical emergencies, please contact healthcare professionals directly.";
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const newUserMessage = {
      id: Date.now(),
      text: inputMessage,
      isBot: false,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const botResponse = {
        id: Date.now() + 1,
        text: getAIResponse(inputMessage),
        isBot: true,
        timestamp: new Date().toLocaleTimeString()
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const quickQuestions = [
    "What is plasma donation?",
    "Am I eligible to donate?",
    "How to search for donors?",
    "Is it safe to donate?",
    "What are the benefits?"
  ];

  const handleQuickQuestion = (question) => {
    setInputMessage(question);
    setTimeout(() => handleSendMessage(), 100);
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <div 
          className="fixed bottom-6 right-6 z-50 cursor-pointer transform hover:scale-110 transition-all duration-300"
          onClick={() => setIsOpen(true)}
        >
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-full shadow-2xl chatbot-pulse">
            <FaRobot className="text-2xl" />
          </div>
          <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full px-2 py-1 animate-bounce">
            AI Help
          </div>
        </div>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden chatbot-widget">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-full">
                <FaHeartbeat className="text-lg" />
              </div>
              <div>
                <h3 className="font-bold">Plasma AI Assistant</h3>
                <p className="text-sm opacity-90">Online • Ready to help</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"
            >
              <FaTimes />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 chat-scrollbar">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex message-slide-in ${message.isBot ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`flex items-start gap-2 max-w-[80%] ${message.isBot ? 'flex-row' : 'flex-row-reverse'}`}>
                  <div className={`p-2 rounded-full ${message.isBot ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>
                    {message.isBot ? <FaRobot className="text-sm" /> : <FaUser className="text-sm" />}
                  </div>
                  <div className={`p-3 rounded-2xl ${
                    message.isBot 
                      ? 'bg-white text-gray-800 shadow-md' 
                      : 'bg-blue-500 text-white'
                  }`}>
                    <p className="text-sm whitespace-pre-line">{message.text}</p>
                    <p className={`text-xs mt-1 ${message.isBot ? 'text-gray-500' : 'text-blue-100'}`}>
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start message-slide-in">
                <div className="flex items-center gap-2">
                  <div className="bg-red-500 text-white p-2 rounded-full">
                    <FaRobot className="text-sm" />
                  </div>
                  <div className="bg-white p-3 rounded-2xl shadow-md">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length === 1 && (
            <div className="p-3 bg-white border-t">
              <p className="text-xs text-gray-600 mb-2">Quick questions:</p>
              <div className="flex flex-wrap gap-1">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickQuestion(question)}
                    className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-full hover:bg-red-100 transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 bg-white border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about plasma donation..."
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-red-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FaPaperPlane className="text-sm" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              AI Assistant • For medical emergencies, contact 911
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatbot;