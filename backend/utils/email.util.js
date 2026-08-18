import nodemailer from "nodemailer";

let cachedEtherealTransporter = null;

/**
 * Validates and logs server startup email environment readiness without exposing secret keys.
 */
export const validateEmailConfig = () => {
  const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REFRESH_TOKEN,
    GMAIL_USER,
    GMAIL_PASS,
    SMTP_HOST,
    SMTP_USER,
    SMTP_PASS,
  } = process.env;

  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_REFRESH_TOKEN) {
    console.log("📧 Email Service Mode: [Google OAuth 2.0 / Gmail API]");
  } else if (GMAIL_USER && GMAIL_PASS) {
    console.log(`📧 Email Service Mode: [Gmail App Password for ${GMAIL_USER}]`);
  } else if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    console.log(`📧 Email Service Mode: [Standard SMTP Host: ${SMTP_HOST}]`);
  } else if (SMTP_USER && SMTP_PASS && SMTP_USER.includes("@gmail.com")) {
    console.log(`📧 Email Service Mode: [Gmail App Password for ${SMTP_USER}]`);
  } else {
    console.warn("⚠️ [Email Service Warning] Production email credentials missing!");
    console.warn("   Neither Google OAuth 2.0 nor Gmail App Password nor custom SMTP is configured on Render.");
    console.warn("   Emails will fall back to Ethereal test SMTP (messages logged in console preview link).");
  }
};

/**
 * Creates a reusable Nodemailer transporter.
 * Supports:
 * 1. Google OAuth 2.0 (Gmail API)
 * 2. Gmail App Passwords (GMAIL_USER / GMAIL_PASS or SMTP_USER / SMTP_PASS)
 * 3. Custom SMTP (SendGrid, Mailgun, AWS SES, Custom Host)
 * 4. Ethereal Test Account fallback
 */
const getTransporter = async () => {
  const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REFRESH_TOKEN,
    GMAIL_USER,
    GMAIL_PASS,
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_FROM,
  } = process.env;

  // 1. Google OAuth 2.0 Transport — let Nodemailer manage token refresh natively
  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_REFRESH_TOKEN) {
    try {
      // Extract the authenticated sender email from SMTP_FROM env var
      let userEmail = GMAIL_USER || SMTP_USER || "";
      const rawFrom = SMTP_FROM || "";
      const match = rawFrom.match(/<([^>]+)>/);
      if (match) {
        userEmail = match[1];
      } else if (rawFrom.includes("@")) {
        userEmail = rawFrom.trim();
      }

      if (!userEmail) {
        throw new Error(
          "SMTP_FROM or GMAIL_USER must be set to the authenticated Gmail address."
        );
      }

      // Nodemailer handles access-token acquisition and refresh internally
      // when clientId, clientSecret, and refreshToken are provided.
      return nodemailer.createTransport({
        service: "gmail",
        auth: {
          type: "OAuth2",
          user: userEmail,
          clientId: GOOGLE_CLIENT_ID,
          clientSecret: GOOGLE_CLIENT_SECRET,
          refreshToken: GOOGLE_REFRESH_TOKEN,
        },
      });
    } catch (err) {
      console.error(
        "❌ [Email] Google OAuth 2.0 Transport Failure:",
        err.message || "Unable to configure Google OAuth 2.0 transport"
      );
      throw err;
    }
  }

  // 2. Direct Gmail App Password Transport
  const targetGmailUser = GMAIL_USER || (SMTP_USER && SMTP_USER.includes("@gmail.com") ? SMTP_USER : null);
  const targetGmailPass = GMAIL_PASS || (SMTP_PASS && !SMTP_HOST ? SMTP_PASS : null);

  if (targetGmailUser && targetGmailPass) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: targetGmailUser,
        pass: targetGmailPass,
      },
    });
  }

  // 3. Custom Standard SMTP Transport (SendGrid, Mailgun, AWS SES, etc.)
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT, 10) || 587,
      secure: parseInt(SMTP_PORT, 10) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }

  // 4. Fallback: Ethereal test transporter
  if (!cachedEtherealTransporter) {
    try {
      console.log("📧 Creating Ethereal test SMTP transporter fallback...");
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

    const fromAddress = process.env.SMTP_FROM || process.env.GMAIL_USER || process.env.SMTP_USER || '"URL Shortener" <noreply@urlshortener.com>';

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

    // Send email with a 30-second timeout (generous enough for cloud SMTP)
    const sendPromise = mailer.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Email dispatch timed out after 30s")), 30000)
    );

    const info = await Promise.race([sendPromise, timeoutPromise]);

    if (!process.env.GOOGLE_CLIENT_ID && !process.env.GMAIL_PASS && info && typeof nodemailer.getTestMessageUrl === "function") {
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
