import express from "express";
import {
  createShortUrl,
  redirectToOriginal,
} from "../controllers/url.controller.js";
import optionalAuthMiddleware from "../middleware/optionalAuth.middleware.js";

const router = express.Router();

// POST /api/shortener — Create or retrieve a shortened URL
// optionalAuth: if user is logged in, their ID is attached to the created URL
router.post("/shortener", optionalAuthMiddleware, createShortUrl);

// GET /:shortId — Redirect to original URL
// NOTE: This route is mounted at root level in server.js, not under /api
router.get("/:shortId", redirectToOriginal);

export default router;
