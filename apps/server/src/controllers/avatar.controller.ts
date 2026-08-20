import { Response } from "express";
import { fileTypeFromBuffer } from "file-type";
import { put } from "@vercel/blob";
import crypto from "crypto";

import { AuthRequest } from "../middleware/auth.middleware.js";
import { prisma } from "../lib/prisma.js";

export async function uploadAvatar(
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
      `avatars/${filename}`,
      req.file.buffer,
      {
        access: "public",
        contentType: detectedType.mime,
      }
    );

    const avatarUrl = blob.url;

    const user = await prisma.user.update({
      where: {
        id: req.userId,
      },

      data: {
        avatarUrl,
      },

      select: {
        id: true,
        username: true,
        avatarUrl: true,
        bio: true,
        neighborhood: true,
      },
    });

    return res.json({
      user,
    });
  } catch (error) {
    console.error("AVATAR UPLOAD ERROR:", error);

    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to upload avatar",
    });
  }
}