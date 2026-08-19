"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadBookCover = uploadBookCover;
const file_type_1 = require("file-type");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
async function uploadBookCover(req, res) {
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
        const uploadDirectory = path_1.default.resolve("uploads", "covers");
        await fs_1.promises.mkdir(uploadDirectory, {
            recursive: true,
        });
        const filePath = path_1.default.join(uploadDirectory, filename);
        await fs_1.promises.writeFile(filePath, req.file.buffer);
        const coverImageUrl = `/uploads/covers/${filename}`;
        return res.status(201).json({
            coverImageUrl,
        });
    }
    catch (error) {
        console.error("BOOK COVER UPLOAD ERROR:", error);
        return res.status(500).json({
            error: "Failed to upload book cover",
        });
    }
}
