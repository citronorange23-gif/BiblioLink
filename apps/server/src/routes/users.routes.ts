import { Router } from "express";
import {
  registerUser,
  getProfile,
  // updateMyProfile
} from "../controllers/users.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js"; // Adapte le chemin selon ton projet

const router = Router();

router.post("/", registerUser);
router.get("/:id", getProfile);

// // Route pour mettre à jour le profil de l'utilisateur connecté
// router.patch("/me", requireAuth, updateMyProfile);

export default router;