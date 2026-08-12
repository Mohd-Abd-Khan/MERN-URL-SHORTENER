import crypto from "crypto";

/**
 * Generate a cryptographically secure 6-digit OTP.
 * Uses crypto.randomInt for uniform distribution (no modulo bias).
 * @returns {string} 6-digit zero-padded string
 */
export const generateOtp = () => {
  const otp = crypto.randomInt(100000, 999999);
  return otp.toString();
};

/**
 * Hash an OTP using SHA-256 for secure storage.
 * @param {string} otp
 * @returns {string} Hex-encoded SHA-256 hash
 */
export const hashOtp = (otp) => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};
