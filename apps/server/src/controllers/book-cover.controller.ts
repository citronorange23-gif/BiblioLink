import { Response } from "express";
import { fileTypeFromBuffer } from "file-type";
import { put } from "@vercel/blob";
import crypto from "crypto";

import { AuthRequest } from "../middleware/auth.middleware.js";

export async function uploadBookCover(
  req: AuthRequest,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: "No image provided",
      });
    }

    const detectedType = await fileTypeFromBuffer(
      req.file.buffer
    );

    const allowedTypes = new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
    ]);

    if (
      !detectedType ||
      !allowedTypes.has(detectedType.mime)
    ) {
      return res.status(400).json({
        error: "The uploaded file is not a valid image",
      });
    }

    const extension =
      detectedType.ext === "jpg"
        ? "jpg"
        : detectedType.ext;

    const filename =
      `${crypto.randomUUID()}.${extension}`;

    const blob = await put(
      `covers/${filename}`,
      req.file.buffer,
      {
        access: "public",
        contentType: detectedType.mime,
      }
    );

    return res.status(201).json({
      coverImageUrl: blob.url,
    });
  } catch (error) {
    console.error(
      "BOOK COVER UPLOAD ERROR:",
      error
    );

    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to upload book cover",
    });
  }
}