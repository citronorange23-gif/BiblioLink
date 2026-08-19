"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAvatar = uploadAvatar;
const file_type_1 = require("file-type");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const prisma_js_1 = require("../lib/prisma.js");
async function uploadAvatar(req, res) {
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
        const detectedType = await (0, file_type_1.fileTypeFromBuffer)(req.file.buffer);
        const allowedTypes = new Set([
            "image/jpeg",
            "image/png",
            "image/webp",
        ]);
        if (!detectedType ||
            !allowedTypes.has(detectedType.mime)) {
            return res.status(400).json({
                error: "The uploaded file is not a valid image",
            });
        }
        const extension = detectedType.ext === "jpg"
            ? "jpg"
            : detectedType.ext;
        const filename = `${crypto_1.default.randomUUID()}.${extension}`;
        const uploadDirectory = path_1.default.resolve("uploads", "avatars");
        await fs_1.promises.mkdir(uploadDirectory, {
            recursive: true,
        });
        const filePath = path_1.default.join(uploadDirectory, filename);
        await fs_1.promises.writeFile(filePath, req.file.buffer);
        const avatarUrl = `/uploads/avatars/${filename}`;
        const user = await prisma_js_1.prisma.user.update({
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
    }
    catch (error) {
        console.error("AVATAR UPLOAD ERROR:", error);
        return res.status(500).json({
            error: "Failed to upload avatar",
        });
    }
}
