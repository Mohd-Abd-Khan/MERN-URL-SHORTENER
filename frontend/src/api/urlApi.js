import api from "./axiosInstance";

/**
 * Calls the backend to shorten a URL.
 * @param {string} originalUrl - The long URL to shorten.
 * @returns {Promise<string>} The shortened URL string.
 */
export const shortenUrl = async (originalUrl) => {
  const res = await api.post("/api/shortener", { originalUrl });
  return res.data.shortUrl;
};
