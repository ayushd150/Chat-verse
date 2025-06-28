import express from "express";
import multer from "multer";
import path from "path";
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

// Configure multer for voice message uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/voice/'); // Make sure this directory exists
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
    // Accept audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed!'), false);
    }
  }
});

// Existing routes
router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);

// NEW: Voice message route
router.post("/send-voice/:id", protectRoute, voiceUpload.single('voice'), sendVoiceMessage);

router.put("/mark-read/:id", protectRoute, markMessagesAsRead);
router.delete("/clear-all", protectRoute, clearAllMessages);
router.delete("/clear/:id", protectRoute, clearUserMessages);

export default router;