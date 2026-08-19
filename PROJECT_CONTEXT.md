# 📌 PROJECT CONTEXT & HANDOFF DOCUMENT: 04_URL_Shortener

**Project Name:** 04_URL_Shortener (MERN Stack URL Shortener + Authentication + Gmail SMTP OTP Verification)  
**Date:** August 19, 2026  
**Status:** Completed

---

## 1. 🏗️ Overall Project Architecture

This application is a full-stack MERN (MongoDB, Express, React, Node.js) web application designed for shortening URLs, generating QR codes, tracking link clicks, and supporting secure user accounts with full JWT authentication, OTP email verification via **Gmail SMTP with App Password**, and a user dashboard.

### Folder & Module Architecture

```text
04_URL_Shortener/
├── backend/
│   ├── config/
│   │   └── db.js                 # Centralized Mongoose MongoDB connection
│   ├── controllers/
│   │   ├── auth.controller.js    # Register, OTP verify, login, refresh, logout, getMe
│   │   ├── dashboard.controller.js # User created links fetch controller
│   │   └── url.controller.js     # URL shortening & redirection logic
│   ├── middleware/
│   │   ├── auth.middleware.js         # JWT verification middleware
│   │   ├── optionalAuth.middleware.js # Non-blocking auth middleware for URL ownership
│   │   └── errorHandler.middleware.js # Express global error handler
│   ├── models/
│   │   ├── Url.js                # Schema with originalUrl, shortId, clicks, owner (ref User)
│   │   ├── User.js               # Schema for user details, password hash, OTP metadata
│   │   └── Session.js            # Schema for hashed refresh token sessions (TTL index)
│   ├── routes/
│   │   ├── auth.routes.js        # Router for /api/auth/*
│   │   ├── dashboard.routes.js   # Router for /api/dashboard/*
│   │   └── url.routes.js         # Router for /api/shortener and GET /:shortId
│   ├── utils/
│   │   ├── token.util.js         # JWT access token & SHA-256 hash helpers
│   │   ├── otp.util.js           # 6-digit OTP generator & SHA-256 hash helper
│   │   └── email.util.js         # Gmail SMTP transporter (STARTTLS port 587) & HTML email template
│   ├── .env                      # Local environment configuration
│   ├── .env.example              # Environment template
│   ├── package.json
│   └── server.js                 # Express server entry point
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── axiosInstance.js  # Pre-configured Axios client (withCredentials: true)
│   │   │   ├── authApi.js        # Auth API call functions
│   │   │   ├── dashboardApi.js   # Dashboard API call functions
│   │   │   └── urlApi.js         # URL shortening API call functions
│   │   ├── components/
│   │   │   ├── Navbar.jsx        # App header navbar with glassmorphism & auth status
│   │   │   ├── ShortenForm.jsx   # Input form for URL shortening
│   │   │   └── ShortenResult.jsx # Display short link, copy button, QR code & download
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # User auth state, token in memory, 401 refresh interceptor
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx # Protected user links & stats dashboard
│   │   │   ├── HomePage.jsx      # Main landing page for URL shortening
│   │   │   ├── LoginPage.jsx     # User login view
│   │   │   ├── RegisterPage.jsx  # User registration view
│   │   │   └── VerifyOtpPage.jsx # 6-digit OTP verification view
│   │   ├── routes/
│   │   │   └── ProtectedRoute.jsx # Route guard for authenticated views
│   │   ├── App.jsx               # React Router layout wrapper
│   │   ├── main.jsx              # React DOM root entry point
│   │   └── index.css             # Tailwind v4 + DaisyUI CSS entry
│   ├── .env                      # Local frontend environment config
│   ├── .env.example              # Environment template
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## 2. 📧 Gmail SMTP Architecture Details

1. **Transport**: Standard Nodemailer SMTP transport with STARTTLS over port 587 (`smtp.gmail.com`).
2. **Authentication**: Dedicated 16-character Google App Password (2-Step Verification enabled on Gmail account).
3. **Environment Configuration**:
   - `SMTP_HOST=smtp.gmail.com`
   - `SMTP_PORT=587`
   - `SMTP_USER=myemail@gmail.com`
   - `SMTP_PASS=my_16_character_gmail_app_password`
   - `SMTP_FROM="URL Shortener <myemail@gmail.com>"`
4. **Startup Verification**: `verifySmtpConnection()` runs during backend bootstrap to confirm SMTP connectivity and logs status safely without leaking credentials.
5. **Direct Delivery**: Eliminates OAuth2 token timeouts and removes Ethereal test fallbacks in production. All OTP delivery errors return a safe 500 error to the frontend while logging real technical errors to server logs.

