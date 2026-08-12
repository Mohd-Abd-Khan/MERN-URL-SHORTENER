import Url from "../models/Url.js";
import { nanoid } from "nanoid";

/**
 * POST /api/shortener
 * Creates a new short URL or returns an existing one if the original URL
 * has already been shortened.
 */
export const createShortUrl = async (req, res, next) => {
  try {
    let { originalUrl } = req.body;

    if (!originalUrl) {
      return res.status(400).json({ error: "URL is required" });
    }

    originalUrl = originalUrl.trim();
    if (!/^https?:\/\//i.test(originalUrl)) {
      originalUrl = `https://${originalUrl}`;
    }

    try {
      new URL(originalUrl);
    } catch {
      return res.status(400).json({ error: "Invalid URL format" });
    }

    // Check if originalUrl already exists in database
    const existingUrl = await Url.findOne({ originalUrl });
    if (existingUrl) {
      const shortUrl = `${process.env.BASE_URL}/${existingUrl.shortId}`;
      return res.status(200).json({ shortUrl });
    }

    // Generate unique shortId
    let shortId;
    let exists = true;
    while (exists) {
      shortId = nanoid(7);
      exists = await Url.findOne({ shortId });
    }

    await Url.create({
      originalUrl,
      shortId,
      owner: req.user?.id || null,
    });

    const shortUrl = `${process.env.BASE_URL}/${shortId}`;
    return res.status(201).json({ shortUrl });
  } catch (err) {
    console.error("Error creating short URL:", err);
    next(err);
  }
};

/**
 * GET /:shortId
 * Looks up the short ID, increments the click counter, and redirects
 * the client to the original URL.
 */
export const redirectToOriginal = async (req, res, next) => {
  try {
    const { shortId } = req.params;

    // Ignore browser favicon requests
    if (shortId === "favicon.ico") {
      return res.status(204).end();
    }

    const url = await Url.findOne({ shortId });
    if (!url) {
      return res.status(404).json({ error: "URL not found" });
    }

    url.clicks += 1;
    await url.save();

    return res.redirect(url.originalUrl);
  } catch (error) {
    console.error("Error during redirect:", error);
    next(error);
  }
};
