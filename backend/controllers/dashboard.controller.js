import Url from "../models/Url.js";

/**
 * GET /api/dashboard/my-urls
 * Returns all shortened URLs owned by the authenticated user,
 * ordered by creation date descending.
 */
export const getMyUrls = async (req, res, next) => {
  try {
    const urls = await Url.find({ owner: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ urls });
  } catch (error) {
    next(error);
  }
};
