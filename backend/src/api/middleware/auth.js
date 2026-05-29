import { config } from "../../../config/index.js";

export function requireAuth(req, res, next) {
  if (!config.apiToken) return next();

  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (token !== config.apiToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  return next();
}
