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
    const { profilePic, fullName, email } = req.body;
    const userId = req.user._id;

    console.log("🔄 Profile update request:", {
      userId,
      hasProfilePic: !!profilePic,
      hasFullName: !!fullName,
      hasEmail: !!email,
      profilePicLength: profilePic?.length || 0
    });

    // Check if at least one field is provided
    if (!profilePic && !fullName && !email) {
      return res.status(400).json({ message: "At least one field is required to update" });
    }

    // Build update object
    const updateData = {};

    // Handle profile picture update
    if (profilePic) {
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
      updateData.profilePic = uploadResponse.secure_url;
    }

    // Handle name update
    if (fullName !== undefined) {
      if (!fullName.trim()) {
        return res.status(400).json({ message: "Full name cannot be empty" });
      }
      updateData.fullName = fullName.trim();
    }

    // Handle email update
    if (email !== undefined) {
      if (!email.trim()) {
        return res.status(400).json({ message: "Email cannot be empty" });
      }
      
      // Basic email validation
      const emailRegex = /\S+@\S+\.\S+/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Please enter a valid email" });
      }

      // Check if email already exists (excluding current user)
      const existingUser = await User.findOne({ 
        email: email.trim(), 
        _id: { $ne: userId } 
      });
      
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }

      updateData.email = email.trim();
    }

    console.log("📝 Updating user with data:", updateData);

    // Update user in database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
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
        message: "Invalid image file. Please upload a valid image." 
      });
    }
    
    if (error.message.includes('File size too large')) {
      return res.status(400).json({ 
        message: "Image file is too large. Please upload a smaller image." 
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Validation error: " + error.message 
      });
    }

    // Handle duplicate key error (email already exists)
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: "Email already in use" 
      });
    }

    res.status(500).json({ 
      message: "Failed to update profile. Please try again." 
    });
  }
};