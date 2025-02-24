import React, { useState } from 'react';
import { X } from 'lucide-react';

const JoinModal = ({ onJoin, onClose }) => {
  const [username, setUsername] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      onJoin(username.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div className="bg-black text-white rounded-[32px] p-6 w-full max-w-md border-8 border-[#5E5A5A] relative">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold mb-4 text-center">Join Room</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-gray-300 mb-2 text-sm">
              Enter your name to join
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-full border bg-black text-white border-[#5E5A5A] focus:outline-none focus:ring-2 focus:ring-[#5E5A5A] placeholder-gray-500"
              placeholder="Your name"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#5E5A5A] text-white font-semibold rounded-full py-3 hover:bg-gray-600 transition duration-300"
            disabled={!username.trim()}
          >
            Join Room
          </button>
        </form>
      </div>
    </div>
  );
};

export default JoinModal;