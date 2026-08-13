import nodemailer from "nodemailer";
import { OAuth2Client } from "google-auth-library";

let cachedEtherealTransporter = null;

/**
 * Creates a reusable Nodemailer transporter.
 * Uses Google OAuth 2.0 if configured in environment variables.
 * Falls back to a cached Ethereal test account or dummy transporter for local development.
 */
const getTransporter = async () => {
  const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
    GOOGLE_REFRESH_TOKEN,
    SMTP_FROM,
  } = process.env;

  // If Google OAuth 2.0 credentials are present, use OAuth2 for Gmail
  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_REFRESH_TOKEN) {
    try {
      const redirectUri =
        GOOGLE_REDIRECT_URI || "https://developers.google.com/oauthplayground";

      const oauth2Client = new OAuth2Client(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        redirectUri
      );

      oauth2Client.setCredentials({
        refresh_token: GOOGLE_REFRESH_TOKEN,
      });

      // Obtain a valid access token with a 5-second timeout guard
      const accessTokenPromise = oauth2Client.getAccessToken();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Google OAuth token request timed out (5s)")), 5000)
      );

      const accessTokenResponse = await Promise.race([accessTokenPromise, timeoutPromise]);
      const accessToken = accessTokenResponse?.token;

      if (!accessToken) {
        throw new Error("Failed to retrieve Google OAuth 2.0 access token.");
      }

      // Extract raw email address from SMTP_FROM
      let userEmail = SMTP_FROM || "";
      const match = userEmail.match(/<([^>]+)>/);
      if (match) {
        userEmail = match[1];
      }

      return nodemailer.createTransport({
        service: "gmail",
        auth: {
          type: "OAuth2",
          user: userEmail,
          clientId: GOOGLE_CLIENT_ID,
          clientSecret: GOOGLE_CLIENT_SECRET,
          refreshToken: GOOGLE_REFRESH_TOKEN,
          accessToken: accessToken,
        },
      });
    } catch (err) {
      console.error(
        "❌ [Email] Google OAuth 2.0 Failure:",
        err.message || "Unable to authenticate with Google OAuth 2.0"
      );
      throw err;
    }
  }

  // Fallback: Re-use cached Ethereal test transporter to avoid repeated network calls
  if (!cachedEtherealTransporter) {
    try {
      console.log("📧 Google OAuth credentials missing/incomplete. Creating Ethereal test SMTP transporter...");
      const testAccount = await nodemailer.createTestAccount();
      cachedEtherealTransporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`📧 Ethereal test SMTP initialized for user: ${testAccount.user}`);
    } catch (etherealErr) {
      console.warn("⚠️ Failed to create Ethereal test account:", etherealErr.message);
      // Failover JSON console transporter if Ethereal network fails
      cachedEtherealTransporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    }
  }

  return cachedEtherealTransporter;
};

/**
 * Sends a verification OTP email with a 10-second timeout guard.
 * @param {string} to - Recipient email address
 * @param {string} otp - The 6-digit OTP (plaintext)
 * @param {string} name - User's name for personalization
 */
export const sendOtpEmail = async (to, otp, name) => {
  try {
    const mailer = await getTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM || '"URL Shortener" <noreply@urlshortener.com>',
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

    // Send email with a 10-second timeout
    const sendPromise = mailer.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Email dispatch timed out after 10s")), 10000)
    );

    const info = await Promise.race([sendPromise, timeoutPromise]);

    if (!process.env.GOOGLE_CLIENT_ID && info && typeof nodemailer.getTestMessageUrl === "function") {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`📧 Ethereal Preview URL: ${previewUrl}`);
      }
    }

    return info;
  } catch (error) {
    console.error(`❌ [Email Dispatch Error] Failed sending OTP to ${to}:`, error.message || error);
    throw error;
  }
};
