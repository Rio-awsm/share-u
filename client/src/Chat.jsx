import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';

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
    <div className={`w-[402px]  bg-black text-white rounded-[32px] shadow-lg border-8 border-[#5E5A5A] ${showChat ? 'block' : 'hidden'}`}>
      <div className="h-96 overflow-y-auto mt-2 p-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-4 ${message.username === username ? 'text-right' : 'text-left'}`}
          >
            <div
              className={`inline-block max-w-[80%] rounded-2xl p-3 ${
                message.username === username
                  ? "bg-[#5E5A5A] text-white" : "bg-[#222222] text-gray-300"
              }`}
            >
              <p className="text-xs font-semibold mb-1">{message.username}</p>
              <p className="text-sm">{message.text}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-2 border-t-8 bg-[#5E5A5A] border-[#5E5A5A] rounded-b-[10px]">
        <form onSubmit={sendMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Text here...."
            className="flex-1 px-4 py-3 border rounded-full bg-black text-white placeholder-gray-500 focus:outline-none"
          />
          <button type="submit" className="bg-black border text-white p-3 rounded-full hover:bg-[#5E5A5A] transition-colors">
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
