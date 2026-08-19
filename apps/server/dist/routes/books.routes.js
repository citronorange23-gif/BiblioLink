"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const books_controller_js_1 = require("../controllers/books.controller.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const router = express_1.default.Router();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
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
router.get("/", books_controller_js_1.getBooks);
router.get("/isbn/:isbn", books_controller_js_1.getBookISBN);
router.get("/:id", books_controller_js_1.getBook);
router.post("/", auth_middleware_js_1.requireAuth, books_controller_js_1.addBook);
router.post("/cover", auth_middleware_js_1.requireAuth, upload.single("cover"), books_controller_js_1.uploadBookCover);
router.patch("/:id/status", auth_middleware_js_1.requireAuth, books_controller_js_1.changeBookStatus);
router.patch("/:id", auth_middleware_js_1.requireAuth, books_controller_js_1.editBook);
router.delete("/:id", auth_middleware_js_1.requireAuth, books_controller_js_1.removeBook);
exports.default = router;
