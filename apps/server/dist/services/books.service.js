"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllBooks = getAllBooks;
exports.createBook = createBook;
exports.updateBookStatus = updateBookStatus;
exports.getBookById = getBookById;
exports.getBookByISBN = getBookByISBN;
exports.updateBook = updateBook;
exports.deleteBook = deleteBook;
const prisma_js_1 = require("../lib/prisma.js");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const API_URL = "http://localhost:4000";
/**
 * Dossier où les couvertures seront sauvegardées.
 *
 * apps/server/
 * └── uploads/
 *     └── covers/
 */
// Remplacez la définition de coversDirectory par ceci :
const coversDirectory = path_1.default.resolve(process.cwd(), "uploads", "covers");
// Vérifiez aussi que le dossier est bien créé
async function ensureCoversDirectory() {
    await promises_1.default.mkdir(coversDirectory, {
        recursive: true,
    });
}
/**
 * Télécharge une couverture OpenLibrary
 * et la sauvegarde localement.
 */
async function downloadCover(coverId) {
    try {
        await ensureCoversDirectory();
        const openLibraryUrl = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
        const response = await fetch(openLibraryUrl);
        if (!response.ok) {
            console.error("OPENLIBRARY COVER ERROR:", response.status, response.statusText);
            return undefined;
        }
        const contentType = response.headers.get("content-type");
        if (!contentType ||
            !contentType.startsWith("image/")) {
            console.error("OPENLIBRARY DID NOT RETURN AN IMAGE:", contentType);
            return undefined;
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileName = `${crypto_1.default.randomUUID()}.jpg`;
        const filePath = path_1.default.join(coversDirectory, fileName);
        await promises_1.default.writeFile(filePath, buffer);
        console.log(`Cover downloaded: ${fileName}`);
        return `${API_URL}/uploads/covers/${fileName}`;
    }
    catch (error) {
        console.error("COVER DOWNLOAD ERROR:", error);
        return undefined;
    }
}
/**
 * Retourne tous les livres.
 */
async function getAllBooks() {
    return prisma_js_1.prisma.book.findMany({
        include: {
            owner: {
                select: {
                    id: true,
                    username: true,
                    avatarUrl: true,
                    bio: true,
                    neighborhood: true,
                    createdAt: true,
                },
            },
        },
    });
}
/**
 * Crée un livre.
 */
async function createBook(data) {
    // Nettoyage de l'ISBN
    const cleanISBN = data.isbn
        ? data.isbn.replace(/[-\s]/g, "")
        : undefined;
    // Vérifier si l'utilisateur possède déjà ce livre
    if (cleanISBN) {
        const existingBook = await prisma_js_1.prisma.book.findFirst({
            where: {
                ownerId: data.ownerId,
                isbn: cleanISBN,
            },
        });
        if (existingBook) {
            throw new Error("Tu possèdes déjà ce livre (même ISBN) dans ta bibliothèque.");
        }
    }
    // Création du livre
    return prisma_js_1.prisma.book.create({
        data: {
            ...data,
            isbn: cleanISBN,
            title: data.title.trim(),
            author: data.author?.trim(),
        },
    });
}
/**
 * Modifier le statut d'un livre.
 */
async function updateBookStatus(bookId, userId, status) {
    const book = await prisma_js_1.prisma.book.findUnique({
        where: {
            id: bookId,
        },
    });
    if (!book) {
        throw new Error("Book not found");
    }
    if (book.ownerId !== userId) {
        throw new Error("You are not the owner of this book");
    }
    if (status !== "available" &&
        status !== "borrowed") {
        throw new Error("Invalid book status");
    }
    return prisma_js_1.prisma.book.update({
        where: {
            id: bookId,
        },
        data: {
            status,
        },
    });
}
/**
 * Récupérer un livre par son ID.
 */
async function getBookById(bookId) {
    return prisma_js_1.prisma.book.findUnique({
        where: {
            id: bookId,
        },
        include: {
            owner: {
                select: {
                    id: true,
                    username: true,
                    avatarUrl: true,
                    bio: true,
                    neighborhood: true,
                    createdAt: true,
                },
            },
        },
    });
}
/**
 * Recherche un livre par ISBN
 * via OpenLibrary.
 *
 * La couverture est téléchargée localement
 * afin de ne plus dépendre d'OpenLibrary
 * pour l'affichage.
 */
async function getBookByISBN(isbn) {
    const cleanISBN = isbn.replace(/[-\s]/g, "");
    const response = await fetch(`https://openlibrary.org/search.json?isbn=${encodeURIComponent(cleanISBN)}`);
    if (!response.ok) {
        throw new Error("Failed to search book");
    }
    const data = await response.json();
    if (!data.docs ||
        data.docs.length === 0) {
        return null;
    }
    const book = data.docs[0];
    let coverImageUrl;
    /**
     * Si OpenLibrary possède une couverture,
     * on la télécharge chez nous.
     */
    if (book.cover_i) {
        coverImageUrl =
            await downloadCover(Number(book.cover_i));
    }
    return {
        isbn: cleanISBN,
        title: book.title ?? "",
        author: book.author_name?.[0] ??
            undefined,
        coverImageUrl,
    };
}
/**
 * Modifier un livre.
 */
async function updateBook(bookId, userId, data) {
    const book = await prisma_js_1.prisma.book.findUnique({
        where: {
            id: bookId,
        },
    });
    if (!book) {
        throw new Error("Book not found");
    }
    if (book.ownerId !== userId) {
        throw new Error("You are not the owner of this book");
    }
    return prisma_js_1.prisma.book.update({
        where: {
            id: bookId,
        },
        data: {
            ...data,
            isbn: data.isbn
                ? data.isbn.replace(/[-\s]/g, "")
                : undefined,
            title: data.title.trim(),
            author: data.author?.trim() ||
                undefined,
            theme: data.theme?.trim() ||
                undefined,
            description: data.description?.trim() ||
                undefined,
        },
    });
}
/**
 * Supprimer un livre.
 */
async function deleteBook(bookId, userId) {
    const book = await prisma_js_1.prisma.book.findUnique({
        where: {
            id: bookId,
        },
    });
    if (!book) {
        throw new Error("Book not found");
    }
    if (book.ownerId !== userId) {
        throw new Error("You are not the owner of this book");
    }
    if (book.status === "borrowed") {
        throw new Error("Book is currently borrowed");
    }
    return prisma_js_1.prisma.book.delete({
        where: {
            id: bookId,
        },
    });
}
