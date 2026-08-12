import axios from "axios";

/**
 * Pre-configured Axios instance.
 * - baseURL points to the backend API
 * - withCredentials ensures HttpOnly cookies (refresh token) are sent
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
