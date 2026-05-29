const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Store room states
const rooms = new Map();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('create-room', (roomId, username) => {
    if (rooms.has(roomId)) {
      socket.emit('join-error', 'Room ID is already in use. Please choose another one.');
      return;
    }

    rooms.set(roomId, {
      creatorId: socket.id,
      users: { [socket.id]: username }, // socketId -> username
      tasks: [],
      pendingRequests: [],
      timerState: {
        isRunning: false,
        mode: 'work',
        duration: 25 * 60,
        remaining: 25 * 60,
        lastUpdateTime: Date.now()
      }
    });
    
    socket.join(roomId);
    console.log(`Room ${roomId} created by ${username} (${socket.id})`);
    socket.emit('room-state', rooms.get(roomId));
  });

  socket.on('join-room', (roomId, username) => {
    if (!rooms.has(roomId)) {
      socket.emit('join-error', 'Room does not exist. Please check the ID or create a new room.');
      return;
    }

    const room = rooms.get(roomId);
    const creatorSocketId = room.creatorId;
    if (creatorSocketId) {
      room.pendingRequests.push({ socketId: socket.id, username });
      io.to(creatorSocketId).emit('join-request', { socketId: socket.id, username });
      socket.emit('join-pending');
      console.log(`Join request to room ${roomId} by ${username} (${socket.id}) sent to creator`);
    } else {
      socket.emit('join-error', 'Room owner is not available.');
    }
  });

  socket.on('accept-join', (roomId, targetSocketId, targetUsername) => {
    const room = rooms.get(roomId);
    if (room && room.creatorId === socket.id) {
      room.pendingRequests = room.pendingRequests.filter(r => r.socketId !== targetSocketId);
      room.users[targetSocketId] = targetUsername;
      const targetSocket = io.sockets.sockets.get(targetSocketId);
      if (targetSocket) {
        targetSocket.join(roomId);
        targetSocket.emit('room-state', room);
        socket.emit('room-state', room); // Optionally update creator's user list if needed, or rely on user-joined
        targetSocket.to(roomId).emit('user-joined', targetSocketId, targetUsername);
      }
    }
  });

  socket.on('deny-join', (roomId, targetSocketId) => {
    const room = rooms.get(roomId);
    if (room && room.creatorId === socket.id) {
      room.pendingRequests = room.pendingRequests.filter(r => r.socketId !== targetSocketId);
      io.to(targetSocketId).emit('join-denied');
    }
  });

  // Task Management
  socket.on('add-task', (roomId, task) => {
    const room = rooms.get(roomId);
    if (room) {
      room.tasks.push(task);
      io.to(roomId).emit('task-added', task);
    }
  });

  socket.on('toggle-task', (roomId, taskId, username, isCompleted) => {
    const room = rooms.get(roomId);
    if (room) {
      const task = room.tasks.find(t => t.id === taskId);
      if (task) {
        if (isCompleted) {
          if (!task.completedBy.includes(username)) {
            task.completedBy.push(username);
          }
        } else {
          task.completedBy = task.completedBy.filter(u => u !== username);
        }
        
        io.to(roomId).emit('task-updated', task, { userWhoToggled: username, isCompleted });
      }
    }
  });

  // Timer Management
  socket.on('sync-timer', (roomId, timerState) => {
    const room = rooms.get(roomId);
    if (room) {
      room.timerState = { ...timerState, lastUpdateTime: Date.now() };
      socket.to(roomId).emit('timer-synced', room.timerState);
    }
  });

  // WebRTC Signaling
  socket.on('offer', (roomId, offer, targetSocketId) => {
    socket.to(targetSocketId).emit('offer', socket.id, offer);
  });

  socket.on('answer', (roomId, answer, targetSocketId) => {
    socket.to(targetSocketId).emit('answer', socket.id, answer);
  });

  socket.on('ice-candidate', (roomId, candidate, targetSocketId) => {
    socket.to(targetSocketId).emit('ice-candidate', socket.id, candidate);
  });

  // Shared helper to remove a user from a room and handle cleanup
  const removeUserFromRoom = (roomId) => {
    const room = rooms.get(roomId);
    if (!room || !room.users[socket.id]) return;

    const username = room.users[socket.id];
    delete room.users[socket.id];
    socket.leave(roomId);
    socket.to(roomId).emit('user-left', socket.id, username);

    const remainingUsers = Object.keys(room.users);
    if (remainingUsers.length === 0) {
      rooms.delete(roomId); // Clean up empty rooms
    } else if (room.creatorId === socket.id) {
      // Assign new creator
      room.creatorId = remainingUsers[0];
      io.to(roomId).emit('room-state', room);
      // Re-emit pending requests to the new creator
      room.pendingRequests.forEach(req => {
        io.to(room.creatorId).emit('join-request', req);
      });
      console.log(`Creator of room ${roomId} changed to ${room.users[room.creatorId]} (${room.creatorId})`);
    }
  };

  // Explicit leave (user clicks "Leave Session")
  socket.on('leave-room', (roomId) => {
    removeUserFromRoom(roomId);
  });

  socket.on('disconnecting', () => {
    for (const roomId of socket.rooms) {
      if (roomId !== socket.id) {
        removeUserFromRoom(roomId);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket.io signaling server running on port ${PORT}`);
});
