import { generateToken } from "../lib/utils.js";
import User from "../models/userModel.js";
import bcrypt from "bcryptjs";

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
    }
    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: "Email already exists" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({ fullName, email, password: hashedPassword });
    if (newUser) {
      generateToken(newUser._id, res);
      await newUser.save();
      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
      });
    } else {
      return res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("error in creating user", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const logout = (req, res) => {
  try {
    console.log('🚪 === LOGOUT DEBUG ===');
    
    // Clear cookie with SAME options as when setting it
    res.cookie("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 0, // Expire immediately
      path: '/', // Same path as when setting
    });
    
    console.log('✅ Cookie cleared successfully');
    res.status(200).json({ message: "Logged out successfully" });
    
  } catch (error) {
    console.log("❌ Error in logout:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("error in checkAuth", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
} 
// Add this debug version to your authController.js login function
// Replace your login function in authController.js
// TEMPORARY DEBUG: Add this to your backend authController.js login function
// This will help us verify if the token generation is working at all

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    console.log('🔐 === LOGIN ATTEMPT DEBUG ===');
    
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log('✅ Password matches, generating token...');
    
    // Generate token and set cookie
    const token = generateToken(user._id, res);
    
    console.log('🎫 Token returned from generateToken:', token ? 'YES' : 'NO');
    
    const responseData = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
      // TEMPORARY: Include token in response for debugging
      debug_token: token.substring(0, 20) + '...' // Only first 20 chars for security
    };
    
    console.log('📤 Sending response...');
    
    // Check if Set-Cookie header is being set
    const setCookieHeader = res.getHeader('Set-Cookie');
    console.log('🍪 Set-Cookie header:', setCookieHeader);
    
    res.status(200).json(responseData);
    
    console.log('✅ Login response sent');
    
  } catch (error) {
    console.log("❌ Error in login:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};