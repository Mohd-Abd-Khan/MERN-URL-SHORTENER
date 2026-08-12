# 🔗 Production-Grade MERN Stack URL Shortener & Authentication Platform

A full-stack, production-ready URL Shortener web application built with the **MERN** stack (**MongoDB, Express.js, React 19, Node.js**) and **Vite**. Features a complete JWT authentication flow with OTP email verification, refresh token rotation via HttpOnly cookies, Google OAuth 2.0 Gmail delivery, QR code generation, link analytics tracking, and a user dashboard.

---

## ✨ Features

- **Instant URL Shortening**: Convert long web links into unique 7-character short URLs powered by `nanoid`.
- **Guest & Authenticated Shortening**: Guest users can shorten links instantly; authenticated users have their links automatically tied to their personal account.
- **Secure Authentication & Registration**:
  - Email + Password registration with `bcrypt` (cost factor 12).
  - 6-digit OTP verification via **Google OAuth 2.0 Gmail API** (with automatic Ethereal SMTP fallback in local development when OAuth credentials are absent).
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
- **Email Delivery**: `google-auth-library` + `nodemailer` (Google OAuth 2.0 for Gmail)
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
│   │   ├── email.util.js         # Google OAuth 2.0 Gmail transporter & HTML email templates
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
│   │   │   ├── Navbar.jsx        # Glassmorphic header navbar
│   │   │   ├── ShortenForm.jsx   # URL input form
│   │   │   └── ShortenResult.jsx # Short URL result display & QR download
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # In-memory token & user state provider
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx # Protected user links dashboard
│   │   │   ├── HomePage.jsx      # Main URL shortener view
│   │   │   ├── LoginPage.jsx     # User authentication page
│   │   │   ├── RegisterPage.jsx  # Account creation page
│   │   │   └── VerifyOtpPage.jsx # 6-digit OTP verification page
│   │   ├── routes/
│   │   │   └── ProtectedRoute.jsx # Client-side route guard
│   │   ├── App.jsx               # App layout & routing structure
│   │   ├── main.jsx              # Application root entry point
│   │   └── index.css             # Tailwind v4 + DaisyUI entry
│   ├── .env                      # Frontend environment variables
│   ├── .env.example              # Frontend environment template
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
BASE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173

MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/url-shortener

JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_DAYS=7

# Google OAuth 2.0 Gmail Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=https://developers.google.com/oauthplayground
GOOGLE_REFRESH_TOKEN=your_google_refresh_token_here
SMTP_FROM="URL Shortener <your_gmail_address@gmail.com>"
```

### Frontend (`frontend/.env`)

```env
VITE_BACKEND_URL=http://localhost:5000
```

---

## 🔑 Google OAuth 2.0 Setup Guide for Gmail

To enable real Gmail email delivery via Google OAuth 2.0, follow these steps:

### 1. Create a Google Cloud Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g., `URL Shortener Email`).

### 2. Enable the Gmail API
1. In the Google Cloud Console, navigate to **APIs & Services > Library**.
2. Search for **Gmail API** and click **Enable**.

### 3. Configure the OAuth Consent Screen
1. Go to **APIs & Services > OAuth consent screen**.
2. Select **External** user type and click **Create**.
3. Fill in the App Information (App name, User support email, Developer contact email).
4. Under **Scopes**, add the minimum required scope:
   `https://www.googleapis.com/auth/gmail.send`
5. Under **Test Users**, add your Gmail address (the one sending the emails).

### 4. Create OAuth 2.0 Credentials
1. Go to **APIs & Services > Credentials**.
2. Click **Create Credentials > OAuth client ID**.
3. Select Application Type: **Web application**.
4. Set Name: `URL Shortener Web Client`.
5. Under **Authorized redirect URIs**, add:
   `https://developers.google.com/oauthplayground`
6. Click **Create** and save your **Client ID** and **Client Secret**.

### 5. Obtain a Google Refresh Token
1. Open the [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground).
2. Click the gear icon ⚙️ in the top right corner:
   - Check **Use your own OAuth credentials**.
   - Paste your **OAuth Client ID** and **OAuth Client Secret**.
3. In the left panel ("Step 1 Select & authorize APIs"):
   - Scroll down to **Gmail API v1**.
   - Select `https://www.googleapis.com/auth/gmail.send`.
4. Click **Authorize APIs** and log in with your test Gmail account.
5. In "Step 2 Exchange authorization code for tokens":
   - Click **Exchange authorization code for tokens**.
6. Copy the generated **Refresh token**.

### 6. Set Environment Variables
Add your values to `backend/.env`:
```env
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=https://developers.google.com/oauthplayground
GOOGLE_REFRESH_TOKEN=1//your_refresh_token
SMTP_FROM="URL Shortener <your_gmail_address@gmail.com>"
```

> 💡 **Note**: If `GOOGLE_CLIENT_ID` / `GOOGLE_REFRESH_TOKEN` are omitted in local dev, the app automatically falls back to Ethereal test SMTP and logs preview links in the console.

---

## 🚀 Getting Started & Testing

### Installation & Execution

#### 1. Setup & Start Backend
```bash
cd backend
npm install
npm run dev
```
> The backend server starts on `http://localhost:5000` and displays `Connected to MongoDB`.

#### 2. Setup & Start Frontend
In a second terminal window:
```bash
cd frontend
npm install
npm run dev
```
> The Vite frontend app starts on `http://localhost:5173`.

### 🧪 Testing the Complete Email Flow
1. Open `http://localhost:5173` in your browser.
2. Click **Register** in the top navigation bar.
3. Enter your Name, Email, and Password, then click **Register**.
4. Check your inbox (or dev server logs if using Ethereal fallback) for the 6-digit OTP email sent via Google OAuth 2.0.
5. Enter the 6-digit code on the `/verify-otp` page to complete registration.
6. Log in with your new credentials and access the protected **Dashboard**.

---

## 📡 API Reference

### Auth Endpoints (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register user & dispatch 6-digit OTP email via Gmail OAuth2 | No |
| `POST` | `/api/auth/verify-otp` | Verify 6-digit OTP code & activate user | No |
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
