const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const socketio = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: { origin: '*' },
});

mongoose.connect(process.env.MONGO_URI).then(() => console.log('MongoDB connected'));

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));

// Socket.IO
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
