"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBooks = getBooks;
exports.getBook = getBook;
exports.addBook = addBook;
exports.changeBookStatus = changeBookStatus;
exports.getBookISBN = getBookISBN;
exports.editBook = editBook;
exports.removeBook = removeBook;
exports.uploadBookCover = uploadBookCover;
const books_service_js_1 = require("../services/books.service.js");
const file_type_1 = require("file-type");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
async function getBooks(_req, res) {
    try {
        const books = await (0, books_service_js_1.getAllBooks)();
        return res.json({
            books
        });
    }
    catch (error) {
        console.error("BOOKS ERROR:", error);
        return res.status(500).json({
            error: "Failed to fetch books"
        });
    }
}
async function getBook(req, res) {
    try {
        const bookId = req.params.id;
        const book = await (0, books_service_js_1.getBookById)(bookId);
        if (!book) {
            return res.status(404).json({
                error: "Book not found",
            });
        }
        return res.json({
            book,
        });
    }
    catch (error) {
        console.error("GET BOOK ERROR:", error);
        return res.status(500).json({
            error: "Failed to fetch book",
        });
    }
}
async function addBook(req, res) {
    try {
        const { isbn, title, author, theme, coverImageUrl, description, condition } = req.body;
        if (!title) {
            return res.status(400).json({
                error: "title is required"
            });
        }
        if (!req.userId) {
            return res.status(401).json({
                error: "Authentication required"
            });
        }
        const book = await (0, books_service_js_1.createBook)({
            ownerId: req.userId,
            isbn,
            title,
            author,
            theme,
            coverImageUrl,
            description,
            condition
        });
        return res.status(201).json({
            book
        });
    }
    catch (error) {
        console.error("CREATE BOOK ERROR:", error);
        // Interception de l'erreur du service si le livre existe déjà
        if (error instanceof Error && error.message.includes("possèdes déjà")) {
            return res.status(409).json({
                error: error.message
            });
        }
        return res.status(500).json({
            error: "Failed to create book"
        });
    }
}
async function changeBookStatus(req, res) {
    try {
        if (!req.userId) {
            return res.status(401).json({
                error: "Authentication required"
            });
        }
        const bookId = req.params.id;
        const { status } = req.body;
        const book = await (0, books_service_js_1.updateBookStatus)(bookId, req.userId, status);
        return res.json({
            book
        });
    }
    catch (error) {
        console.error("UPDATE BOOK STATUS ERROR:", error);
        if (error instanceof Error) {
            if (error.message === "Book not found") {
                return res.status(404).json({
                    error: error.message
                });
            }
            if (error.message === "You are not the owner of this book" ||
                error.message === "Invalid book status") {
                return res.status(403).json({
                    error: error.message
                });
            }
        }
        return res.status(500).json({
            error: "Failed to update book status"
        });
    }
}
async function getBookISBN(req, res) {
    try {
        const isbn = req.params.isbn;
        const book = await (0, books_service_js_1.getBookByISBN)(isbn);
        if (!book) {
            return res.status(404).json({
                error: "Book not found"
            });
        }
        return res.json({
            book
        });
    }
    catch (error) {
        console.error("GET BOOK ISBN ERROR:", error);
        return res.status(500).json({
            error: "Failed to fetch book information"
        });
    }
}
async function editBook(req, res) {
    try {
        if (!req.userId) {
            return res.status(401).json({
                error: "Authentication required"
            });
        }
        const bookId = req.params.id;
        const { isbn, title, author, theme, coverImageUrl, description, condition } = req.body;
        if (!title || !title.trim()) {
            return res.status(400).json({
                error: "title is required"
            });
        }
        const book = await (0, books_service_js_1.updateBook)(bookId, req.userId, {
            isbn,
            title: title.trim(),
            author,
            theme,
            coverImageUrl,
            description,
            condition
        });
        return res.json({
            book
        });
    }
    catch (error) {
        console.error("UPDATE BOOK ERROR:", error);
        if (error instanceof Error) {
            if (error.message === "Book not found") {
                return res.status(404).json({
                    error: error.message
                });
            }
            if (error.message === "You are not the owner of this book") {
                return res.status(403).json({
                    error: error.message
                });
            }
        }
        return res.status(500).json({
            error: "Failed to update book"
        });
    }
}
async function removeBook(req, res) {
    try {
        if (!req.userId) {
            return res.status(401).json({
                error: "Authentication required"
            });
        }
        const bookId = req.params.id;
        await (0, books_service_js_1.deleteBook)(bookId, req.userId);
        return res.json({
            message: "Book deleted successfully"
        });
    }
    catch (error) {
        console.error("DELETE BOOK ERROR:", error);
        if (error instanceof Error) {
            if (error.message === "Book not found") {
                return res.status(404).json({
                    error: error.message
                });
            }
            if (error.message === "You are not the owner of this book") {
                return res.status(403).json({
                    error: error.message
                });
            }
            if (error.message === "Book is currently borrowed") {
                return res.status(409).json({
                    error: error.message
                });
            }
        }
        return res.status(500).json({
            error: "Failed to delete book"
        });
    }
}
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
        const uploadDirectory = path_1.default.resolve("uploads", "books");
        await fs_1.promises.mkdir(uploadDirectory, {
            recursive: true,
        });
        const filePath = path_1.default.join(uploadDirectory, filename);
        await fs_1.promises.writeFile(filePath, req.file.buffer);
        const coverImageUrl = `/uploads/books/${filename}`;
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
console.log("CONTROLLER SELF-CHECK:", typeof getBook, getBook.name);
