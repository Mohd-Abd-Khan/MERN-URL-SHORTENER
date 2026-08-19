# 🔗 Production-Grade MERN Stack URL Shortener & Authentication Platform

A full-stack, production-ready URL Shortener web application built with the **MERN** stack (**MongoDB, Express.js, React 19, Node.js**) and **Vite**. Features a complete JWT authentication flow with OTP email verification via **Gmail SMTP (App Password)**, refresh token rotation via HttpOnly cookies, QR code generation, link analytics tracking, and a user dashboard.

> 🎓 **Preparing for Technical Interviews?** Check out our dedicated [Technical Interview Preparation Guide](./INTERVIEW_PREP.md) containing system architecture diagrams, database schemas, security mechanics, top technical challenges, and 15 interviewer Q&A pairs.

---

## ✨ Features

- **Instant URL Shortening**: Convert long web links into unique 7-character short URLs powered by `nanoid`.
- **Guest & Authenticated Shortening**: Guest users can shorten links instantly; authenticated users have their links automatically tied to their personal account.
- **Secure Authentication & Registration**:
  - Email + Password registration with `bcrypt` (cost factor 12).
  - 6-digit OTP verification via **Gmail SMTP with Google App Password** (`smtp.gmail.com:587` with STARTTLS).
  - Clean duplicate-account handling (direct inline alerts with quick login navigation).
  - Browser autofill suppression on registration inputs (`autoComplete="off"`, `autoComplete="new-password"`).
  - Anti-brute-forcing OTP limit enforcement & 10-minute code expiry.
  - In-memory JWT access token (~15 min expiry) + HttpOnly, SameSite, Secure refresh token cookies.
  - Automatic silent refresh token rotation.
