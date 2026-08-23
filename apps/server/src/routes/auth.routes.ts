import { Router } from "express";

import {
  register,
  login,
  getMe,
  updateMe
} from "../controllers/auth.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";
import { loginRateLimiter } from "../middleware/rate-limit.middleware.js";

const router = Router();

router.post("/login", loginRateLimiter, login);

router.post("/register", register);

router.get("/me", requireAuth, getMe);

router.patch("/me", requireAuth, updateMe);

export default router;