import express from "express";
import { getMyUrls } from "../controllers/dashboard.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

// GET /api/dashboard/my-urls — Protected: fetch user's created links
router.get("/my-urls", authMiddleware, getMyUrls);

export default router;
