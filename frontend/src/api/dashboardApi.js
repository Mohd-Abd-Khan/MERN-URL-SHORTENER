import api from "./axiosInstance";

/**
 * Fetch all URLs created by the authenticated user.
 * @returns {Promise<Array>} Array of URL documents
 */
export const fetchMyUrls = async () => {
  const res = await api.get("/api/dashboard/my-urls");
  return res.data.urls;
};
