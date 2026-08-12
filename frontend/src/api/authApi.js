import api from "./axiosInstance";

/**
 * Register a new user account.
 * @param {{ name: string, email: string, password: string }} data
 */
export const registerUser = async ({ name, email, password }) => {
  const res = await api.post("/api/auth/register", { name, email, password });
  return res.data;
};

/**
 * Verify email with a 6-digit OTP.
 * @param {{ email: string, otp: string }} data
 */
export const verifyOtpApi = async ({ email, otp }) => {
  const res = await api.post("/api/auth/verify-otp", { email, otp });
  return res.data;
};

/**
 * Log in with email and password.
 * Returns { accessToken, user }.
 * @param {{ email: string, password: string }} data
 */
export const loginUser = async ({ email, password }) => {
  const res = await api.post("/api/auth/login", { email, password });
  return res.data;
};

/**
 * Refresh the access token using the HttpOnly refresh cookie.
 * Returns { accessToken, user }.
 */
export const refreshToken = async () => {
  const res = await api.post("/api/auth/refresh");
  return res.data;
};

/**
 * Log out — clears the refresh token cookie server-side.
 */
export const logoutUser = async () => {
  const res = await api.post("/api/auth/logout");
  return res.data;
};

/**
 * Fetch the current authenticated user's profile.
 */
export const fetchMe = async () => {
  const res = await api.get("/api/auth/me");
  return res.data;
};
