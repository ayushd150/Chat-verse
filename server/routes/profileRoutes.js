import express from "express";
import { protectRoute } from "../middleware/authMiddleware.js";
import { updateProfile, getTypingStatus, updateTypingStatus } from "../controllers/profileController.js";

const router = express.Router();

router.get("/get-typing-status", protectRoute, getTypingStatus);
router.put("/update-preference", protectRoute, updateTypingStatus);
router.put("/update-profile", protectRoute, updateProfile);

export default router;