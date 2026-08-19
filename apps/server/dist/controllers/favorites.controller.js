"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFavorite = createFavorite;
exports.deleteFavorite = deleteFavorite;
exports.getFavorites = getFavorites;
exports.getFavoriteHoldersMap = getFavoriteHoldersMap;
const favorites_service_js_1 = require("../services/favorites.service.js");
async function createFavorite(req, res) {
    try {
        if (!req.userId) {
            return res.status(401).json({
                error: "Authentication required",
            });
        }
        const { bookId } = req.params;
        const favorite = await (0, favorites_service_js_1.addFavorite)(req.userId, bookId);
        return res.status(201).json({
            favorite,
        });
    }
    catch (error) {
        console.error("ADD FAVORITE ERROR:", error);
        if (error instanceof Error &&
            error.message === "Book not found") {
            return res.status(404).json({
                error: error.message,
            });
        }
        return res.status(500).json({
            error: "Failed to add favorite",
        });
    }
}
async function deleteFavorite(req, res) {
    try {
        if (!req.userId) {
            return res.status(401).json({
                error: "Authentication required",
            });
        }
        const { bookId } = req.params;
        await (0, favorites_service_js_1.removeFavorite)(req.userId, bookId);
        return res.json({
            message: "Favorite removed",
        });
    }
    catch (error) {
        console.error("REMOVE FAVORITE ERROR:", error);
        if (error instanceof Error &&
            error.message === "Favorite not found") {
            return res.status(404).json({
                error: error.message,
            });
        }
        return res.status(500).json({
            error: "Failed to remove favorite",
        });
    }
}
async function getFavorites(req, res) {
    try {
        if (!req.userId) {
            return res.status(401).json({
                error: "Authentication required",
            });
        }
        const favorites = await (0, favorites_service_js_1.getUserFavorites)(req.userId);
        return res.json({
            favorites,
        });
    }
    catch (error) {
        console.error("GET FAVORITES ERROR:", error);
        return res.status(500).json({
            error: "Failed to fetch favorites",
        });
    }
}
async function getFavoriteHoldersMap(req, res) {
    try {
        if (!req.userId) {
            return res.status(401).json({
                error: "Authentication required",
            });
        }
        const books = await (0, favorites_service_js_1.getUsersWithFavoriteBooks)(req.userId);
        return res.json({
            books,
        });
    }
    catch (error) {
        console.error("FAVORITES MAP ERROR:", error);
        return res.status(500).json({
            error: "Failed to fetch favorites map data",
        });
    }
}
