import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
  console.log('🎫 === GENERATE TOKEN DEBUG ===');
  console.log('👤 User ID:', userId);
  console.log('🔑 JWT_SECRET exists:', !!process.env.JWT_SECRET);
  console.log('🌍 NODE_ENV:', process.env.NODE_ENV);
  
  try {
    // Generate the JWT token
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });
    
    console.log('✅ JWT token generated successfully');
    console.log('🎫 Token preview:', token.substring(0, 20) + '...');
    
    // Set cookie with proper options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
      path: '/', // Explicitly set path
    };
    
    console.log('🍪 Setting cookie with options:', cookieOptions);
    
    res.cookie("token", token, cookieOptions);
    
    console.log('✅ Cookie set successfully');
    
    // Verify the Set-Cookie header was set
    const setCookieHeader = res.getHeader('Set-Cookie');
    console.log('📋 Set-Cookie header:', setCookieHeader);
    
    return token;
    
  } catch (error) {
    console.log('❌ Error generating token:', error.message);
    throw error;
  }
};

export const generateRefreshToken = (userId) => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET environment variable is not set");
    }
    
    return jwt.sign(
      { userId }, 
      process.env.JWT_SECRET, 
      { expiresIn: "30d" }
    );
  } catch (error) {
    console.error("Error generating refresh token:", error.message);
    throw error;
  }
};