import { Server } from "socket.io";
import http from "http";
import express from "express";
import User from "../models/userModel.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [process.env.FRONTEND_URL],
  },
});

export function getReceiverSocketId(userId) {
  const socketId = userSocketMap[userId];
  return socketId;
}

// Used to store online users
const userSocketMap = {}; //{userId: socketId}
const typingUsers = {}; //{userId: {receiverId, isTyping, lastTypingTime}}
const typingTimeouts = {}; // Store timeouts for clearing typing status

// FIXED: Improved middleware with better error handling
io.use(async (socket, next) => {
  try {
    const userId = socket.handshake.query.userId;
    console.log("🔍 Socket middleware - User ID:", userId);
    
    if (!userId) {
      console.error("❌ No userId provided in socket connection");
      return next(new Error("No userId provided"));
    }
    
    const user = await User.findById(userId);
    if (!user) {
      console.error("❌ User not found:", userId);
      return next(new Error("User not found"));
    }
    
    socket.user = user;
    socket.userId = userId; // Store userId directly on socket
    console.log("✅ Socket middleware - User authenticated:", user.fullName);
    next();
  } catch (error) {
    console.error("❌ Socket middleware error:", error);
    next(error);
  }
});

io.on("connection", async (socket) => {
  try {
    const userId = socket.userId || socket.handshake.query.userId;
    console.log("🔌 User connected:", userId, "Socket ID:", socket.id);
    
    if (!userId) {
      console.error("❌ No userId available during connection");
      socket.disconnect();
      return;
    }

    // FIXED: Add user to online users map
    userSocketMap[userId] = socket.id;
    console.log("👥 Updated userSocketMap:", Object.keys(userSocketMap));

    // FIXED: Emit online users to ALL clients (including the newly connected one)
    const onlineUserIds = Object.keys(userSocketMap);
    console.log("📤 Broadcasting online users to all clients:", onlineUserIds);
    io.emit("getOnlineUsers", onlineUserIds);

    // FIXED: Also emit to the connecting user specifically after a short delay
    setTimeout(() => {
      socket.emit("getOnlineUsers", onlineUserIds);
      console.log("📤 Sent online users to new connection:", onlineUserIds);
    }, 500);

    // Handle real-time typing with input value
    socket.on("typing", ({ receiverId, senderId, isTyping, inputValue = "" }) => {
      // Clear existing timeout
      if (typingTimeouts[senderId]) {
        clearTimeout(typingTimeouts[senderId]);
        delete typingTimeouts[senderId];
      }

      // If user is typing and has actual content
      if (isTyping && inputValue.trim().length > 0) {
        typingUsers[senderId] = {
          receiverId,
          isTyping: true,
          lastTypingTime: Date.now(),
          inputValue: inputValue.trim()
        };

        // Auto-clear typing status after 1.5 seconds of no activity
        typingTimeouts[senderId] = setTimeout(() => {
          delete typingUsers[senderId];
          delete typingTimeouts[senderId];
          
          const receiverSocketId = getReceiverSocketId(receiverId);
          if (receiverSocketId) {
            const relevantTypingUsers = Object.keys(typingUsers).filter(
              userId => typingUsers[userId].receiverId === receiverId
            );
            io.to(receiverSocketId).emit("getTypingUsers", relevantTypingUsers);
          }
        }, 1500);
      } else {
        // Clear typing if input is empty or not typing
        delete typingUsers[senderId];
      }

      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        const relevantTypingUsers = Object.keys(typingUsers).filter(
          userId => typingUsers[userId].receiverId === receiverId
        );
        io.to(receiverSocketId).emit("getTypingUsers", relevantTypingUsers);
      }
    });

    // Handle live message preview (what user is typing)
    socket.on("sendLiveMessages", (value, senderId, receiverId) => {
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        socket.to(receiverSocketId).emit("liveMessage", { value, senderId });
      }
    });

    // Handle actual message sent
    socket.on("messageSent", ({ senderId, receiverId, message }) => {
      // Clear typing status when message is sent
      if (typingTimeouts[senderId]) {
        clearTimeout(typingTimeouts[senderId]);
        delete typingTimeouts[senderId];
      }
      delete typingUsers[senderId];

      const messageData = {
        senderId,
        receiverId,
        message,
        timestamp: new Date()
      };

      // Emit to receiver that message was sent
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        // Clear typing users for receiver
        const relevantTypingUsers = Object.keys(typingUsers).filter(
          userId => typingUsers[userId].receiverId === receiverId
        );
        io.to(receiverSocketId).emit("getTypingUsers", relevantTypingUsers);
        
        // Notify receiver of new message (for chat ordering and message preview)
        io.to(receiverSocketId).emit("newMessageReceived", messageData);
        
        // Update chat list for receiver (move chat to top)
        io.to(receiverSocketId).emit("updateChatList", {
          userId: senderId,
          lastMessage: message,
          timestamp: new Date(),
          unreadCount: 1 // This should be calculated based on actual unread messages
        });
      }

      // Also emit to sender for confirmation and update their chat list
      socket.emit("messageDelivered", messageData);
      
      // Update sender's chat list (move chat to top)
      socket.emit("updateChatList", {
        userId: receiverId,
        lastMessage: message,
        timestamp: new Date(),
        isSent: true
      });
    });

    // NEW: Handle message read status
    socket.on("messageRead", ({ senderId, receiverId, messageId, unreadCount = 0 }) => {
      const senderSocketId = getReceiverSocketId(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messageReadConfirmation", {
          receiverId,
          messageId,
          readAt: new Date()
        });
      }

      // Update unread count for the receiver
      socket.emit("updateUnreadCount", {
        userId: senderId,
        unreadCount: 0
      });
    });

    // NEW: Handle bulk messages read (when user opens chat)
    socket.on("messagesRead", ({ userId, readBy }) => {
      console.log("📖 Messages read event:", { userId, readBy });
      
      // Notify the sender that their messages were read
      const senderSocketId = getReceiverSocketId(userId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messagesRead", {
          readBy: readBy,
          userId: userId,
          readAt: new Date()
        });
      }
    });

    // Handle chat opened (for moving chat to top and clearing unread count)
    socket.on("chatOpened", ({ userId, chatWithUserId }) => {
      // Clear unread count for this chat
      socket.emit("updateUnreadCount", {
        userId: chatWithUserId,
        unreadCount: 0
      });

      // Notify the other user that this chat was opened
      const otherUserSocketId = getReceiverSocketId(chatWithUserId);
      if (otherUserSocketId) {
        io.to(otherUserSocketId).emit("chatBecameActive", {
          userId: userId,
          timestamp: new Date()
        });
      }
    });

    // FIXED: Handle manual request for online users
    socket.on("getOnlineUsers", () => {
      const onlineUserIds = Object.keys(userSocketMap);
      console.log("📤 Manual request - sending online users:", onlineUserIds);
      socket.emit("getOnlineUsers", onlineUserIds);
    });

    // Handle getting last messages for each chat
    socket.on("getLastMessages", async ({ userId }) => {
      try {
        // This should fetch last messages from your database
        // For now, emitting a placeholder response
        socket.emit("lastMessagesUpdate", {
          // This should contain last message data for each chat
          // Format: { [otherUserId]: { message, timestamp, unreadCount, isSent } }
        });
      } catch (error) {
        console.error("Error fetching last messages:", error);
      }
    });

    // FIXED: Enhanced disconnect handler
    socket.on("disconnect", (reason) => {
      console.log(`❌ User ${userId} disconnected. Reason:`, reason);
      
      // Remove user from online users
      delete userSocketMap[userId];
      delete typingUsers[userId];
      
      // Clear any pending timeouts
      if (typingTimeouts[userId]) {
        clearTimeout(typingTimeouts[userId]);
        delete typingTimeouts[userId];
      }

      // FIXED: Emit updated online users list to all remaining clients
      const onlineUserIds = Object.keys(userSocketMap);
      console.log("📤 Broadcasting updated online users after disconnect:", onlineUserIds);
      io.emit("getOnlineUsers", onlineUserIds);
      
      // Update typing status for all receivers
      Object.keys(typingUsers).forEach(typingUserId => {
        const { receiverId } = typingUsers[typingUserId];
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
          const relevantTypingUsers = Object.keys(typingUsers).filter(
            userId => typingUsers[userId].receiverId === receiverId
          );
          io.to(receiverSocketId).emit("getTypingUsers", relevantTypingUsers);
        }
      });
    });

  } catch (error) {
    console.error("❌ Error in socket connection handler:", error);
    socket.disconnect();
  }
});

// FIXED: Add periodic cleanup and status broadcast
setInterval(() => {
  const onlineUserIds = Object.keys(userSocketMap);
  console.log("🔄 Periodic online users broadcast:", onlineUserIds);
  io.emit("getOnlineUsers", onlineUserIds);
}, 30000); // Every 30 seconds

export { io, server, app };