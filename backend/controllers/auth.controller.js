import bcrypt from "bcrypt";
import User from "../models/User.js";
import Session from "../models/Session.js";
import { generateOtp, hashOtp } from "../utils/otp.util.js";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} from "../utils/token.util.js";
import { sendOtpEmail } from "../utils/email.util.js";

const BCRYPT_SALT_ROUNDS = 12;
const OTP_EXPIRY_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const REFRESH_TOKEN_COOKIE = "refreshToken";

/**
 * Helper — sets the refresh token cookie on the response.
 */
const setRefreshCookie = (res, token) => {
  const maxAgeDays = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS, 10) || 7;

  res.cookie(REFRESH_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/api/auth",
    maxAge: maxAgeDays * 24 * 60 * 60 * 1000,
  });
};

/**
 * Helper — clears the refresh token cookie.
 */
const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/api/auth",
  });
};

/**
 * Helper — creates a session and returns the raw refresh token.
 */
const createSession = async (userId, req) => {
  const rawRefreshToken = generateRefreshToken();
  const refreshTokenHash = hashToken(rawRefreshToken);
  const maxAgeDays = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS, 10) || 7;

  await Session.create({
    userId,
    refreshTokenHash,
    expiresAt: new Date(Date.now() + maxAgeDays * 24 * 60 * 60 * 1000),
    userAgent: req.headers["user-agent"] || "",
    ipAddress: req.ip || "",
  });

  return rawRefreshToken;
};

// ─────────────────────────────────────────────
//  POST /api/auth/register
// ─────────────────────────────────────────────
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email, and password are required" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });
    }

    // Check existing user — give generic message to avoid email enumeration
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      // If already verified, generic message
      if (existingUser.isVerified) {
        return res
          .status(200)
          .json({ message: "If this email is valid, a verification code has been sent" });
      }

      // If unverified, regenerate OTP and resend
      const otp = generateOtp();
      existingUser.otpHash = hashOtp(otp);
      existingUser.otpExpiresAt = new Date(
        Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
      );
      existingUser.otpAttempts = 0;
      existingUser.passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
      existingUser.name = name.trim();
      await existingUser.save();

      await sendOtpEmail(existingUser.email, otp, existingUser.name);
      return res.status(200).json({
        message: "If this email is valid, a verification code has been sent",
      });
    }

    // Create new user
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    const otp = generateOtp();

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      otpHash: hashOtp(otp),
      otpExpiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
      otpAttempts: 0,
    });

    await sendOtpEmail(user.email, otp, user.name);

    return res.status(201).json({
      message: "If this email is valid, a verification code has been sent",
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  POST /api/auth/verify-otp
// ─────────────────────────────────────────────
export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Generic error — don't reveal if user exists
    if (!user || !user.otpHash) {
      return res.status(400).json({ error: "Invalid or expired verification code" });
    }

    // Check expiry
    if (user.otpExpiresAt < new Date()) {
      user.otpHash = null;
      user.otpExpiresAt = null;
      user.otpAttempts = 0;
      await user.save();
      return res.status(400).json({ error: "Invalid or expired verification code" });
    }

    // Check max attempts
    if (user.otpAttempts >= OTP_MAX_ATTEMPTS) {
      user.otpHash = null;
      user.otpExpiresAt = null;
      user.otpAttempts = 0;
      await user.save();
      return res.status(429).json({
        error: "Too many attempts. Please request a new verification code",
      });
    }

    // Compare hashed OTP
    const submittedHash = hashOtp(otp);
    if (submittedHash !== user.otpHash) {
      user.otpAttempts += 1;
      await user.save();
      return res.status(400).json({ error: "Invalid or expired verification code" });
    }

    // Success — mark verified, clear OTP fields
    user.isVerified = true;
    user.otpHash = null;
    user.otpExpiresAt = null;
    user.otpAttempts = 0;
    await user.save();

    return res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  POST /api/auth/login
// ─────────────────────────────────────────────
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Generic error — don't reveal if user exists
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        error: "Please verify your email before logging in",
        needsVerification: true,
      });
    }

    // Issue access token
    const accessToken = generateAccessToken({
      id: user._id.toString(),
      email: user.email,
    });

    // Create session + set refresh cookie
    const rawRefreshToken = await createSession(user._id, req);
    setRefreshCookie(res, rawRefreshToken);

    return res.status(200).json({
      accessToken,
      user: user.toSafeJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  POST /api/auth/refresh
// ─────────────────────────────────────────────
export const refresh = async (req, res, next) => {
  try {
    const rawToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

    if (!rawToken) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const tokenHash = hashToken(rawToken);
    const session = await Session.findOne({ refreshTokenHash: tokenHash });

    if (!session) {
      // Token not found — possibly replayed / already rotated
      clearRefreshCookie(res);
      return res.status(401).json({ error: "Authentication required" });
    }

    if (session.expiresAt < new Date()) {
      await Session.deleteOne({ _id: session._id });
      clearRefreshCookie(res);
      return res.status(401).json({ error: "Authentication required" });
    }

    // Rotate: delete old session
    const userId = session.userId;
    await Session.deleteOne({ _id: session._id });

    // Verify user still exists
    const user = await User.findById(userId);
    if (!user) {
      clearRefreshCookie(res);
      return res.status(401).json({ error: "Authentication required" });
    }

    // Create new session + issue new tokens
    const newRawRefreshToken = await createSession(userId, req);
    setRefreshCookie(res, newRawRefreshToken);

    const accessToken = generateAccessToken({
      id: user._id.toString(),
      email: user.email,
    });

    return res.status(200).json({
      accessToken,
      user: user.toSafeJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  POST /api/auth/logout
// ─────────────────────────────────────────────
export const logout = async (req, res, next) => {
  try {
    const rawToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

    if (rawToken) {
      const tokenHash = hashToken(rawToken);
      await Session.deleteOne({ refreshTokenHash: tokenHash });
    }

    clearRefreshCookie(res);
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  GET /api/auth/me
// ─────────────────────────────────────────────
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({ user: user.toSafeJSON() });
  } catch (error) {
    next(error);
  }
};
