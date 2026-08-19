import dns from "node:dns";
import nodemailer from "nodemailer";

// Force Node.js to prefer IPv4 over IPv6 in DNS lookups.
// This prevents ENETUNREACH errors on cloud platforms like Render, AWS, etc.
// where outbound IPv6 networking is disabled or unrouted.
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

/**
 * Validates and logs server startup SMTP environment readiness without exposing secrets.
 */
export const validateEmailConfig = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SERVICE } = process.env;

  if (SMTP_USER && SMTP_PASS && (SMTP_HOST || SMTP_SERVICE)) {
    console.log(`📧 Email Service Mode: [${SMTP_SERVICE || "SMTP"}]`);
    console.log(`📧 SMTP Host: ${SMTP_HOST || (SMTP_SERVICE === "gmail" ? "Gmail Service" : "smtp.gmail.com")}`);
    console.log(`📧 SMTP Port: ${SMTP_PORT || 587}`);
    console.log(`📧 SMTP User: ${SMTP_USER}`);
  } else {
    console.error("❌ SMTP email configuration is incomplete.");
    console.error("   Required environment variables: SMTP_USER, SMTP_PASS, and (SMTP_HOST or SMTP_SERVICE)");
  }
};

/**
 * Creates and returns a configured Nodemailer SMTP transporter.
 * Supports standard SMTP (port 587 / 465) and built-in service mode (e.g. Gmail).
 */
export const getTransporter = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SERVICE } = process.env;

  if (!SMTP_USER || !SMTP_PASS) {
    throw new Error("SMTP email configuration is incomplete. Missing SMTP_USER or SMTP_PASS.");
  }

  const port = Number(SMTP_PORT) || 587;

  // Base options with robust timeouts
  const transportOptions = {
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  };

  if (SMTP_SERVICE) {
    transportOptions.service = SMTP_SERVICE;
  } else {
    transportOptions.host = SMTP_HOST || "smtp.gmail.com";
    transportOptions.port = port;
    transportOptions.secure = port === 465;
    transportOptions.tls = {
      rejectUnauthorized: false,
    };
  }

  return nodemailer.createTransport(transportOptions);
};

/**
 * Verifies the SMTP connection on startup.
 * Logs status clearly without crashing the server or exposing secrets.
 */
export const verifySmtpConnection = async () => {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    console.log("📧 [Email] SMTP connection verified successfully");
    return true;
  } catch (error) {
    console.error("❌ [Email] SMTP connection verification failed:", error.message || error);
    return false;
  }
};

/**
 * Sends a verification OTP email using standard SMTP.
 * @param {string} to - Recipient email address
 * @param {string} otp - The 6-digit OTP (plaintext)
 * @param {string} name - User's name for personalization
 */
export const sendOtpEmail = async (to, otp, name) => {
  try {
    const transporter = getTransporter();

    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;

    const mailOptions = {
      from: fromAddress,
      to,
      subject: "Verify Your Email — URL Shortener",
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #1a1a2e; color: #e0e0e0; border-radius: 12px;">
          <h2 style="color: #ffffff; margin-bottom: 8px;">Welcome, ${name}!</h2>
          <p style="margin-bottom: 24px; color: #b0b0b0;">Use the verification code below to complete your registration:</p>
          <div style="background: #16213e; padding: 20px; text-align: center; border-radius: 8px; border: 1px solid #0f3460;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #e94560;">${otp}</span>
          </div>
          <p style="margin-top: 24px; font-size: 13px; color: #888;">This code expires in <strong>10 minutes</strong>. If you didn't request this, ignore this email.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 [Email] OTP email sent successfully to: ${to}`);
    return info;
  } catch (error) {
    console.error(`❌ [Email Dispatch Error] Failed sending OTP to ${to}:`, error.message || error);
    throw error;
  }
};

