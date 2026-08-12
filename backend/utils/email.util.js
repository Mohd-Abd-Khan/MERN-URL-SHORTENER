import nodemailer from "nodemailer";
import { OAuth2Client } from "google-auth-library";

/**
 * Creates a reusable Nodemailer transporter using Google OAuth 2.0.
 * If Google OAuth credentials are not provided in environment variables,
 * falls back to Ethereal test SMTP for local development.
 */
const getTransporter = async () => {
  const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
    GOOGLE_REFRESH_TOKEN,
    SMTP_FROM,
  } = process.env;

  // If Google OAuth 2.0 configuration is provided, use OAuth2 for Gmail
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

      // Obtain a valid access token using the refresh token
      const accessTokenResponse = await oauth2Client.getAccessToken();
      const accessToken = accessTokenResponse?.token;

      if (!accessToken) {
        throw new Error("Failed to retrieve Google OAuth 2.0 access token.");
      }

      // Extract raw email address from SMTP_FROM if formatted like "Name <email@domain.com>"
      let userEmail = SMTP_FROM || "";
      const match = userEmail.match(/<([^>]+)>/);
      if (match) {
        userEmail = match[1];
      }

      const transporter = nodemailer.createTransport({
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

      return transporter;
    } catch (err) {
      console.error(
        "❌ Google OAuth 2.0 Authentication Failure:",
        err.message || "Unable to authenticate with Google OAuth 2.0"
      );
      throw new Error(
        "Email delivery service failure: Unable to authenticate via Google OAuth 2.0."
      );
    }
  }

  // Fallback: Ethereal test account for local development when Google OAuth credentials are absent
  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  console.log("📧 Google OAuth credentials missing. Falling back to Ethereal test SMTP.");
  console.log(`   Ethereal user: ${testAccount.user}`);

  return transporter;
};

/**
 * Sends a verification OTP email to the given address.
 * @param {string} to - Recipient email address
 * @param {string} otp - The 6-digit OTP (plaintext)
 * @param {string} name - User's name for personalization
 */
export const sendOtpEmail = async (to, otp, name) => {
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

  const info = await mailer.sendMail(mailOptions);

  if (!process.env.GOOGLE_CLIENT_ID) {
    console.log(`📧 Ethereal preview: ${nodemailer.getTestMessageUrl(info)}`);
  }

  return info;
};
