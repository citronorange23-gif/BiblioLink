import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth.middleware.js";
import { uploadAvatar } from "../controllers/avatar.controller.js";
import { uploadBookCover } from "../controllers/book-cover.controller.js";


const router = Router();

const storage = multer.memoryStorage();

const upload = multer({
  storage,

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

router.post(
  "/avatar",
  requireAuth,
  upload.single("avatar"),
  uploadAvatar
);

router.post(
  "/cover",
  requireAuth,
  upload.single("cover"),
  uploadBookCover
);

export default router;