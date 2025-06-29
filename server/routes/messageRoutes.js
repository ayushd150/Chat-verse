import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { protectRoute } from "../middleware/authMiddleware.js";
import { 
  getMessages, 
  getUsersForSidebar, 
  sendMessage, 
  sendVoiceMessage, // NEW: Voice message controller
  clearAllMessages, 
  clearUserMessages,
  markMessagesAsRead
} from "../controllers/messageController.js";

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = 'uploads/voice/';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads/voice/ directory');
}

// Configure multer for voice message uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/voice/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `voice-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const voiceUpload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('🎤 File filter - mimetype:', file.mimetype);
    // Accept audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed!'), false);
    }
  }
});

// Add error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
    }
    return res.status(400).json({ message: `Upload error: ${error.message}` });
  }
  if (error.message === 'Only audio files are allowed!') {
    return res.status(400).json({ message: 'Only audio files are allowed!' });
  }
  next(error);
};

// Existing routes
router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);

// FIXED: Voice message route with proper error handling
router.post("/send-voice/:id", protectRoute, (req, res, next) => {
  console.log('🎤 Voice message route hit for user:', req.params.id);
  console.log('🎤 Request headers:', req.headers);
  
  voiceUpload.single('voice')(req, res, (err) => {
    if (err) {
      console.error('🎤 Multer error:', err);
      return handleMulterError(err, req, res, next);
    }
    
    console.log('🎤 File uploaded successfully:', req.file);
    console.log('🎤 Request body:', req.body);
    
    // Call the voice message controller
    sendVoiceMessage(req, res, next);
  });
});

router.put("/mark-read/:id", protectRoute, markMessagesAsRead);
router.delete("/clear-all", protectRoute, clearAllMessages);
router.delete("/clear/:id", protectRoute, clearUserMessages);

export default router;