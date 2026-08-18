import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  createFavorite,
  deleteFavorite,
  getFavorites,
  getFavoriteHoldersMap,
} from "../controllers/favorites.controller.js";

const router = Router();

// DOIT ÊTRE EN HAUT (avant /:bookId)
router.get("/map", requireAuth, getFavoriteHoldersMap);

router.get("/", requireAuth, getFavorites);
router.post("/:bookId", requireAuth, createFavorite);
router.delete("/:bookId", requireAuth, deleteFavorite);

export default router;