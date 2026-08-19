"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const avatar_controller_js_1 = require("../controllers/avatar.controller.js");
const book_cover_controller_js_1 = require("../controllers/book-cover.controller.js");
const router = (0, express_1.Router)();
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
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
router.post("/avatar", auth_middleware_js_1.requireAuth, upload.single("avatar"), avatar_controller_js_1.uploadAvatar);
router.post("/cover", auth_middleware_js_1.requireAuth, upload.single("cover"), book_cover_controller_js_1.uploadBookCover);
exports.default = router;
