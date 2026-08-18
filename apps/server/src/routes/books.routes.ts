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
  uploadBookCover,
} from "../controllers/books.controller.js";

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

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Invalid image type"));
    }

    cb(null, true);
  },
});

router.get("/", getBooks);
router.get("/isbn/:isbn", getBookISBN);
router.get("/:id", getBook);

router.post("/", requireAuth, addBook);

router.post(
  "/cover",
  requireAuth,
  upload.single("cover"),
  uploadBookCover
);

router.patch(
  "/:id/status",
  requireAuth,
  changeBookStatus
);

router.patch(
  "/:id",
  requireAuth,
  editBook
);

router.delete(
  "/:id",
  requireAuth,
  removeBook
);

export default router;