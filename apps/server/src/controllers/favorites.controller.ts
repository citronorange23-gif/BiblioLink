import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import {
  addFavorite,
  removeFavorite,
  getUserFavorites,
  getUsersWithFavoriteBooks,
} from "../services/favorites.service.js";

export async function createFavorite(
  req: AuthRequest,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const { bookId } = req.params;

    const favorite = await addFavorite(
      req.userId,
      bookId as string
    );

    return res.status(201).json({
      favorite,
    });
  } catch (error) {
    console.error("ADD FAVORITE ERROR:", error);

    if (
      error instanceof Error &&
      error.message === "Book not found"
    ) {
      return res.status(404).json({
        error: error.message,
      });
    }

    return res.status(500).json({
      error: "Failed to add favorite",
    });
  }
}

export async function deleteFavorite(
  req: AuthRequest,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const { bookId } = req.params;

    await removeFavorite(
      req.userId,
      bookId as string
    );

    return res.json({
      message: "Favorite removed",
    });
  } catch (error) {
    console.error("REMOVE FAVORITE ERROR:", error);

    if (
      error instanceof Error &&
      error.message === "Favorite not found"
    ) {
      return res.status(404).json({
        error: error.message,
      });
    }

    return res.status(500).json({
      error: "Failed to remove favorite",
    });
  }
}

export async function getFavorites(
  req: AuthRequest,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const favorites = await getUserFavorites(
      req.userId
    );

    return res.json({
      favorites,
    });
  } catch (error) {
    console.error("GET FAVORITES ERROR:", error);

    return res.status(500).json({
      error: "Failed to fetch favorites",
    });
  }
}

export async function getFavoriteHoldersMap(
  req: AuthRequest,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const books = await getUsersWithFavoriteBooks(req.userId);

    return res.json({
      books,
    });
  } catch (error) {
    console.error("FAVORITES MAP ERROR:", error);

    return res.status(500).json({
      error: "Failed to fetch favorites map data",
    });
  }
}