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
 * Configured with secure: true and sameSite: 'none' in production / cloud environments.
 */
const setRefreshCookie = (res, token) => {
  const maxAgeDays = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS, 10) || 7;
  const isProd = process.env.NODE_ENV === "production" || Boolean(process.env.RENDER);

  res.cookie(REFRESH_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/api/auth",
    maxAge: maxAgeDays * 24 * 60 * 60 * 1000,
  });
};

/**
 * Helper — clears the refresh token cookie.
 */
const clearRefreshCookie = (res) => {
  const isProd = process.env.NODE_ENV === "production" || Boolean(process.env.RENDER);

  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
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
    console.log(`📝 [Auth] Registration request received for: ${email || "unknown"}`);

    if (!name || !email || !password) {
      console.warn(`⚠️ [Auth] Registration failed: Missing required fields`);
      return res
        .status(400)
        .json({ error: "Name, email, and password are required" });
    }

    if (password.length < 8) {
      console.warn(`⚠️ [Auth] Registration failed: Password too short for ${email}`);
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check existing user — give generic message to avoid email enumeration
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      if (existingUser.isVerified) {
        console.log(`ℹ️ [Auth] Registration rejected: Email already verified: ${normalizedEmail}`);
        return res
          .status(409)
          .json({ error: "An account with this email already exists. Please log in." });
      }

      // If unverified, regenerate OTP and resend
      console.log(`🔄 [Auth] User exists but unverified. Regenerating OTP for: ${normalizedEmail}`);
      const otp = generateOtp();
      existingUser.otpHash = hashOtp(otp);
      existingUser.otpExpiresAt = new Date(
        Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
      );
      existingUser.otpAttempts = 0;
      existingUser.passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
      existingUser.name = name.trim();
      await existingUser.save();

      // Await email delivery — block response until we know if it succeeded
      try {
        await sendOtpEmail(existingUser.email, otp, existingUser.name);
        console.log(`📧 [Auth] OTP email dispatched successfully to: ${normalizedEmail}`);
        return res.status(200).json({ message: "Verification code sent to your email" });
      } catch (mailErr) {
        console.error(`❌ [Auth] Failed to send OTP email to ${normalizedEmail}:`, mailErr.message || mailErr);
        return res.status(503).json({ error: "Unable to send verification email. Please try again." });
      }
    }

    // Create new user
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    const otp = generateOtp();

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      otpHash: hashOtp(otp),
      otpExpiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
      otpAttempts: 0,
    });

    console.log(`✅ [Auth] New user created in database: ${normalizedEmail}`);

    // Await email delivery — block response until we know if it succeeded
    try {
      await sendOtpEmail(user.email, otp, user.name);
      console.log(`📧 [Auth] OTP email dispatched successfully to: ${normalizedEmail}`);
      return res.status(201).json({ message: "Verification code sent to your email" });
    } catch (mailErr) {
      console.error(`❌ [Auth] Failed to send OTP email to ${normalizedEmail}:`, mailErr.message || mailErr);
      return res.status(503).json({ error: "Unable to send verification email. Please try again." });
    }
  } catch (error) {
    console.error("❌ [Auth] Registration Error:", error.message || error);
    next(error);
  }
};

// ─────────────────────────────────────────────
//  POST /api/auth/verify-otp
// ─────────────────────────────────────────────
export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    console.log(`🔐 [Auth] OTP verification attempt for: ${email || "unknown"}`);

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !user.otpHash) {
      console.warn(`⚠️ [Auth] Verification failed: User or OTP not found for ${email}`);
      return res.status(400).json({ error: "Invalid or expired verification code" });
    }

    // Check expiry
    if (user.otpExpiresAt < new Date()) {
      console.warn(`⚠️ [Auth] Verification failed: Expired OTP for ${email}`);
      user.otpHash = null;
      user.otpExpiresAt = null;
      user.otpAttempts = 0;
      await user.save();
      return res.status(400).json({ error: "Invalid or expired verification code" });
    }

    // Check max attempts
    if (user.otpAttempts >= OTP_MAX_ATTEMPTS) {
      console.warn(`⚠️ [Auth] Verification failed: Too many attempts for ${email}`);
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
      console.warn(`⚠️ [Auth] Incorrect OTP code entered for ${email}`);
      return res.status(400).json({ error: "Invalid or expired verification code" });
    }

    // Success — mark verified, clear OTP fields
    user.isVerified = true;
    user.otpHash = null;
    user.otpExpiresAt = null;
    user.otpAttempts = 0;
    await user.save();

    console.log(`✅ [Auth] Email verified successfully for: ${email}`);
    return res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("❌ [Auth] Verify OTP Error:", error.message || error);
    next(error);
  }
};

// ─────────────────────────────────────────────
//  POST /api/auth/login
// ─────────────────────────────────────────────
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log(`🔑 [Auth] Login request for: ${email || "unknown"}`);

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.warn(`⚠️ [Auth] Login failed: User not found: ${email}`);
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      console.warn(`⚠️ [Auth] Login failed: Incorrect password for: ${email}`);
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!user.isVerified) {
      console.warn(`⚠️ [Auth] Login failed: Email unverified for: ${email}`);
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

    console.log(`✅ [Auth] Login successful for: ${email}`);
    return res.status(200).json({
      accessToken,
      user: user.toSafeJSON(),
    });
  } catch (error) {
    console.error("❌ [Auth] Login Error:", error.message || error);
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
      return res.status(200).json({ accessToken: null, user: null });
    }

    const tokenHash = hashToken(rawToken);
    const session = await Session.findOne({ refreshTokenHash: tokenHash });

    if (!session) {
      clearRefreshCookie(res);
      return res.status(200).json({ accessToken: null, user: null });
    }

    if (session.expiresAt < new Date()) {
      await Session.deleteOne({ _id: session._id });
      clearRefreshCookie(res);
      return res.status(200).json({ accessToken: null, user: null });
    }

    // Rotate: delete old session
    const userId = session.userId;
    await Session.deleteOne({ _id: session._id });

    // Verify user still exists
    const user = await User.findById(userId);
    if (!user) {
      clearRefreshCookie(res);
      return res.status(200).json({ accessToken: null, user: null });
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

// ─────────────────────────────────────────────
//  POST /api/auth/resend-otp
// ─────────────────────────────────────────────
export const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    console.log(`🔄 [Auth] Resend OTP request for: ${email || "unknown"}`);

    if (!email) {
      return res.status(400).json({ error: "Email address is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(200).json({ message: "If this email is registered, a new code has been sent" });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: "This email address is already verified. Please log in." });
    }

    // Generate new 6-digit OTP
    const otp = generateOtp();
    user.otpHash = hashOtp(otp);
    user.otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    user.otpAttempts = 0;
    await user.save();

    // Await email delivery — block response until we know if it succeeded
    try {
      await sendOtpEmail(user.email, otp, user.name);
      console.log(`📧 [Auth] Resent OTP email successfully to: ${normalizedEmail}`);
      return res.status(200).json({ message: "A new 6-digit verification code has been sent to your email" });
    } catch (mailErr) {
      console.error(`❌ [Auth] Resend OTP email failed for ${normalizedEmail}:`, mailErr.message || mailErr);
      return res.status(503).json({ error: "Unable to send verification email. Please try again." });
    }
  } catch (error) {
    console.error("❌ [Auth] Resend OTP Error:", error.message || error);
    next(error);
  }
};
