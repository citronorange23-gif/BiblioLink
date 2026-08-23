import rateLimit from "express-rate-limit";

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10, // maximum 10 tentatives
  standardHeaders: "draft-8",
  legacyHeaders: false,

  message: {
    error: "Trop de tentatives de connexion. Réessaie plus tard.",
  },
});