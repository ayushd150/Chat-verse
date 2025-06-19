import { generateToken } from "../lib/utils.js";
import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Helper function to generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET, 
    { expiresIn: "30d" }
  );
};

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    console.log('📝 === SIGNUP ATTEMPT DEBUG ===');
    console.log('👤 Full Name:', fullName);
    console.log('📧 Email:', email);
    console.log('🔒 Password length:', password?.length);

    // Validation
    if (!fullName || !email || !password) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      console.log('❌ Password too short');
      return res.status(400).json({ 
        error: "Password must be at least 6 characters long" 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('❌ Email already exists');
      return res.status(400).json({ error: "Email already exists" });
    }

    console.log('🔐 Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    console.log('💾 Creating new user...');
    const newUser = new User({ 
      fullName, 
      email, 
      password: hashedPassword 
    });
    
    // Save user to database
    await newUser.save();
    console.log('✅ User saved to database');

    // Generate tokens
    console.log('🎫 Generating tokens...');
    const accessToken = generateToken(newUser._id, res);
    const refreshToken = generateRefreshToken(newUser._id);
    
    console.log('✅ Tokens generated successfully');

    // Note: generateToken already sets the cookie, so we don't need to set it here

    const responseData = {
      _id: newUser._id,
      fullName: newUser.fullName,
      email: newUser.email,
      profilePic: newUser.profilePic,
      accessToken,
      refreshToken,
      user: {
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
      }
    };

    console.log('📤 Sending signup response');
    res.status(201).json(responseData);

  } catch (error) {
    console.log("❌ Error in signup:", error.message);
    console.error("Full error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const login = async (req, res) => {
  const { email, password, rememberMe } = req.body;
  try {
    console.log('🔐 === LOGIN ATTEMPT DEBUG ===');
    console.log('📧 Email:', email);
    console.log('🧠 Remember Me:', rememberMe);
    
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

    console.log('✅ Password matches, generating tokens...');
    
    // Generate tokens
    const accessToken = generateToken(user._id, res);
    const refreshToken = generateRefreshToken(user._id);
    
    console.log('🎫 Access token generated:', accessToken ? 'YES' : 'NO');
    console.log('🔄 Refresh token generated:', refreshToken ? 'YES' : 'NO');
    
    // Note: generateToken already sets the cookie, so we don't need to set it here
    
    const responseData = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
      accessToken,
      refreshToken,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        profilePic: user.profilePic,
      }
    };
    
    console.log('📤 Sending login response with tokens');
    res.status(200).json(responseData);
    
  } catch (error) {
    console.log("❌ Error in login:", error.message);
    console.error("Full error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const logout = async (req, res) => {
  try {
    console.log('🚪 === LOGOUT DEBUG ===');
    
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      console.log('🔄 Refresh token provided for logout');
      // Here you could add logic to blacklist the refresh token
    }
    
    // Clear cookie
    res.cookie("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
      path: '/',
    });
    
    console.log('✅ Logout successful');
    res.status(200).json({ message: "Logged out successfully" });
    
  } catch (error) {
    console.log("❌ Error in logout:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const refreshToken = async (req, res) => {
  try {
    console.log('🔄 === REFRESH TOKEN ATTEMPT ===');
    
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token required" });
    }
    
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    console.log('✅ Refresh token decoded:', decoded.userId);
    
    const user = await User.findById(decoded.userId).select("-password");
    
    if (!user) {
      console.log('❌ User not found for refresh token');
      return res.status(401).json({ message: "Invalid refresh token" });
    }
    
    // Generate new tokens
    const newAccessToken = generateToken(user._id, res);
    const newRefreshToken = generateRefreshToken(user._id);
    
    console.log('✅ New tokens generated successfully');
    
    // Note: generateToken already sets the cookie, so we don't need to set it here
    
    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        profilePic: user.profilePic,
      }
    });
    
  } catch (error) {
    console.log("❌ Error in refresh token:", error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Refresh token expired" });
    }
    
    res.status(401).json({ message: "Invalid refresh token" });
  }
};

export const checkAuth = (req, res) => {
  try {
    console.log('🔍 === CHECK AUTH ===');
    console.log('👤 User found:', req.user ? req.user.email : 'No user');
    
    res.status(200).json({
      user: {
        _id: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email,
        profilePic: req.user.profilePic,
      }
    });
  } catch (error) {
    console.log("❌ Error in checkAuth:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// export const updateProfile = async (req, res) => {
//   try {
//     const { fullName, profilePic } = req.body;
//     const userId = req.user._id;
    
//     // Log what we received for debugging
//     console.log('📝 Profile update request:', { fullName, profilePic: profilePic ? 'Image provided' : 'No image' });
    
//     if (!fullName) {
//       return res.status(400).json({ message: "Full name is required" });
//     }
    
//     // Only update fullName and profilePic - NEVER email for security
//     const updateFields = { fullName };
//     if (profilePic) {
//       updateFields.profilePic = profilePic;
//     }
    
//     const updatedUser = await User.findByIdAndUpdate(
//       userId,
//       updateFields,
//       { new: true }
//     ).select("-password");
    
//     if (!updatedUser) {
//       return res.status(404).json({ message: "User not found" });
//     }
    
//     console.log('✅ Profile updated successfully');
    
//     res.status(200).json({
//       success: true,
//       user: {
//         _id: updatedUser._id,
//         fullName: updatedUser.fullName,
//         email: updatedUser.email,
//         profilePic: updatedUser.profilePic,
//       }
//     });
//   } catch (error) {
//     console.log("❌ Error in updateProfile:", error.message);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };