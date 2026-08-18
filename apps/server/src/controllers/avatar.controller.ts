import { Response } from "express";
import { fileTypeFromBuffer } from "file-type";
import { promises as fs } from "fs";
import path from "path";
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

    const uploadDirectory = path.resolve(
      "uploads",
      "avatars"
    );

    await fs.mkdir(uploadDirectory, {
      recursive: true,
    });

    const filePath = path.join(
      uploadDirectory,
      filename
    );

    await fs.writeFile(
      filePath,
      req.file.buffer
    );

    const avatarUrl =
      `/uploads/avatars/${filename}`;

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
      error: "Failed to upload avatar",
    });
  }
}