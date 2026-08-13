# 🎓 URL Shortener — Technical Interview Preparation Guide

This document is a comprehensive technical reference designed to help you explain, defend, and answer interview questions about the architecture, security, database design, and trade-offs of this application.

---

## 📌 Executive Problem Statement & Value Proposition

### What Real Problem Does This Application Solve?
Long, complex web URLs are difficult to share verbally, embed in print media (brochures, business cards), or distribute on character-constrained platforms. Additionally, content creators lack instant visibility into link engagement.

**This platform provides**:
1. **Instant URL Shortening**: Converts long web addresses into unique 7-character short codes (`http://localhost:5000/x7K9pL2`).
2. **Dynamic QR Code Generation**: Renders SVG/DataURL QR codes on the client for mobile scanning and single-click PNG downloads.
3. **Automated Click Analytics**: Tracks total link click metrics upon redirection.
4. **Secure User Ownership**: Enables authenticated members to manage and review their shortened links with 6-digit email OTP verification and JWT session rotation.

---

## 🏗️ System Architecture & Data Flow

```text
[ Client Browser (React + Vite) ]
   │
   ├─► Public Landing Page (/)
   ├─► Auth Pages (/login, /register, /verify-otp)
   └─► Protected Shortener Page (/shorten)
         │
         │ (Axios Interceptors: Automatic 401 Silent Refresh + Bearer Authorization)
         ▼
[ Express API Server (Node.js) ]
   │
   ├──► POST /api/shortener (optionalAuthMiddleware -> URL creation with nullable owner)
   ├──► GET /:shortId (Public Redirect -> Increment click count -> 302 Redirect)
   ├──► POST /api/auth/* (Register -> Send OTP / Login -> Issue Tokens / Refresh -> Session Rotation)
   └──► GET /api/dashboard/my-urls (authMiddleware -> Fetch user links)
         │
         ▼
[ MongoDB Database ]
   ├──► Users Collection (email, passwordHash, otpHash, isVerified)
   ├──► Urls Collection (originalUrl, shortId [indexed], clicks, owner)
   └──► Sessions Collection (userId, refreshTokenHash [indexed], expiresAt)
```

---

## 🗄️ Database Design & Schema Relationships

### `User` Collection (`backend/models/User.js`)
- `name`: String (required, max 100 characters)
- `email`: String (required, unique, lowercase, trimmed)
- `passwordHash`: String (bcrypt hash with 12 salt rounds)
- `isVerified`: Boolean (default `false`)
- `otpHash`: String (SHA-256 hash of 6-digit verification code)
- `otpExpiresAt`: Date (10-minute validity)
- `otpAttempts`: Number (max 5 failed attempts)

### `Url` Collection (`backend/models/Url.js`)
- `originalUrl`: String (required, target destination)
- `shortId`: String (required, unique, 7-character nanoid, indexed)
- `clicks`: Number (default `0`, incremented on redirect)
- `owner`: ObjectId (ref `User`, indexed, nullable for guest shortcuts)

### `Session` Collection (`backend/models/Session.js`)
- `userId`: ObjectId (ref `User`, required)
- `refreshTokenHash`: String (required, SHA-256 hash of refresh token, indexed)
- `expiresAt`: Date (7-day TTL)
- `userAgent`: String
- `ipAddress`: String

---

## 🔒 Security Mechanics & Authentication Architecture

1. **In-Memory Access Tokens**: Short-lived JWTs (15m) are held strictly in React memory (`accessToken`). They are never saved to `localStorage` or `sessionStorage` to prevent XSS attacks.
2. **HttpOnly Refresh Cookies**: Long-lived refresh tokens (7 days) are stored in `HttpOnly`, `SameSite=Lax` cookies on path `/api/auth`, making them inaccessible to client-side scripts.
3. **Session Rotation**: On calling `/api/auth/refresh`, the backend verifies the refresh token hash, immediately deletes the old session from MongoDB, creates a brand-new session, and issues a fresh refresh token cookie. This detects token reuse and mitigates replay attacks.
4. **OTP Hashing & Rate Limiting**: Verification OTPs are hashed using SHA-256 before database insertion so plain-text codes never exist in storage. The system enforces a 5-attempt ceiling and a 10-minute expiration window to prevent brute-forcing.

---

## 💬 15 Common Technical Interview Questions & Answers

### Q1: What problem does your project solve?
> **Answer**: It is a full-stack URL shortener that converts long, complex URLs into concise 7-character short codes and downloadable QR codes while tracking click analytics. It solves the problem of sharing unwieldy links and gives users actionable engagement tracking.

### Q2: Why did you choose React + Vite for the frontend instead of Create React App or Next.js?
> **Answer**: Vite provides fast module replacement (HMR) and instant dev server starts using native ES modules. Since this app relies heavily on client-side state management (QR code rendering, clipboard API, in-memory auth context), a client-rendered SPA with Vite offered the best developer experience and performance without unnecessary SSR overhead.

### Q3: How does authentication work in your application?
> **Answer**: It uses a hybrid JWT architecture. Access tokens (expires in 15m) are kept in React memory, while refresh tokens (expires in 7 days) are stored in HttpOnly cookies. On initial load or token expiration, an Axios interceptor calls the `/api/auth/refresh` endpoint to restore or rotate the session silently.

### Q4: Why not store JWT tokens in `localStorage`?
> **Answer**: `localStorage` is accessible to any JavaScript code running on the page, making stored tokens vulnerable to Cross-Site Scripting (XSS) attacks. Keeping access tokens in memory and refresh tokens in HttpOnly cookies ensures client scripts cannot read the refresh token.

