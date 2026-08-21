import { Router } from "express";

import {
  registerUser,
  getProfile,
  getCurrentUser,
} from "../controllers/users.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", registerUser);

// /me AVANT /:id
router.get("/me", requireAuth, getCurrentUser);

router.get("/:id", getProfile);

export default router;