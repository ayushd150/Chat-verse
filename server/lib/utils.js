// server/lib/utils.js
import jwt from 'jsonwebtoken';

export const generateToken = (userId, res) => {
  console.log('🎫 === GENERATE TOKEN DEBUG ===');
  console.log('👤 User ID:', userId);
  console.log('🔑 JWT_SECRET exists:', !!process.env.JWT_SECRET);
  console.log('🔑 JWT_SECRET value:', process.env.JWT_SECRET);
  console.log('🌍 NODE_ENV:', process.env.NODE_ENV);
  
  if (!process.env.JWT_SECRET) {
    console.error('❌ JWT_SECRET is not defined!');
    throw new Error('JWT_SECRET is required');
  }
  
  try {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });
    
    console.log('🎫 Token generated successfully');
    console.log('🎫 Token preview:', token.substring(0, 20) + '...');

    const cookieOptions = {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
      sameSite: 'lax', // More permissive for development
      secure: false, // false for localhost development
      path: '/', // Ensure cookie is available for all paths
    };
    
    console.log('🍪 Setting cookie with options:', cookieOptions);
    
    res.cookie('token', token, cookieOptions);
    
    console.log('🍪 Cookie set successfully');
    console.log('📋 Response headers:', res.getHeaders());
    
    return token;
  } catch (error) {
    console.error('❌ Error generating token:', error);
    throw error;
  }
};