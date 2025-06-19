import express from 'express';
import { checkAuth, login, logout, signup } from '../controllers/authController.js';
import { protectRoute } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);

router.get("/check", protectRoute, checkAuth);

// Add the missing update profile route
// router.put('/update-profile', protectRoute, updateProfile);

export default router;