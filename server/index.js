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


const port = process.env.PORT;

app.use(express.json({limit: '50mb'}));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/profile", profileRoutes)

server.listen(port, () => {
  console.log("Server is running on port " + port);
  connectDB();
});
