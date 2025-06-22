import Message from "../models/messageModel.js";
import User from "../models/userModel.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

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