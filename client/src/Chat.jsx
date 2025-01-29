import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send } from 'lucide-react';

export const Chat = ({ socket, roomId, username, showChat, setShowChat }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    socket.on('chat-message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('chat-history', (history) => {
      setMessages(history);
    });

    return () => {
      socket.off('chat-message');
      socket.off('chat-history');
    };
  }, [socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageData = {
      roomId,
      username,
      text: newMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    socket.emit('send-message', messageData);
    setNewMessage('');
  };

  return (
    <div className={`fixed right-4 bottom-4 w-80 bg-white rounded-lg shadow-xl ${showChat ? 'block' : 'hidden'}`}>
      <div className="bg-purple-600 text-white p-3 rounded-t-lg flex justify-between items-center">
        <h3 className="font-semibold flex items-center">
          <MessageCircle className="mr-2" size={18} />
          Chat
        </h3>
        <button onClick={() => setShowChat(false)} className="text-white hover:text-gray-200">
          ×
        </button>
      </div>
      
      <div className="h-96 overflow-y-auto p-4 bg-gray-50">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-4 ${message.username === username ? 'text-right' : ''}`}
          >
            <div
              className={`inline-block max-w-xs rounded-lg p-3 ${
                message.username === username
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              <p className="text-xs font-semibold mb-1">{message.username}</p>
              <p className="text-sm">{message.text}</p>
              <p className="text-xs mt-1 opacity-75">
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-3 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 rounded-lg border text-black focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;