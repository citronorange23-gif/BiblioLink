"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addFavorite = addFavorite;
exports.removeFavorite = removeFavorite;
exports.getUserFavorites = getUserFavorites;
exports.getUsersWithFavoriteBooks = getUsersWithFavoriteBooks;
const prisma_js_1 = require("../lib/prisma.js");
async function addFavorite(userId, bookId) {
    const book = await prisma_js_1.prisma.book.findUnique({
        where: {
            id: bookId,
        },
    });
    if (!book) {
        throw new Error("Book not found");
    }
    const favorite = await prisma_js_1.prisma.favorite.upsert({
        where: {
            userId_bookId: {
                userId,
                bookId,
            },
        },
        update: {},
        create: {
            userId,
            bookId,
        },
        include: {
            book: true,
        },
    });
    return favorite;
}
async function removeFavorite(userId, bookId) {
    const favorite = await prisma_js_1.prisma.favorite.findUnique({
        where: {
            userId_bookId: {
                userId,
                bookId,
            },
        },
    });
    if (!favorite) {
        throw new Error("Favorite not found");
    }
    await prisma_js_1.prisma.favorite.delete({
        where: {
            id: favorite.id,
        },
    });
}
async function getUserFavorites(userId) {
    return prisma_js_1.prisma.favorite.findMany({
        where: {
            userId,
        },
        include: {
            book: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}
async function getUsersWithFavoriteBooks(userId) {
    const userFavorites = await prisma_js_1.prisma.favorite.findMany({
        where: { userId },
        include: {
            book: {
                include: {
                    owner: {
                        select: {
                            id: true,
                            username: true,
                            latitude: true,
                            longitude: true,
                            neighborhood: true,
                        },
                    },
                },
            },
        },
    });
    return userFavorites
        .map((fav) => fav.book)
        .filter((book) => book.ownerId !== userId && book.status === "available");
}
