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
    });
        
    res.status(200).json(messages);
  } catch (error) {
    console.log("error in getMessages", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const {text, image} = req.body;
    const { id: receiverId } = req.params;  
    const myId = req.user._id;

    let imageUrl;
    if(image) {
      const uploadResponse = await cloudinary.uploader.upload(image, {
        folder: "profile-pictures-chat-app",
      });
      imageUrl = uploadResponse.secure_url;
    }
    const newMessage = new Message({
      senderId: myId,
      receiverId,
      text,
      image: imageUrl,
      deletedBy: [], // Initialize as empty array
      isRead: false,  // Add read status
      readAt: null    // Add read timestamp
    })

    await newMessage.save();
    
    const receiverSocketId = getReceiverSocketId(receiverId);
    if(receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }
    res.status(201).json(newMessage);
  } catch (error) {
    console.log("error in sendMessage", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// NEW: Mark messages as read
export const markMessagesAsRead = async (req, res) => {
  try {
    const { id: senderId } = req.params; // ID of the user who sent the messages
    const receiverId = req.user._id; // Current user who is reading the messages
    
    // Update all unread messages from this sender to current user
    const result = await Message.updateMany(
      {
        senderId: senderId,
        receiverId: receiverId,
        isRead: false,
        deletedBy: { $ne: receiverId } // Don't update deleted messages
      },
      {
        $set: {
          isRead: true,
          readAt: new Date()
        }
      }
    );
    
    console.log(`Marked ${result.modifiedCount} messages as read from ${senderId} to ${receiverId}`);
    
    // Emit socket event to notify sender that messages were read
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
    
    // Mark all messages as deleted for this user (add user ID to deletedBy array)
    const result = await Message.updateMany(
      {
        $or: [
          { senderId: myId },
          { receiverId: myId }
        ],
        deletedBy: { $ne: myId } // Only update messages not already deleted by this user
      },
      {
        $addToSet: { deletedBy: myId } // Add user ID to deletedBy array
      }
    );
    
    console.log(`Marked ${result.modifiedCount} messages as deleted for user ${myId}`);
    
    // Clean up messages that are deleted by both users
    await Message.deleteMany({
      $expr: { $eq: [{ $size: "$deletedBy" }, 2] } // Delete if both users deleted it
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
    
    // Mark messages between users as deleted for this user
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
            deletedBy: { $ne: myId } // Only update messages not already deleted by this user
          }
        ]
      },
      {
        $addToSet: { deletedBy: myId } // Add user ID to deletedBy array
      }
    );
    
    console.log(`Marked ${result.modifiedCount} messages as deleted between ${myId} and ${otherUserId}`);
    
    // Clean up messages that are deleted by both users
    await Message.deleteMany({
      $and: [
        {
          $or: [
            { senderId: myId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: myId }
          ]
        },
        {
          $expr: { $eq: [{ $size: "$deletedBy" }, 2] } // Delete if both users deleted it
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