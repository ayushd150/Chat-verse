import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

export const protectRoute = async (req, res, next) => {
    try {
        console.log('🛡️  === AUTH MIDDLEWARE DEBUG ===');
        console.log('📍 Request URL:', req.originalUrl);
        console.log('🔧 Request method:', req.method);
        console.log('🌐 Origin:', req.headers.origin);
        console.log('🔑 Authorization header:', req.headers.authorization);
        console.log('🍪 Raw cookie header:', req.headers.cookie);
        console.log('🍪 Parsed cookies:', req.cookies);
        
        let token = null;
        
        // First, try to get token from Authorization header (Bearer token)
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
            console.log('🎫 Bearer token found:', token ? 'YES' : 'NO');
        }
        
        // Fallback to cookie-based authentication if no Bearer token
        if (!token && req.cookies.token) {
            token = req.cookies.token;
            console.log('🎫 Cookie token found as fallback:', token ? 'YES' : 'NO');
        }
        
        if (token) {
            console.log('🎫 Token preview:', token.substring(0, 20) + '...');
        }
        
        if (!token) {
            console.log('❌ No token found in Authorization header or cookies');
            return res.status(401).json({ message: "Unauthorized - No token provided" });
        }
        
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('✅ Token decoded successfully:', decoded.userId);
            
            const user = await User.findById(decoded.userId).select("-password");
            console.log('👤 User found in DB:', user ? `Yes (${user.email})` : 'No');

            if (!user) {
                console.log('❌ User not found in database');
                return res.status(401).json({ message: "Unauthorized - User not found" });
            }

            req.user = user;
            console.log('✅ Auth middleware passed successfully');
            next();
        } catch (jwtError) {
            console.log('❌ JWT verification failed:', jwtError.message);
            
            // Check if it's a token expiration error
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    message: "Unauthorized - Token expired",
                    expired: true 
                });
            }
            
            return res.status(401).json({ message: "Unauthorized - Invalid token" });
        }
        
    } catch (error) {
        console.log("❌ Error in protectRoute middleware:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}