import cloudinary from "../lib/cloudinary.js";
import User from "../models/userModel.js";

export const getTypingStatus = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Fixed: Remove duplicate findById call
    const typingStatus = { showTypingMessage: user.showTypingMessage };
    return res.json(typingStatus);
  } catch (error) {
    console.log("Error in getTypingStatus:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateTypingStatus = async (req, res) => {
  const { value } = req.body;
  const userId = req.user._id;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.showTypingMessage = value;
    await user.save();
    return res.json(user);
  } catch (error) {
    console.log("Error in updateTypingStatus:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    const userId = req.user._id;

    console.log("🔄 Profile update request:", {
      userId,
      hasProfilePic: !!profilePic,
      profilePicLength: profilePic?.length || 0
    });

    if (!profilePic) {
      return res.status(400).json({ message: "Profile picture is required" });
    }

    // Validate base64 image format
    if (!profilePic.startsWith('data:image/')) {
      return res.status(400).json({ message: "Invalid image format" });
    }

    console.log("☁️ Uploading to Cloudinary...");
    
    // Upload to Cloudinary with better error handling
    const uploadResponse = await cloudinary.uploader.upload(profilePic, {
      folder: "profile-pictures-chat-app",
      resource_type: "image",
      transformation: [
        { width: 400, height: 400, crop: "fill" }, // Resize to 400x400
        { quality: "auto:good" } // Optimize quality
      ]
    });

    console.log("✅ Cloudinary upload successful:", uploadResponse.secure_url);

    // Update user in database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        profilePic: uploadResponse.secure_url,
      },
      {
        new: true,
        runValidators: true
      }
    ).select("-password"); // Don't return password

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("✅ Profile updated successfully");
    res.status(200).json(updatedUser);

  } catch (error) {
    console.error("❌ Error in updateProfile:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    // Handle specific Cloudinary errors
    if (error.message.includes('Invalid image file')) {
      return res.status(400).json({ 
        error: "Invalid image file. Please upload a valid image." 
      });
    }
    
    if (error.message.includes('File size too large')) {
      return res.status(400).json({ 
        error: "Image file is too large. Please upload a smaller image." 
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: "Validation error: " + error.message 
      });
    }

    res.status(500).json({ 
      error: "Failed to update profile. Please try again." 
    });
  }
};