- **User Dashboard ("My Links")**: View created links, click analytics counters, creation dates, copy-to-clipboard, and instant QR code preview modal.
- **Automatic QR Code Generation**: Instant QR code preview and downloadable PNG images.
- **One-Click Clipboard Copy**: Built-in clipboard copying with visual feedback.
- **Click Analytics**: Automatically tracks link click metrics upon redirection.
- **SaaS-Grade Modern UI**: Dark-mode interface built with Tailwind CSS v4, DaisyUI, and glassmorphism styling.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) + [React Router v7](https://reactrouter.com/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + [DaisyUI v5](https://daisyui.com/)
- **HTTP Client**: [Axios](https://axios-http.com/) (configured with 401 refresh interceptors)
- **QR Utilities**: `qrcode`, `react-qr-code`

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) (ES Modules)
- **Framework**: [Express.js v5](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) + [Mongoose](https://mongoosejs.com/)
- **Security**: `bcrypt`, `jsonwebtoken`, `cookie-parser`, `cors`
- **Email Delivery**: `nodemailer` (Standard Gmail SMTP with App Password)
- **ID Generator**: `nanoid`

---

## 📁 Project Architecture

```text
04_URL_Shortener/
├── backend/
│   ├── config/
│   │   └── db.js                 # Database connection abstraction
│   ├── controllers/
│   │   ├── auth.controller.js    # Register, OTP verify, login, refresh, logout, getMe
│   │   ├── dashboard.controller.js # User links fetch controller
│   │   └── url.controller.js     # Shortener & redirect logic
│   ├── middleware/
│   │   ├── auth.middleware.js         # JWT verification guard
│   │   ├── optionalAuth.middleware.js # Non-blocking auth for link ownership
│   │   └── errorHandler.middleware.js # Express global error handler
│   ├── models/
│   │   ├── Session.js            # Refresh token sessions (with MongoDB TTL index)
│   │   ├── Url.js                # URL schema with nullable owner reference
│   │   └── User.js               # User schema with SHA-256 hashed OTPs
│   ├── routes/
│   │   ├── auth.routes.js        # Auth endpoint router (/api/auth)
│   │   ├── dashboard.routes.js   # Dashboard endpoint router (/api/dashboard)
│   │   └── url.routes.js         # URL endpoint router (/api/shortener & GET /:shortId)
│   ├── utils/
│   │   ├── email.util.js         # Gmail SMTP transporter (STARTTLS 587) & HTML email templates
│   │   ├── otp.util.js           # 6-digit randomInt OTP & SHA-256 hashing
│   │   └── token.util.js         # JWT signing & token hashing helpers
│   ├── .env                      # Local environment variables
│   ├── .env.example              # Environment variables template
│   ├── package.json
│   └── server.js                 # Express server entry point
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── axiosInstance.js  # Pre-configured Axios instance (withCredentials: true)
│   │   │   ├── authApi.js        # Auth API calls
│   │   │   ├── dashboardApi.js   # Dashboard API calls
│   │   │   └── urlApi.js         # Shortener API calls
│   │   ├── components/
│   │   │   ├── Footer.jsx        # Developer portfolio footer
│   │   │   ├── Navbar.jsx        # Glassmorphic header navbar
│   │   │   ├── ShortenForm.jsx   # Input form for URL shortening
│   │   │   └── ShortenResult.jsx # Display short link, copy button, QR code & download
│   │   ├── context/
│   │   │   ├── AuthContextObject.js # Isolated Context instantiation
│   │   │   ├── AuthContext.jsx   # In-memory token & user state provider
│   │   │   └── useAuth.js        # Auth hook export
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx   # Public landing page
│   │   │   ├── ShortenPage.jsx   # Protected URL shortener page & Dashboard
│   │   │   ├── LoginPage.jsx     # Authentication login page
│   │   │   ├── RegisterPage.jsx  # User registration page
│   │   │   └── VerifyOtpPage.jsx # 6-digit OTP verification page
│   │   ├── routes/
│   │   │   └── ProtectedRoute.jsx # Client-side route guard
│   │   ├── App.jsx               # App layout & routing structure
│   │   ├── main.jsx              # Application root entry point
│   │   └── index.css             # Tailwind v4 + DaisyUI entry
│   ├── package.json
│   └── vite.config.js
├── INTERVIEW_PREP.md             # Dedicated Technical Interview Preparation Guide
└── README.md                     # Primary documentation
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
BASE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173

MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/url-shortener

JWT_SECRET=your_production_jwt_secret_key_here
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_DAYS=7

# Standard Gmail SMTP Configuration (Using Gmail App Password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_gmail_address@gmail.com
SMTP_PASS=your_16_character_gmail_app_password
SMTP_FROM="URL Shortener <your_gmail_address@gmail.com>"
```

### Frontend (`frontend/.env`)

```env
VITE_BACKEND_URL=http://localhost:5000
```

---

## 🔑 Gmail App Password Setup Guide

To enable reliable email delivery via Gmail SMTP, generate a 16-character Google App Password:

### 1. Enable 2-Step Verification
1. Go to your [Google Account Security](https://myaccount.google.com/security) settings.
2. Under "How you sign in to Google", ensure **2-Step Verification** is turned **ON**.

### 2. Generate an App Password
1. In the search bar at the top of your Google Account page, search for **App passwords**.
2. Enter an app name (e.g., `URL Shortener`).
3. Click **Create**.
4. Copy the generated **16-character password** (e.g., `abcd efgh ijkl mnop`).

### 3. Configure in Render or Local `.env`
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_gmail_address@gmail.com
SMTP_PASS=abcdefghijklmnop
SMTP_FROM="URL Shortener <your_gmail_address@gmail.com>"
```

---

## 🚀 Getting Started & Testing

### Installation & Execution

#### 1. Setup & Start Backend
```bash
cd backend
npm install
npm run dev
```
> The backend server starts on `http://localhost:5000` and displays:
> - `Connected to MongoDB`
> - `📧 Email Service Mode: [Gmail SMTP]`
> - `📧 [Email] SMTP connection verified successfully`

#### 2. Setup & Start Frontend
In a second terminal window:
```bash
cd frontend
npm install
npm run dev
```
> The Vite frontend app starts on `http://localhost:5173`.

### 🧪 Testing the Complete Flow
1. Open `http://localhost:5173` in your browser.
2. Click **Register** in the top navigation bar.
3. Enter your Name, Email, and Password, then click **Register**.
4. Check your inbox for the 6-digit OTP verification email sent via Gmail SMTP.
5. Enter the 6-digit code on the `/verify-otp` page to complete registration.
6. Log in with your new credentials and access the protected **Dashboard**.

---

## ☁️ Deployment on Render

### Backend Web Service
1. **Build Command**: `npm install`
2. **Start Command**: `npm start`
3. **Environment Variables**:
   - `PORT=10000`
   - `BASE_URL=https://your-backend.onrender.com`
   - `FRONTEND_URL=https://your-frontend.onrender.com`
   - `MONGO_URI=mongodb+srv://...`
   - `JWT_SECRET=...`
   - `JWT_EXPIRES_IN=15m`
   - `REFRESH_TOKEN_EXPIRES_DAYS=7`
   - `SMTP_HOST=smtp.gmail.com`
   - `SMTP_PORT=587`
   - `SMTP_USER=your_gmail@gmail.com`
   - `SMTP_PASS=your_16_char_app_password`
   - `SMTP_FROM="URL Shortener <your_gmail@gmail.com>"`

### Frontend Static Site
1. **Build Command**: `npm install && npm run build`
2. **Publish Directory**: `dist`
3. **Environment Variables**:
   - `VITE_BACKEND_URL=https://your-backend.onrender.com`

---

## 📡 API Reference

### Auth Endpoints (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register user & dispatch 6-digit OTP email via Gmail SMTP | No |
| `POST` | `/api/auth/verify-otp` | Verify 6-digit OTP code & activate user | No |
| `POST` | `/api/auth/resend-otp` | Resend 6-digit OTP code via Gmail SMTP | No |
| `POST` | `/api/auth/login` | Authenticate user, return JWT & set HttpOnly refresh cookie | No |
| `POST` | `/api/auth/refresh` | Rotate refresh token cookie & issue new JWT | Cookie |
| `POST` | `/api/auth/logout` | Revoke session document & clear refresh cookie | Cookie |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Bearer JWT |

### URL Shortener Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/shortener` | Create shortened URL (associates user if logged in) | Optional |
| `GET` | `/:shortId` | Increment click count & 302 redirect to destination | No |

### Dashboard Endpoints (`/api/dashboard`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/dashboard/my-urls` | Fetch all URLs created by the authenticated user | Bearer JWT |

---

## 📜 License

This project is licensed under the [ISC License](LICENSE).

