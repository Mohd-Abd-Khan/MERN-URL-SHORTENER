# 🔗 Production-Grade MERN URL Shortener & Analytics Platform

[![Live Demo](https://img.shields.io/badge/Live_Demo-Frontend-6366F1?style=for-the-badge&logo=render&logoColor=white)](https://frontend-1cdl.onrender.com)
[![API Endpoint](https://img.shields.io/badge/API_Base-Backend-10B981?style=for-the-badge&logo=render&logoColor=white)](https://backend-5440.onrender.com)
[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)

A modern, SaaS-grade, full-stack **URL Shortener & Link Management Platform** built with the **MERN** stack (**MongoDB, Express.js, React 19, Node.js**) and **Vite**. Features enterprise-grade JWT dual-token authentication, firewall-friendly 6-digit OTP verification via **Brevo REST API (HTTPS :443)**, single-use refresh token rotation with MongoDB TTL session storage, instant QR code generation & PNG export, click analytics tracking, and a user dashboard.

---

## 🌐 Live Deployment Links

| Service | Deployed URL | Platform | Status |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | [https://frontend-1cdl.onrender.com](https://frontend-1cdl.onrender.com) | Render Static Site | 🟢 Active |
| **Backend REST API** | [https://backend-5440.onrender.com](https://backend-5440.onrender.com) | Render Web Service | 🟢 Active |

> 🎓 **Preparing for Technical Interviews?** Check out our dedicated [Technical Interview Preparation Guide](./INTERVIEW_PREP.md) containing system architecture diagrams, database schemas, security mechanics, top technical challenges, and 15 interviewer Q&A pairs.

---

## 🔄 Project Workflows & System Architecture

### 1. URL Shortening & Redirection Workflow

```
[ User (Guest / Authenticated) ]
               │
               ▼
[ Enters Target URL in Frontend ] ──▶ POST /api/shortener (with optional Bearer JWT)
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 ▼                                                             ▼
       [ Authenticated Request ]                                      [ Guest Request ]
       • Decode JWT from header                                       • Set owner = null
       • Associate owner = user._id                                   • Generate 7-char nanoid
       • Save to Mongo (Url collection)                               • Save to Mongo (Url collection)
                 │                                                             │
                 └──────────────────────────────┬──────────────────────────────┘
                                                ▼
                             [ Returns shortUrl + QR Data ]
                                                │
   ─────────────────────────────────────────────┴─────────────────────────────────────────────
   [ Anyone Visits https://backend-5440.onrender.com/:shortId ]
                                                │
                                                ▼
                                   [ Express GET /:shortId ]
                                                │
                                                ▼
                                [ Find URL Document in MongoDB ]
                                 ├── Found: Atomic $inc { clicks: 1 }
                                 │          └── HTTP 302 Redirect to originalUrl
                                 └── Not Found: Return 404 Not Found Page / JSON
```

---

### 2. User Authentication & OTP Email Verification Workflow

```
[ Register: POST /api/auth/register ]
               │
               ▼
  [ Check if Email Exists in MongoDB ]
   ├── Already Exists: Return 409 Conflict with direct link to login
   └── New User:
        • Hash password with bcrypt (12 salt rounds)
        • Generate cryptographically secure 6-digit OTP
        • Hash OTP with SHA-256 and store in User document (10m TTL)
        • Dispatch formatted HTML email via Brevo REST API over HTTPS :443
        • Return 201 Created -> Frontend navigates to /verify-otp
               │
               ▼
[ Verify: POST /api/auth/verify-otp ]
               │
               ▼
  [ Compare SHA-256(enteredOtp) with stored hash ]
   ├── Invalid / Expired / Max Attempts Exceeded: Return 400 Error
   └── Match:
        • Mark user as isVerified = true, clear OTP fields
        • Issue short-lived in-memory JWT Access Token (15 min)
        • Generate cryptographically secure Refresh Token (UUIDv4/crypto)
        • Hash Refresh Token (SHA-256) & store in Session collection (7-day TTL)
        • Set HttpOnly, Secure, SameSite=None Refresh Cookie
        • Return user object & access token to client
```

---

### 3. Silent Token Refresh & Session Rotation Workflow

```
[ Frontend API Request (Axios) ]
               │
               ▼
[ Request with Authorization: Bearer <access_token> ]
   ├── 200 OK: Normal data flow
   └── 401 Unauthorized (Access Token Expired):
               │
               ▼
   [ Axios Response Interceptor catches 401 ]
               │
               ▼
   [ POST /api/auth/refresh with HttpOnly Cookie ]
               │
               ▼
   [ Validate Refresh Session in MongoDB ]
   ├── Invalid / Revoked: Clear cookie, prompt re-login
   └── Valid Session:
        • Rotate: Delete old session from DB
        • Create new session with new hashed refresh token
        • Set updated HttpOnly refresh cookie
        • Return brand new Access Token (15 min)
               │
               ▼
   [ Axios automatically retries original request with new token ]
```

---

### 4. User Dashboard & Link Management Workflow

```
[ User visits /dashboard (Protected Route) ]
               │
               ▼
[ GET /api/dashboard/my-urls with Bearer JWT ]
               │
               ▼
[ Fetch all Url documents where owner === req.user._id ]
               │
               ▼
[ Render Interactive UI Cards ]:
  ├── Original URL & Clickable Short Link
  ├── Real-time Click Analytics Counter
  ├── Creation Timestamp
  ├── One-click Clipboard Copy (with visual badge toast)
  └── Instant QR Code Modal (with 1-click PNG image download)
```

---

## ✨ Core Features

- ⚡ **Instant URL Shortening**: Generates unique, collision-resistant 7-character short codes using `nanoid`.
- 👥 **Dual Shortening Modes**:
  - **Guest Mode**: Anyone can shorten URLs immediately without signing up.
  - **Authenticated Mode**: Automatically links shortened URLs to the user's personal account and dashboard.
- 📧 **Enterprise Email Delivery via Brevo HTTP REST API**:
  - Operates over standard **HTTPS (port 443)**, completely bypassing cloud firewall and SMTP port restrictions (ports 25, 465, 587) on hosting platforms like Render Free Tier and AWS.
  - Generates polished, dark-themed responsive HTML verification emails.
- 🛡️ **Enterprise-Grade Authentication**:
  - Passwords hashed with `bcrypt` (12 rounds).
  - 6-digit numeric OTP verification with SHA-256 database hashing and 10-minute expiry.
  - Single-use **Refresh Token Rotation** with automatic MongoDB TTL index cleanup.
  - Access tokens kept strictly in React memory; Refresh tokens stored in `HttpOnly`, `SameSite=None`, `Secure` cookies (XSS & CSRF hardened).
- 📊 **Link Analytics & Management Dashboard**:
  - View all user-created short links.
  - Atomic click counter (`$inc`) updated on every 302 redirect.
  - Real-time search and copy buttons.
- 📱 **Integrated QR Code Generator**:
  - Interactive modal previews for any short URL.
  - Direct 1-click **Download QR as PNG** for mobile sharing and print media.
- 🎨 **SaaS-Grade Modern UI/UX**:
  - Dark-mode first design built with **Tailwind CSS v4** and **DaisyUI v5**.
  - Glassmorphic panels, animated gradients, and responsive layout across all screen sizes.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + [DaisyUI v5](https://daisyui.com/)
- **HTTP Client**: [Axios](https://axios-http.com/) (configured with automatic 401 silent token refresh interceptors)
- **QR Utilities**: `qrcode`, `react-qr-code`
- **Icons**: `lucide-react`

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) (ES Modules)
- **Framework**: [Express.js v5](https://expressjs.com/)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/) + [Mongoose](https://mongoosejs.com/)
- **Transactional Email**: [Brevo REST API v3](https://www.brevo.com/) (over HTTPS `:443`)
- **Security & Tokens**: `jsonwebtoken`, `bcrypt`, `cookie-parser`, `cors`
- **ID Generator**: `nanoid`

---

## 📁 Repository Structure

```text
04_URL_Shortener/
├── backend/
│   ├── config/
│   │   └── db.js                 # Centralized MongoDB connection logic
│   ├── controllers/
│   │   ├── auth.controller.js    # Register, OTP verify, login, refresh, logout, getMe
│   │   ├── dashboard.controller.js # User links & analytics controller
│   │   └── url.controller.js     # URL shortening & 302 redirect logic
│   ├── middleware/
│   │   ├── auth.middleware.js         # Strict JWT authorization guard
│   │   ├── optionalAuth.middleware.js # Non-blocking auth for link ownership attribution
│   │   └── errorHandler.middleware.js # Express centralized error middleware
│   ├── models/
│   │   ├── Session.js            # Refresh token sessions (with MongoDB TTL auto-expiry)
│   │   ├── Url.js                # URL schema with originalUrl, shortId, clicks & owner ref
│   │   └── User.js               # User schema with SHA-256 hashed OTPs & verification state
│   ├── routes/
│   │   ├── auth.routes.js        # Auth endpoints (/api/auth/*)
│   │   ├── dashboard.routes.js   # Dashboard endpoints (/api/dashboard/*)
│   │   └── url.routes.js         # Shortener API (/api/shortener) & Redirect (GET /:shortId)
│   ├── utils/
│   │   ├── email.util.js         # Brevo HTTP REST API email dispatcher & HTML template
│   │   ├── otp.util.js           # 6-digit randomInt OTP & SHA-256 hashing
│   │   └── token.util.js         # JWT signing & session hashing helpers
│   ├── .env                      # Local environment variables
│   ├── .env.example              # Environment variables template
│   ├── package.json
│   └── server.js                 # Express server entry point & CORS configuration
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── axiosInstance.js  # Pre-configured Axios instance (withCredentials: true)
│   │   │   ├── authApi.js        # Auth API communication
│   │   │   ├── dashboardApi.js   # Dashboard & user links API
│   │   │   └── urlApi.js         # Shortener API communication
│   │   ├── components/
│   │   │   ├── Footer.jsx        # SaaS footer with portfolio & GitHub links
│   │   │   ├── Navbar.jsx        # Glassmorphic header with user avatar & navigation
│   │   │   ├── ShortenForm.jsx   # Interactive URL input card
│   │   │   └── ShortenResult.jsx # Result card with copy button, QR modal & stats
│   │   ├── context/
│   │   │   ├── AuthContextObject.js # React Context initialization
│   │   │   ├── AuthContext.jsx   # In-memory auth state, login/logout, refresh interceptor
│   │   │   └── useAuth.js        # Custom auth hook
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx   # Public landing page with features & URL shortener
│   │   │   ├── ShortenPage.jsx   # Authenticated shortener & My Links dashboard
│   │   │   ├── LoginPage.jsx     # User login screen
│   │   │   ├── RegisterPage.jsx  # User registration screen
│   │   │   └── VerifyOtpPage.jsx # 6-digit OTP verification screen
│   │   ├── routes/
│   │   │   └── ProtectedRoute.jsx # Client-side route guard
│   │   ├── App.jsx               # Main React Router tree
│   │   ├── main.jsx              # React DOM mounting entry point
│   │   └── index.css             # Tailwind v4 + DaisyUI CSS entry
│   ├── .env                      # Local frontend environment variables
│   ├── .env.example              # Frontend environment template
│   ├── package.json
│   └── vite.config.js
│
├── INTERVIEW_PREP.md             # Dedicated Technical Interview Preparation Guide
├── PROJECT_CONTEXT.md            # Technical context and handoff document
└── README.md                     # Primary repository documentation
```

---

## ⚙️ Environment Variables Setup

### Backend (`backend/.env`)

```env
# Server Configuration
PORT=5000
BASE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173,https://frontend-1cdl.onrender.com

# Database
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/url-shortener

# Authentication Secrets & Expiry
JWT_SECRET=your_production_jwt_secret_key_here
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_DAYS=7

# Brevo HTTP Email Configuration (Works on Render Free Tier over HTTPS :443)
BREVO_API_KEY=xkeysib-your_brevo_api_key_here
BREVO_SENDER_EMAIL=your_verified_brevo_email@gmail.com
BREVO_SENDER_NAME=URL Shortener
```

### Frontend (`frontend/.env`)

```env
# Backend Base API URL
VITE_BACKEND_URL=http://localhost:5000
```

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js (v18.0.0 or later)
- MongoDB Atlas cluster or local MongoDB instance
- Free [Brevo Account](https://www.brevo.com/) (for email OTPs)

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/<your-username>/04_URL_Shortener.git
cd 04_URL_Shortener

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Start Backend Development Server
```bash
cd backend
npm run dev
```
> Server starts on `http://localhost:5000`:
> - `Connected to MongoDB`
> - `📧 Email Service Mode: [Brevo HTTP API]`
> - `🌐 Allowed CORS Origins: [ 'http://localhost:5173' ]`

### 3. Start Frontend Development Server
```bash
cd frontend
npm run dev
```
> Vite frontend starts on `http://localhost:5173`.

---

## ☁️ Deployment Guide (Render)

### 1. Deploy Backend (Web Service)
1. In Render Dashboard, click **New +** → **Web Service** → Connect your repository.
2. Configure settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
3. Add Environment Variables in Render:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `BASE_URL`: `https://backend-5440.onrender.com`
   - `FRONTEND_URL`: `https://frontend-1cdl.onrender.com`
   - `MONGO_URI`: `mongodb+srv://...`
   - `JWT_SECRET`: `your_random_64_char_secret`
   - `JWT_EXPIRES_IN`: `15m`
   - `REFRESH_TOKEN_EXPIRES_DAYS`: `7`
   - `BREVO_API_KEY`: `xkeysib-...`
   - `BREVO_SENDER_EMAIL`: `your_verified_email@gmail.com`
   - `BREVO_SENDER_NAME`: `URL Shortener`

### 2. Deploy Frontend (Static Site)
1. In Render Dashboard, click **New +** → **Static Site** → Connect your repository.
2. Configure settings:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
3. Add Environment Variable:
   - `VITE_BACKEND_URL`: `https://backend-5440.onrender.com`
4. Add Rewrite Rule (for SPA routing):
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Action**: `Rewrite`

---

## 📡 API Reference

### Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Description | Auth Type |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register user & dispatch 6-digit OTP email via Brevo | Public |
| `POST` | `/api/auth/verify-otp` | Verify 6-digit OTP code, activate user & issue tokens | Public |
| `POST` | `/api/auth/resend-otp` | Resend 6-digit OTP code with anti-spam rate limiting | Public |
| `POST` | `/api/auth/login` | Authenticate user, return JWT & set HttpOnly refresh cookie | Public |
| `POST` | `/api/auth/refresh` | Rotate single-use refresh token & issue new JWT access token | Cookie |
| `POST` | `/api/auth/logout` | Revoke session in MongoDB & clear refresh cookie | Cookie |
| `GET` | `/api/auth/me` | Fetch authenticated user profile & verification state | Bearer JWT |

### URL Shortener Endpoints

| Method | Endpoint | Description | Auth Type |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/shortener` | Create shortened URL (associates user if authenticated) | Optional Bearer JWT |
| `GET` | `/:shortId` | Increment click count & 302 redirect to destination | Public |

### Dashboard Endpoints (`/api/dashboard`)

| Method | Endpoint | Description | Auth Type |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/my-urls` | Fetch all URLs and click metrics created by the user | Bearer JWT |

---

## 🔒 Security Implementations

- **XSS Mitigation**: Access tokens are kept in memory and never stored in `localStorage` or `sessionStorage`.
- **CSRF Protection**: Refresh cookies are configured with `HttpOnly`, `SameSite=None`, and `Secure: true`.
- **Database Hash Isolation**: Passwords are saved as bcrypt hashes; verification OTPs and refresh tokens are stored exclusively as one-way **SHA-256** hashes.
- **Brute-Force & Flood Prevention**: OTP attempts are capped with a 10-minute expiry window.
- **Firewall Bypass**: Brevo transactional emails communicate securely via **HTTPS (Port 443)**, completely avoiding Render and cloud SMTP port blocks.

---

## 📜 License

This project is licensed under the [ISC License](LICENSE).


