import express from "express";
import multer from "multer";

import {
  getBooks,
  getBook,
  addBook,
  changeBookStatus,
  getBookISBN,
  editBook,
  removeBook,
} from "../controllers/books.controller.js";

import { uploadBookCover } from "../controllers/book-cover.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (
      !allowedTypes.includes(
        file.mimetype
      )
    ) {
      return cb(
        new Error("Invalid image type")
      );
    }

    cb(null, true);
  },
});

/**
 * Tous les livres publics
 */
router.get("/", getBooks);

/**
 * Recherche ISBN
 */
router.get(
  "/isbn/:isbn",
  getBookISBN
);

/**
 * Livre spécifique
 *
 * Auth obligatoire pour pouvoir
 * vérifier si l'utilisateur est propriétaire
 * d'un livre privé.
 */
router.get(
  "/:id",
  requireAuth,
  getBook
);

/**
 * Créer un livre
 */
router.post(
  "/",
  requireAuth,
  addBook
);

/**
 * Upload couverture
 */
router.post(
  "/cover",
  requireAuth,
  upload.single("cover"),
  uploadBookCover
);

/**
 * Modifier statut
 */
router.patch(
  "/:id/status",
  requireAuth,
  changeBookStatus
);

/**
 * Modifier livre
 */
router.patch(
  "/:id",
  requireAuth,
  editBook
);

/**
 * Supprimer livre
 */
router.delete(
  "/:id",
  requireAuth,
  removeBook
);

export default router;