### Q5: How do you handle password security?
> **Answer**: Passwords are validated for a minimum length of 8 characters on the frontend and hashed on the backend using `bcrypt` with 12 salt rounds before being written to MongoDB. Plaintext passwords are never logged or stored.

### Q6: How does email verification work?
> **Answer**: When a user registers, an account is created with `isVerified: false`. A 6-digit OTP is generated, hashed with SHA-256, and stored alongside a 10-minute expiration timestamp. The plaintext code is emailed via Nodemailer. The user enters the code on `/verify-otp` to activate their account.

### Q7: What is session rotation and why did you implement it?
> **Answer**: Session rotation means every time a refresh token is used to get a new access token, the old refresh token is invalidated and replaced with a new one. In my backend (`auth.controller.js`), the old `Session` document is deleted upon refresh. This prevents token replay attacks.

### Q8: How does short URL generation prevent collisions?
> **Answer**: I use `nanoid(7)` to generate random 7-character IDs. Before saving, the backend queries MongoDB (`Url.findOne({ shortId })`) in a `while` loop to guarantee uniqueness before insertion.

### Q9: How do short URL redirects work?
> **Answer**: The backend route `GET /:shortId` looks up the short code in MongoDB. If found, it increments the `clicks` counter (`url.clicks += 1`), saves the document, and issues an HTTP `302 Found` redirect to `url.originalUrl`.

### Q10: How do you handle database relationships in MongoDB?
> **Answer**: The `Url` model references the `User` model via `owner: { type: Schema.Types.ObjectId, ref: 'User' }`. In `getMyUrls`, the backend queries `Url.find({ owner: req.user.id })` sorted by `createdAt: -1` to fetch all links owned by that user.

### Q11: How do you validate user input?
> **Answer**: Client-side validation checks required fields, email format regex, password length, and 6-digit numeric OTP formatting. Server-side validation uses Mongoose schema validators and custom controller checks (e.g., `new URL(originalUrl)` to verify valid URL syntax).

### Q12: What happens if an unauthenticated user tries to visit `/shorten`?
> **Answer**: The route is wrapped in `ProtectedRoute.jsx`. The guard checks `useAuth()`. If `loading` is false and `user` is `null`, it renders `<Navigate to="/login" replace />`, blocking unauthorized access.

### Q13: How did you fix browser-default blue focus styling glitches?
> **Answer**: I added a global CSS reset in `index.css` (`input:focus { outline: none !important }`) and applied explicit Tailwind focus rings (`focus:border-primary focus:ring-2 focus:ring-primary/20`) matching the app's purple design system across all inputs and buttons.

### Q14: How does the password show/hide eye toggle work without causing layout shifts?
> **Answer**: The eye icon button is positioned absolutely inside the input container (`right-3 top-1/2 -translate-y-1/2`). The input has fixed padding (`pr-10`) and fixed height (`h-12`), ensuring text never overlaps the icon and the container height remains constant when toggling between `type="password"` and `type="text"`.

### Q15: How do you handle errors globally on the backend?
> **Answer**: All async controller handlers pass caught errors to Express `next(err)`. A global error handling middleware (`errorHandler.middleware.js`) formats Mongoose validation errors (400), duplicate key errors (409), and 500 server errors cleanly without leaking internal stack traces in production.

---

## ⚡ Top 3 Technical Engineering Challenges

### Challenge 1: Silent Token Refresh via Axios Interceptors
- **Problem**: In-memory JWT access tokens expire after 15 minutes. Forcing users to log in repeatedly causes poor UX.
- **Solution**: Implemented an Axios response interceptor in `AuthContext.jsx`. When an API request returns `401 Unauthorized`, the interceptor catches it, sets a `_retry` flag, issues a call to `/api/auth/refresh` using the HttpOnly cookie, updates the in-memory token, updates the original request's `Authorization` header, and retries the original request seamlessly.

### Challenge 2: Session Rotation & Token Replay Mitigation
- **Problem**: Stolen refresh cookies could allow attackers to maintain persistent unauthorized access.
- **Solution**: Built single-use refresh tokens backed by the `Session` MongoDB collection. When `/api/auth/refresh` is called, the server deletes the existing session record. If an attacker attempts to reuse an old refresh token, the lookup fails, cookies are cleared, and access is immediately revoked.

### Challenge 3: Dual Anonymous & Authenticated Shortening Logic
- **Problem**: Guest users should be able to create short links on the landing page, but logged-in users must have their shortened links tied to their account for analytics.
- **Solution**: Developed `optionalAuthMiddleware.js`. It checks for a Bearer token in the `Authorization` header without throwing an error if missing. If valid, it attaches `req.user`; if missing/invalid, `req.user` remains `null`. The controller (`createShortUrl`) attaches `owner: req.user?.id || null`.

---

## 🔮 Scalability Roadmap & Future Engineering

1. **Redis Caching Layer**: Cache frequent `shortId` lookups in Redis to bypass MongoDB reads for viral links and reduce database latency to sub-5ms.
2. **Custom Alias Support**: Allow users to specify custom short IDs (e.g., `/my-brand-name`) with availability checking.
3. **Link Expiration & Passwords**: Add optional expiration dates and passcode protection for sensitive short links.
4. **Advanced Geographic Analytics**: Log anonymized IP geolocation and user-agent analytics to display referrer charts and device breakdown graphics.
