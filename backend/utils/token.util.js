import jwt from "jsonwebtoken";
import crypto from "crypto";

/**
 * Generate a short-lived JWT access token.
 * @param {{ id: string, email: string }} payload
 * @returns {string} Signed JWT
 */
export const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
  });
};

/**
 * Verify and decode a JWT access token.
 * @param {string} token
 * @returns {object} Decoded payload
 * @throws {jwt.JsonWebTokenError | jwt.TokenExpiredError}
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Generate a cryptographically random refresh token (opaque string).
 * @returns {string} 80-character hex string
 */
export const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString("hex");
};

/**
 * Create a SHA-256 hash of a token string.
 * Used for storing refresh tokens and OTPs — never store the raw value.
 * @param {string} token
 * @returns {string} Hex-encoded SHA-256 hash
 */
export const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};
