const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { 
  cors: { origin: "*" },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Store room user mappings with better structure
const rooms = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  let currentRoom = null;
  let currentUserName = null;

  socket.on("join-room", (data) => {
    const { roomId, userName } = data;
    
    // Leave previous room if any
    if (currentRoom) {
      socket.leave(currentRoom);
      removeUserFromRoom(currentRoom, socket.id);
    }
    
    // Join new room
    socket.join(roomId);
    currentRoom = roomId;
    currentUserName = userName;
    
    // Initialize room if doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
    }
    
    const room = rooms.get(roomId);
    room.set(socket.id, { userName, socketId: socket.id, joinedAt: Date.now() });
    
    console.log(`User ${userName} joined room ${roomId}`);
    
    // Send list of existing users to the new user
    const existingUsers = Array.from(room.values()).filter(user => user.socketId !== socket.id);
    socket.emit("room-users", existingUsers);
    
    // Notify other users in the room about the new user
    socket.to(roomId).emit("user-joined", { userName, socketId: socket.id });
    
    // Log room status
    console.log(`Room ${roomId} now has ${room.size} users`);
  });

  socket.on("signal", (data) => {
    const { roomId, data: signalData, fromUser, toUser } = data;
    
    // Find the target user's socket
    const room = rooms.get(roomId);
    if (room) {
      for (const [socketId, user] of room.entries()) {
        if (user.userName === toUser) {
          io.to(socketId).emit("signal", { 
            data: signalData, 
            fromUser, 
            toUser 
          });
          break;
        }
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    
    if (currentRoom) {
      removeUserFromRoom(currentRoom, socket.id);
    }
  });

  // Handle reconnection attempts
  socket.on("reconnect-attempt", () => {
    console.log("User attempting to reconnect:", socket.id);
  });

  // Handle errors
  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });
});

// Helper function to remove user from room
function removeUserFromRoom(roomId, socketId) {
  const room = rooms.get(roomId);
  if (room) {
    const user = room.get(socketId);
    if (user) {
      room.delete(socketId);
      console.log(`User ${user.userName} left room ${roomId}`);
      
      // Notify other users
      io.to(roomId).emit("user-left", { 
        userName: user.userName, 
        socketId: socketId 
      });
      
      // Clean up empty rooms
      if (room.size === 0) {
        rooms.delete(roomId);
        console.log(`Room ${roomId} deleted (empty)`);
      } else {
        console.log(`Room ${roomId} now has ${room.size} users`);
      }
    }
  }
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    rooms: rooms.size,
    totalUsers: Array.from(rooms.values()).reduce((sum, room) => sum + room.size, 0)
  });
});

// Get room info endpoint
app.get("/room/:roomId", (req, res) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);
  
  if (room) {
    res.json({
      roomId,
      userCount: room.size,
      users: Array.from(room.values()).map(user => ({
        userName: user.userName,
        joinedAt: user.joinedAt
      }))
    });
  } else {
    res.status(404).json({ error: "Room not found" });
  }
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log("🚀 Signaling server running on port", PORT);
  console.log("📊 Health check: http://localhost:" + PORT + "/health");
});
