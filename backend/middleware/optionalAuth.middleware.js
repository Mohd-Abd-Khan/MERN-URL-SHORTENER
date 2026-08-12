import { verifyAccessToken } from "../utils/token.util.js";

/**
 * Optional authentication middleware.
 * If a valid Bearer token is present, attaches req.user = { id, email }.
 * If missing or invalid, sets req.user = null and proceeds — does NOT block.
 * Used on routes where auth is optional (e.g., URL shortener supports both
 * anonymous and authenticated shortening).
 */
const optionalAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    req.user = { id: decoded.id, email: decoded.email };
  } catch {
    req.user = null;
  }

  next();
};

export default optionalAuthMiddleware;
