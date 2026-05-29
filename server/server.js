import express from 'express';
import http from 'http';
import 'dotenv/config';
import cors from 'cors';
import { connectDB } from './lib/db.js';

import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

// Create Express app and HTTP server

const app = express();

const server = http.createServer(app)


// Middleware setup

app.use(express.json({limit: "4mb"}));

app.use(cors());

// Import routes
import userRouter from "./routes/userRoutes.js";







// Routes setup
app.use("/api/status", (req, res)=> res.send("Server is live"));
app.use("/api/users", userRouter);












// Connect to the database

connectDB();

const PORT = process.env.PORT || 5000;

server.listen(PORT, ()=> console.log("Server is running on PORT: " + PORT));