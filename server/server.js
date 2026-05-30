import express from 'express';
import http from 'http';
import 'dotenv/config';
import cors from 'cors';
import { connectDB } from './lib/db.js';
import { Server } from 'socket.io';

import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

// Create Express app and HTTP server

const app = express();

const server = http.createServer(app)

//initialize socket.io server
export const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

//store online user
export const userSocketMap = {};  //{userId:socketId}

// Socket.io connection handler
io.on("connection", (socket) => {

    const userId = socket.handshake.query.userId;
    console.log("User Connected", userId);

    if (userId) {
        userSocketMap[userId] = socket.id;
    }

    // Emit online users to all connected clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", () => {

        console.log("User Disconnected", userId);

        delete userSocketMap[userId];

        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });

});

// Middleware setup

app.use(express.json({ limit: "4mb" }));

app.use(cors({
  origin: "*"
}));

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
//export server for versel
export default server;