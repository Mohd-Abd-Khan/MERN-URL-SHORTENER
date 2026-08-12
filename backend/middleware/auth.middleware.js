import { verifyAccessToken } from "../utils/token.util.js";

/**
 * Authentication middleware — required auth.
 * Validates the JWT access token from the Authorization: Bearer header.
 * Attaches decoded user payload { id, email } to req.user.
 * Returns 401 with a generic message on any failure (avoids leaking info).
 */
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch (error) {
    return res.status(401).json({ error: "Authentication required" });
  }
};

export default authMiddleware;
