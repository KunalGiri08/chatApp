import express from 'express';
import http from 'http';
import 'dotenv/config';
import cors from 'cors';
import { connectDB } from './lib/db.js';
import { Server } from 'socket.io';

import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

// 1. CREATE THE APP FIRST
const app = express();

// 2. DEFINE THE DYNAMIC CORS FUNCTION
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like Postman or mobile apps)
    if (!origin) return callback(null, true);
    
    // Check if the frontend origin ends with your Vercel domain pattern
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    
    return callback(new Error('Blocked by CORS policy.'), false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

// Apply dynamic CORS to Express HTTP routes
app.use(cors(corsOptions));

// 3. APPLY OTHER MIDDLEWARE
app.use(express.json({ limit: "4mb" }));

// Create HTTP server using the initialized app
const server = http.createServer(app);

// Initialize socket.io server with dynamic matching
export const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin || origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      return callback(new Error('Blocked by Socket CORS.'), false);
    },
    credentials: true
  }
});

// Store online users
export const userSocketMap = {};  // {userId: socketId}

// Socket.io connection handler
io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    console.log("User Connected", userId);

    if (userId) {
        userSocketMap[userId] = socket.id;
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
        console.log("User Disconnected", userId);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});

// Import routes
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";

// Routes setup
app.use("/api/status", (req, res) => res.send("Server is live"));
app.use("/api/users", userRouter);
app.use("/api/messages", messageRouter);

// Connect to the database
connectDB();

if (process.env.NODE_ENV !== "production") {
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log("Server is running on PORT: " + PORT));
}

// Export server for Vercel
export default server;
