import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

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
  baseURL: backendUrl || "",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
