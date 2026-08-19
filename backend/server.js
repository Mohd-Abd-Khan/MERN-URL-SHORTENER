import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import urlRoutes from "./routes/url.routes.js";
import authRoutes from "./routes/auth.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import errorHandler from "./middleware/errorHandler.middleware.js";
import { validateEmailConfig, verifySmtpConnection } from "./utils/email.util.js";

dotenv.config();

const app = express();

// --------------- Robust CORS Configuration ---------------
// Support single URLs, comma-separated URLs, or || separated URLs in env
const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(/[,|]+/)
  .map((url) => url.trim().replace(/\/$/, ""))
  .filter(Boolean);

// Include default local Vite ports in non-production or if FRONTEND_URL is empty
if (process.env.NODE_ENV !== "production" || allowedOrigins.length === 0) {
  allowedOrigins.push("http://localhost:5173", "http://127.0.0.1:5173");
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.replace(/\/$/, "");

      // Check if origin matches any allowed origin
      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      console.warn(
        `⚠️ CORS Blocked request from Origin: "${origin}". Allowed origins:`,
        allowedOrigins
      );
      return callback(
        new Error(`CORS Policy: Origin ${origin} is not allowed. Check FRONTEND_URL on backend.`)
      );
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.use(express.json());
app.use(cookieParser());

// --------------- Routes ---------------
// Auth API
app.use("/api/auth", authRoutes);

// Dashboard API
app.use("/api/dashboard", dashboardRoutes);

// URL shortener API (create)
app.use("/api", urlRoutes);

// Short-URL redirect (mounted at root for short URLs)
app.use("/", urlRoutes);

// --------------- Error Handler ---------------
app.use(errorHandler);

// --------------- Start Server ---------------
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Allowed CORS Origins:`, allowedOrigins);
    console.log(`🔗 Backend BASE_URL: ${process.env.BASE_URL || `http://localhost:${PORT}`}`);
    validateEmailConfig();
    await verifySmtpConnection();
  });
});