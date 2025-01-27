const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const cors = require('cors');
const geminiHandler = require('./geminiHandler');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    origin: true,
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

const rooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('create-room', ({ roomId, username }) => {
    rooms.set(roomId, {
      text: '',
      owner: socket.id,
      users: [{
        id: socket.id,
        name: username,
        access: 'owner'
      }]
    });
    
    socket.join(roomId);
    io.to(roomId).emit('room-info', rooms.get(roomId));
  });

  socket.on('join-room', ({ roomId, username }) => {
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }

    room.users.push({
      id: socket.id,
      name: username,
      access: 'read' 
    });

    socket.join(roomId);
    io.to(roomId).emit('room-info', room);
    socket.emit('text-update', room.text);
  });

  socket.on('typing', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const user = room.users.find(u => u.id === socket.id);
    if (user) {
      io.to(roomId).emit('user-typing', { 
        userId: socket.id,
        username: user.name
      });
    }
  });

  socket.on('stopped-typing', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const user = room.users.find(u => u.id === socket.id);
    if (user) {
      io.to(roomId).emit('user-stopped-typing', { 
        userId: socket.id,
        username: user.name
      });
    }
  });

  socket.on('update-text', ({ roomId, text }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const user = room.users.find(u => u.id === socket.id);
    if (user && (user.access === 'edit' || user.access === 'owner')) {
      room.text = text;
      io.to(roomId).emit('text-update', text);
    }
  });

  socket.on('update-access', ({ roomId, userId, access }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const requestingUser = room.users.find(u => u.id === socket.id);
    if (requestingUser && requestingUser.access === 'owner') {
      const targetUser = room.users.find(u => u.id === userId);
      if (targetUser && targetUser.id !== room.owner) { 
        targetUser.access = access;
        io.to(roomId).emit('room-info', room);
      }
    }
  });

  socket.on('ai-prompt', async ({ roomId, prompt, username }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const user = room.users.find(u => u.id === socket.id);
    if (!user || (user.access !== 'edit' && user.access !== 'owner')) return;

    try {
      const aiResponse = await geminiHandler.getResponse(roomId, prompt);
      
    
      const timestamp = new Date().toLocaleTimeString();
      const formattedPrompt = `\n[${timestamp}] ${username}: ${prompt}\n`;
      const formattedResponse = `[${timestamp}] AI Assistant: ${aiResponse}\n`;
      
      room.text = room.text + formattedPrompt + formattedResponse;
      
    
      io.to(roomId).emit('text-update', room.text);
    } catch (error) {
      socket.emit('error', 'Failed to get AI response');
    }
  });

  socket.on('disconnect', () => {
    rooms.forEach((room, roomId) => {
      const userIndex = room.users.findIndex(u => u.id === socket.id);
      if (userIndex !== -1) {
        const user = room.users[userIndex];
        io.to(roomId).emit('user-stopped-typing', { 
          userId: socket.id,
          username: user.name
        });

        room.users.splice(userIndex, 1);
        if (room.users.length === 0) {
          rooms.delete(roomId);
        } else {
          if (room.owner === socket.id) {
            room.owner = room.users[0].id;
            room.users[0].access = 'owner';
          }
          io.to(roomId).emit('room-info', room);
        }
      }
    });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});