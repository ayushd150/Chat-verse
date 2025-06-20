import express from "express";
import { protectRoute } from "../middleware/authMiddleware.js";
import { 
  getMessages, 
  getUsersForSidebar, 
  sendMessage, 
  clearAllMessages, 
  clearUserMessages,
  markMessagesAsRead  // Add this new controller
} from "../controllers/messageController.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);
router.put("/mark-read/:id", protectRoute, markMessagesAsRead); // Add this route
router.delete("/clear-all", protectRoute, clearAllMessages);
router.delete("/clear/:id", protectRoute, clearUserMessages);

export default router;