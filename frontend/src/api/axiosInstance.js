import axios from "axios";

/**
 * Sanitizes and extracts a valid backend base URL.
 * Handles invalid syntax like `http://localhost:5000 || https://backend-5440.onrender.com`
 * by picking the appropriate environment URL.
 */
const getSanitizedBackendUrl = () => {
  const raw = import.meta.env.VITE_BACKEND_URL || "";
  if (!raw) return "";

  const parts = raw
    .split(/[,|]+/)
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean);

  const httpsUrl = parts.find((u) => u.startsWith("https://"));

  // If running on an HTTPS deployed domain, prefer the HTTPS backend URL
  if (typeof window !== "undefined" && window.location.protocol === "https:" && httpsUrl) {
    return httpsUrl;
  }

  return httpsUrl || parts[0] || "";
};

const backendUrl = getSanitizedBackendUrl();

if (!backendUrl && typeof window !== "undefined") {
  console.warn(
    "⚠️ [Axios Warning] VITE_BACKEND_URL environment variable is missing! API requests will fail if backend is hosted on another URL."
  );
}

/**
 * Pre-configured Axios instance.
 * - baseURL points to the backend API
 * - withCredentials ensures HttpOnly cookies (refresh token) are sent across origins
 */
const api = axios.create({
  baseURL: backendUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
