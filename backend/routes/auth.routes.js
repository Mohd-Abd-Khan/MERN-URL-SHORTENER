import express from "express";
import {
  register,
  verifyOtp,
  resendOtp,
  login,
  refresh,
  logout,
  getMe,
} from "../controllers/auth.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);

// Protected routes
router.get("/me", authMiddleware, getMe);

export default router;
