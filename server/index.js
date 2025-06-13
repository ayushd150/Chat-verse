import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import profileRoutes from "./routes/profileRoutes.js"

import { connectDB } from "./lib/db.js";
import cookieParser from "cookie-parser";
import {app, server} from "./lib/socket.js";

dotenv.config();

const port = process.env.PORT || 5000;

// IMPORTANT: cookieParser must be before CORS
app.use(cookieParser());
app.use(express.json({limit: '50mb'}));

// Simplified CORS configuration - this should work for development
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174', 
      'http://localhost:3000',
      process.env.FRONTEND_URL
    ].filter(Boolean), // Remove undefined values
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  })
);

// Add this middleware for debugging
app.use((req, res, next) => {
  console.log(`📍 ${req.method} ${req.path}`);
  console.log('🍪 Cookies received:', req.cookies);
  console.log('📋 Headers:', {
    origin: req.headers.origin,
    'user-agent': req.headers['user-agent']?.substring(0, 50),
    cookie: req.headers.cookie
  });
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/profile", profileRoutes);

server.listen(port, () => {
  console.log("Server is running on port " + port);
  connectDB();
});