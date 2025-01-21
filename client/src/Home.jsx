import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { nanoid } from 'nanoid';

const Home = () => {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();

  const createRoom = () => {
    if (!username) return;
    const newRoomId = nanoid(10);
    navigate(`/room/${newRoomId}`, { state: { username, isOwner: true } });
  };

  const joinRoom = () => {
    if (!username || !roomId) return;
    navigate(`/room/${roomId}`, { state: { username, isOwner: false } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-5xl font-extrabold text-white text-center mb-8 drop-shadow-lg">
          Share U
        </h1>
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <input
            type="text"
            placeholder="Your name"
            className="w-full bg-gray-100 text-gray-800 placeholder-gray-500 border border-gray-300 rounded-full py-3 px-6 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button
            onClick={createRoom}
            className="w-full bg-blue-600 text-white font-semibold rounded-full py-3 px-6 mb-6 hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Create New Room
          </button>
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">or join existing</span>
            </div>
          </div>
          <input
            type="text"
            placeholder="Room Code"
            className="w-full bg-gray-100 text-gray-800 placeholder-gray-500 border border-gray-300 rounded-full py-3 px-6 mb-6 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <button
            onClick={joinRoom}
            className="w-full bg-purple-600 text-white font-semibold rounded-full py-3 px-6 hover:bg-purple-700 transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
          >
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
