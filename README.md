# 🔗 Modern MERN Stack URL Shortener

A full-stack, production-ready URL Shortener web application built with the **MERN** stack (**MongoDB, Express.js, React, Node.js**) and **Vite**. The application allows users to convert long, cumbersome web addresses into compact, shareable links, auto-generates downloadable QR codes, and tracks link access metrics.

---

## ✨ Features

- **Instant URL Shortening**: Convert long web links into unique 7-character short URLs powered by `nanoid`.
- **Automatic QR Code Generation**: Displays an instant QR code for every shortened link.
- **One-Click QR Download**: Download generated QR code images directly as PNGs.
- **One-Click Clipboard Copy**: Built-in clipboard copying with instant UI feedback.
- **Click Analytics**: Tracks link usage count automatically upon redirection.
- **URL Validation**: Client & server-side validation to ensure link integrity before database insertion.
- **SaaS-Grade Modern UI**: Dark-mode primary interface built with Tailwind CSS & DaisyUI.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + [DaisyUI](https://daisyui.com/)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **QR Utilities**: `qrcode`, `react-qr-code`

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) (ES Modules)
- **Framework**: [Express.js v5](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) + [Mongoose](https://mongoosejs.com/)
- **ID Generator**: [nanoid](https://github.com/ai/nanoid)
- **CORS & Environment**: `cors`, `dotenv`

---

## 📁 Project Structure

```
10_URL_Shortener/
├── backend/
│   ├── models/
│   │   └── Url.js          # Mongoose schema definition
│   ├── routes/
│   │   └── url.js          # Shortener & redirect controller routes
│   ├── .env                # Backend environment configuration
│   ├── package.json        # Backend dependencies & scripts
│   └── server.js           # Server entrypoint & DB connection
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Primary UI component
│   │   ├── main.jsx        # React application root
│   │   └── index.css       # Tailwind CSS styles
│   ├── .env                # Frontend environment configuration
│   ├── package.json        # Frontend dependencies & scripts
│   └── vite.config.js      # Vite build configuration
│
└── README.md               # Project documentation
```

---

## ⚙️ Environment Variables

### Backend Configuration (`backend/.env`)

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/url-shortener
BASE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173
```

### Frontend Configuration (`frontend/.env`)

Create a `.env` file in the `frontend/` directory:

```env
VITE_BACKEND_URL=http://localhost:5000
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: Active local instance or MongoDB Atlas connection URI

---

### Installation & Setup

#### 1. Clone the repository
```bash
git clone https://github.com/Mohd-Abd-Khan/MERN-URL-SHORTENER.git
cd 10_URL_Shortener
```

#### 2. Setup Backend
```bash
cd backend
npm install
npm run dev
```
> The backend server will start on `http://localhost:5000` and output: `connected to mongoDB`.

#### 3. Setup Frontend
Open a second terminal window:
```bash
cd frontend
npm install
npm run dev
```
> The frontend Vite server will start on `http://localhost:5173`.

---

## 📡 API Reference

### 1. Create Short URL

- **Endpoint**: `POST /shortener`
- **Content-Type**: `application/json`
- **Request Body**:
  ```json
  {
    "originalUrl": "https://example.com/very/long/url/path"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "shortUrl": "http://localhost:5000/aB3xZ9q"
  }
  ```
- **Error Response** (`400 Bad Request`):
  ```json
  {
    "error": "Invalid URL"
  }
  ```

---

### 2. Redirect to Original URL

- **Endpoint**: `GET /:shortId`
- **Description**: Increments the click counter by `1` and issues a `302 Found` redirect to the original destination URL.
- **Error Response** (`404 Not Found`):
  ```json
  {
    "error": "URL not found"
  }
  ```

---

## 🛡️ License

This project is open source and available under the [ISC License](LICENSE).
