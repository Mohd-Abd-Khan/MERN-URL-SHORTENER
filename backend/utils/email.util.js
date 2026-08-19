/**
 * Brevo Transactional Email Service (HTTP REST API over HTTPS :443)
 * Replaces legacy SMTP / Nodemailer with direct, firewall-friendly HTTPS calls.
 * 100% compatible with Render Free Tier, AWS, and serverless environments.
 */

/**
 * Validates and logs server startup email environment readiness.
 * Never logs the actual BREVO_API_KEY or sensitive credentials.
 */
export const validateEmailConfig = () => {
  const { BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME } = process.env;

  let isValid = true;

  if (!BREVO_API_KEY) {
    console.error("❌ [Email Config] BREVO_API_KEY is missing in environment variables.");
    isValid = false;
  }

  if (!BREVO_SENDER_EMAIL) {
    console.error("❌ [Email Config] BREVO_SENDER_EMAIL is missing in environment variables.");
    isValid = false;
  }

  if (isValid) {
    console.log("📧 Email Service Mode: [Brevo HTTP API]");
    console.log(`📧 Brevo Sender: ${BREVO_SENDER_EMAIL} (${BREVO_SENDER_NAME || "URL Shortener"})`);
  } else {
    console.warn("⚠️ [Email Config] OTP emails will fail until required Brevo environment variables are configured.");
  }

  return isValid;
};

/**
 * Sends a 6-digit verification OTP email using Brevo's official HTTP REST API.
 * 
 * @param {string} to - Recipient email address
 * @param {string} otp - 6-digit numeric OTP code
 * @param {string} name - Recipient's display name
 * @returns {Promise<object>} Brevo API response object { messageId }
 * @throws {Error} If network, authentication, or validation fails
 */
export const sendOtpEmail = async (to, otp, name = "User") => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || "URL Shortener";

  if (!apiKey || !senderEmail) {
    const missingVar = !apiKey ? "BREVO_API_KEY" : "BREVO_SENDER_EMAIL";
    console.error(`❌ [Brevo API Error] Cannot send email: ${missingVar} is not configured.`);
    throw new Error(`Email delivery service configuration error: ${missingVar} is missing.`);
  }

  const subject = "Verify Your Email — URL Shortener";
  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0f172a; color: #f8fafc; border-radius: 16px; border: 1px solid #1e293b;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #6366f1; font-size: 24px; font-weight: 800; margin: 0 0 8px 0; letter-spacing: -0.5px;">URL Shortener</h1>
        <p style="color: #94a3b8; font-size: 14px; margin: 0;">Account Email Verification</p>
      </div>
      
      <div style="background: #1e293b; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #334155;">
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #e2e8f0; line-height: 1.5;">
          Hello <strong style="color: #ffffff;">${name}</strong>,
        </p>
        <p style="margin: 0 0 20px 0; font-size: 14px; color: #94a3b8; line-height: 1.5;">
          Thank you for registering. Please enter the verification code below to confirm your email and activate your account:
        </p>
        
        <div style="background: #090d16; padding: 20px; text-align: center; border-radius: 8px; border: 1px dashed #6366f1;">
          <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #818cf8; display: inline-block; padding-left: 10px;">${otp}</span>
        </div>
        
        <p style="margin: 20px 0 0 0; font-size: 13px; color: #64748b; text-align: center;">
          ⏱️ This code will expire in <strong style="color: #f1f5f9;">10 minutes</strong>.
        </p>
      </div>

      <div style="text-align: center; border-top: 1px solid #1e293b; padding-top: 16px;">
        <p style="font-size: 12px; color: #475569; margin: 0;">
          If you did not request this verification code, you can safely disregard this message.
        </p>
      </div>
    </div>
  `;

  const payload = {
    sender: {
      name: senderName,
      email: senderEmail,
    },
    to: [
      {
        email: to,
        name: name || "User",
      },
    ],
    subject,
    htmlContent,
  };

  let response;
  try {
    response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (networkError) {
    console.error("❌ [Brevo Network Error] Failed to connect to Brevo API:", networkError.message);
    throw new Error("Unable to establish connection to email service provider.");
  }

  if (!response.ok) {
    let errorDetails = "Unknown error";
    try {
      const errorJson = await response.json();
      errorDetails = errorJson.message || JSON.stringify(errorJson);
    } catch {
      errorDetails = await response.text();
    }

    // Specific logging based on HTTP status codes without exposing API key
    if (response.status === 401 || response.status === 403) {
      console.error(`❌ [Brevo Auth Error ${response.status}] Unauthorized API Key. Please verify BREVO_API_KEY on Render/Environment.`);
    } else if (response.status === 400) {
      console.error(`❌ [Brevo Request Error 400] Bad Request: ${errorDetails}. Please verify BREVO_SENDER_EMAIL is verified in Brevo.`);
    } else if (response.status === 429) {
      console.error(`❌ [Brevo Rate Limit 429] Hourly or daily email quota exceeded.`);
    } else {
      console.error(`❌ [Brevo API Error ${response.status}]: ${errorDetails}`);
    }

    throw new Error(`Brevo HTTP API failed with status ${response.status}: ${errorDetails}`);
  }

  const data = await response.json();
  console.log(`📧 [Brevo] OTP email accepted by Brevo for: ${to} (Message ID: ${data?.messageId || "dispatched"})`);
  return data;
};
