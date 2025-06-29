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
// Replace your current sendVoiceMessage function with this fixed version:

export const sendVoiceMessage = async (req, res) => {
  try {
    console.log('🎤 sendVoiceMessage called');
    console.log('🎤 req.params:', req.params);
    console.log('🎤 req.body:', req.body);
    console.log('🎤 req.file:', req.file);
    console.log('🎤 req.user:', req.user);

    const { id: receiverId } = req.params;
    const senderId = req.user._id;
    const { duration } = req.body; // Duration from frontend

    // Validate required data
    if (!senderId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!receiverId) {
      return res.status(400).json({ error: "Receiver ID is required" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No voice file uploaded" });
    }

    console.log('🎤 Starting Cloudinary upload...');
    console.log('🎤 File path:', req.file.path);

    // Check if file exists before uploading
    if (!fs.existsSync(req.file.path)) {
      return res.status(400).json({ error: "Uploaded file not found" });
    }

    // Upload voice file to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(req.file.path, {
      folder: "chat-app-voice-messages",
      resource_type: "video", // Use 'video' for audio files in Cloudinary
      timeout: 60000 // 60 second timeout
    });

    console.log('🎤 Cloudinary upload successful:', uploadResponse.secure_url);

    // Delete temporary file after successful upload
    try {
      fs.unlinkSync(req.file.path);
      console.log('🎤 Temporary file deleted');
    } catch (deleteError) {
      console.error('🎤 Error deleting temp file:', deleteError);
      // Don't fail the request if we can't delete the temp file
    }

    // Create voice message object
    const voiceData = {
      url: uploadResponse.secure_url,
      duration: parseFloat(duration) || 0,
      size: req.file.size,
      filename: req.file.filename,
      mimeType: req.file.mimetype
    };

    console.log('🎤 Creating message with voiceData:', voiceData);

    const newMessage = new Message({
      senderId,
      receiverId,
      messageType: 'voice',
      voice: voiceData,
      deletedBy: [], // Add this field to match your schema
      isRead: false, // Add this field to match your schema
      readAt: null   // Add this field to match your schema
    });

    await newMessage.save();
    console.log('🎤 Message saved to database');

    // Populate sender info for response
    await newMessage.populate('senderId', 'fullName profilePic');
    await newMessage.populate('receiverId', 'fullName profilePic');

    console.log('🎤 Message populated, sending socket events');

    // Emit to receiver via socket
    try {
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
        console.log('🎤 Socket events sent to receiver');
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
        console.log('🎤 Socket events sent to sender');
      }
    } catch (socketError) {
      console.error('🎤 Socket error (non-fatal):', socketError);
      // Don't fail the request if socket fails
    }

    console.log('🎤 Sending success response');
    
    // Return success response - THIS WAS MISSING!
    res.status(201).json(newMessage);

  } catch (error) {
    console.error('🎤 sendVoiceMessage error:', error);
    console.error('🎤 Error stack:', error.stack);

    // Clean up temp file if it exists and there was an error
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('🎤 Temp file cleaned up after error');
      } catch (cleanupError) {
        console.error('🎤 Error cleaning up temp file:', cleanupError);
      }
    }

    // Return appropriate error response
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: "Invalid message data", details: error.message });
    }
    
    if (error.message && error.message.includes('cloudinary')) {
      return res.status(500).json({ error: "File upload failed", details: error.message });
    }

    res.status(500).json({ 
      error: "Failed to send voice message", 
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
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