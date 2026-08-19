import nodemailer from "nodemailer";

/**
 * Validates and logs server startup SMTP environment readiness without exposing secrets.
 */
export const validateEmailConfig = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
    console.log("📧 Email Service Mode: [Gmail SMTP]");
    console.log(`📧 SMTP Host: ${SMTP_HOST}`);
    console.log(`📧 SMTP Port: ${SMTP_PORT}`);
    console.log(`📧 SMTP User: ${SMTP_USER}`);
  } else {
    console.error("❌ SMTP email configuration is incomplete.");
    console.error("   Required environment variables: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS");
  }
};

/**
 * Creates and returns a configured Nodemailer SMTP transporter.
 * Uses STARTTLS on port 587 (or SSL on port 465).
 */
export const getTransporter = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error("SMTP email configuration is incomplete");
  }

  const port = Number(SMTP_PORT) || 587;

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
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

