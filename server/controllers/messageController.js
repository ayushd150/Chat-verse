import Message from "../models/messageModel.js";
import User from "../models/userModel.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import fs from 'fs';
import path from 'path';

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");
    
    res.status(200).json(filteredUsers);
  } catch (error) {
    console.log("error in getUsersForSidebar", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChartId } = req.params;    
    const myId = req.user._id;
    
    // Find messages and exclude those deleted by the current user
    const messages = await Message.find({
      $and: [
        {
          $or: [
            { senderId: myId, receiverId: userToChartId },
            { senderId: userToChartId, receiverId: myId },
          ]
        },
        {
          deletedBy: { $ne: myId } // Exclude messages deleted by current user
        }
      ]
    }).sort({ createdAt: 1 }); // Sort by creation time ascending (oldest first)
        
    res.status(200).json(messages);
  } catch (error) {
    console.log("error in getMessages", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, location, messageType } = req.body; // Added location and messageType
    const { id: receiverId } = req.params;  
    const myId = req.user._id;

    // Validate message type and required fields
    if (messageType === 'location' && (!location || !location.latitude || !location.longitude)) {
      return res.status(400).json({ message: "Location data is required for location messages" });
    }

    if (messageType === 'text' && !text && !image) {
      return res.status(400).json({ message: "Text or image is required for text messages" });
    }

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image, {
        folder: "profile-pictures-chat-app",
      });
      imageUrl = uploadResponse.secure_url;
    }

    // Create message object with appropriate fields based on message type
    const messageData = {
      senderId: myId,
      receiverId,
      messageType: messageType || 'text',
      deletedBy: [],
      isRead: false,
      readAt: null
    };

    // Add type-specific data
    if (messageType === 'location') {
      messageData.location = {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address || null,
        accuracy: location.accuracy || null
      };
    } else {
      messageData.text = text;
      messageData.image = imageUrl;
    }

    const newMessage = new Message(messageData);
    await newMessage.save();
    
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }
    
    res.status(201).json(newMessage);
  } catch (error) {
    console.log("error in sendMessage", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// NEW: Send voice message
export const sendVoiceMessage = async (req, res) => {
  try {
    const { id: receiverId } = req.params;
    const senderId = req.user._id;
    const { duration } = req.body; // Duration from frontend

    if (!req.file) {
      return res.status(400).json({ error: "No voice file uploaded" });
    }

    // Upload voice file to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(req.file.path, {
      folder: "chat-app-voice-messages",
      resource_type: "video" // Use 'video' for audio files in Cloudinary
    });

    // Delete temporary file
    fs.unlinkSync(req.file.path);

    // Create voice message object
    const voiceData = {
      url: uploadResponse.secure_url,
      duration: parseFloat(duration) || 0,
      size: req.file.size,
      filename: req.file.filename,
      mimeType: req.file.mimetype
    };

    const newMessage = new Message({
      senderId,
      receiverId,
      messageType: 'voice',
      voice: voiceData
    });

    await newMessage.save();

    // Populate sender info for response
    await newMessage.populate('senderId', 'fullName profilePic');
    await newMessage.populate('receiverId', 'fullName profilePic');

    // Emit to receiver via socket
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
      
      // Update chat list for receiver
      io.to(receiverSocketId).emit("updateChatList", {
        userId: senderId,
        lastMessage: "🎤 Voice message",
        timestamp: newMessage.createdAt,
        unreadCount: 1
      });
    }

    // Update sender's chat list
    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("updateChatList", {
        userId: receiverId,
        lastMessage: "🎤 Voice message",
        timestamp: newMessage.createdAt,
        isSent: true
      });
    }

    res.status(201).json(newMessage);

  } catch (error) {
    console.error("Error in sendVoiceMessage:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Mark messages as read
export const markMessagesAsRead = async (req, res) => {
  try {
    const { id: senderId } = req.params;
    const receiverId = req.user._id;
    
    const result = await Message.updateMany(
      {
        senderId: senderId,
        receiverId: receiverId,
        isRead: false,
        deletedBy: { $ne: receiverId }
      },
      {
        $set: {
          isRead: true,
          readAt: new Date()
        }
      }
    );
    
    console.log(`Marked ${result.modifiedCount} messages as read from ${senderId} to ${receiverId}`);
    
    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesRead", {
        readBy: receiverId,
        userId: senderId,
        readAt: new Date(),
        messageCount: result.modifiedCount
      });
    }
    
    res.status(200).json({ 
      message: "Messages marked as read successfully",
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.log("error in markMessagesAsRead", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const clearAllMessages = async (req, res) => {
  try {
    const myId = req.user._id;
    
    const result = await Message.updateMany(
      {
        $or: [
          { senderId: myId },
          { receiverId: myId }
        ],
        deletedBy: { $ne: myId }
      },
      {
        $addToSet: { deletedBy: myId }
      }
    );
    
    console.log(`Marked ${result.modifiedCount} messages as deleted for user ${myId}`);
    
    await Message.deleteMany({
      $expr: { $eq: [{ $size: "$deletedBy" }, 2] }
    });
    
    res.status(200).json({ 
      message: "All messages cleared successfully",
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.log("error in clearAllMessages", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const clearUserMessages = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: otherUserId } = req.params;
    
    const result = await Message.updateMany(
      {
        $and: [
          {
            $or: [
              { senderId: myId, receiverId: otherUserId },
              { senderId: otherUserId, receiverId: myId }
            ]
          },
          {
            deletedBy: { $ne: myId }
          }
        ]
      },
      {
        $addToSet: { deletedBy: myId }
      }
    );
    
    console.log(`Marked ${result.modifiedCount} messages as deleted between ${myId} and ${otherUserId}`);
    
    await Message.deleteMany({
      $and: [
        {
          $or: [
            { senderId: myId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: myId }
          ]
        },
        {
          $expr: { $eq: [{ $size: "$deletedBy" }, 2] }
        }
      ]
    });
    
    res.status(200).json({ 
      message: "Messages cleared successfully",
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.log("error in clearUserMessages", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};