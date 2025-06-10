import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

export const protectRoute = async (req, res, next) => {
    try {
        console.log('🛡️  === AUTH MIDDLEWARE DEBUG ===');
        console.log('📍 Request URL:', req.originalUrl);
        console.log('🔧 Request method:', req.method);
        console.log('🌐 Origin:', req.headers.origin);
        console.log('🍪 Raw cookie header:', req.headers.cookie);
        console.log('🍪 Parsed cookies:', req.cookies);
        console.log('📋 All headers:', JSON.stringify(req.headers, null, 2));
        
        const token = req.cookies.token;
        
        console.log('🎫 Token found:', token ? 'YES' : 'NO');
        if (token) {
            console.log('🎫 Token preview:', token.substring(0, 20) + '...');
        }
        
        if (!token) {
            return res.status(401).json({ message: "Unauthorized - token required" });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decoded successfully:', decoded ? 'Yes' : 'No');
        
        if(!decoded) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        
        const user = await User.findById(decoded.userId).select("-password");
        console.log('User found in DB:', user ? 'Yes' : 'No');

        if(!user) {
            return res.status(401).json({ message: "User not found" });
        }

        req.user = user;
        next();
    } catch (error) {
        console.log("Error in protectRoute:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}