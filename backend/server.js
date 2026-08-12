import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import urlRoutes from "./routes/url.routes.js";
import authRoutes from "./routes/auth.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import errorHandler from "./middleware/errorHandler.middleware.js";

dotenv.config();

const app = express();

// --------------- Middleware ---------------
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
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

// Short-URL redirect (must stay at root for short URLs to work)
app.use("/", urlRoutes);

// --------------- Error Handler ---------------
app.use(errorHandler);

// --------------- Start ---------------
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});