import { Request, Response } from "express";

import {
  getAllBooks,
  createBook,
  getBookById,
  getBookByISBN,
  updateBook,
  deleteBook,
  updateBookStatus,
} from "../services/books.service.js";

import type { AuthRequest } from "../middleware/auth.middleware.js";

/**
 * GET /books
 *
 * Retourne uniquement les livres publics.
 */
export async function getBooks(
  _req: Request,
  res: Response
) {
  try {
    const books = await getAllBooks();

    return res.json({
      books,
    });
  } catch (error) {
    console.error(
      "BOOKS ERROR:",
      error
    );

    return res.status(500).json({
      error: "Failed to fetch books",
    });
  }
}

/**
 * GET /books/:id
 *
 * Un livre public est accessible à tout le monde.
 * Un livre privé est uniquement accessible à son propriétaire.
 */
export async function getBook(
  req: AuthRequest,
  res: Response
) {
  try {
    const bookId =
      req.params.id as string;

    const book = await getBookById(
      bookId,
      req.userId
    );

    if (!book) {
      return res.status(404).json({
        error: "Book not found",
      });
    }

    return res.json({
      book,
    });
  } catch (error) {
    console.error(
      "GET BOOK ERROR:",
      error
    );

    return res.status(500).json({
      error: "Failed to fetch book",
    });
  }
}

/**
 * POST /books
 */
export async function addBook(
  req: AuthRequest,
  res: Response
) {
  try {
    const {
      isbn,
      title,
      author,
      theme,
      coverImageUrl,
      description,
      condition,
      visibility,
    } = req.body;

    console.log("VISIBILITY REÇUE:", visibility);
    console.log("BODY REÇU:", req.body);

    if (
      !title ||
      !title.trim()
    ) {
      return res.status(400).json({
        error: "title is required",
      });
    }

    if (!req.userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    if (
      visibility &&
      visibility !== "public" &&
      visibility !== "private"
    ) {
      return res.status(400).json({
        error:
          "visibility must be public or private",
      });
    }

    const book = await createBook({
      ownerId: req.userId,
      isbn,
      title,
      author,
      theme,
      coverImageUrl,
      description,
      condition,
      visibility,
    });

    return res.status(201).json({
      book,
    });
  } catch (error) {
    console.error(
      "CREATE BOOK ERROR:",
      error
    );

    if (
      error instanceof Error &&
      error.message.includes(
        "possèdes déjà"
      )
    ) {
      return res.status(409).json({
        error: error.message,
      });
    }

    return res.status(500).json({
      error: "Failed to create book",
    });
  }
}

/**
 * PATCH /books/:id/status
 */
export async function changeBookStatus(
  req: AuthRequest,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const bookId =
      req.params.id as string;

    const { status } = req.body;

    const book =
      await updateBookStatus(
        bookId,
        req.userId,
        status
      );

    return res.json({
      book,
    });
  } catch (error) {
    console.error(
      "UPDATE BOOK STATUS ERROR:",
      error
    );

    if (error instanceof Error) {
      if (
        error.message ===
        "Book not found"
      ) {
        return res.status(404).json({
          error: error.message,
        });
      }

      if (
        error.message ===
          "You are not the owner of this book" ||
        error.message ===
          "Invalid book status"
      ) {
        return res.status(403).json({
          error: error.message,
        });
      }
    }

    return res.status(500).json({
      error:
        "Failed to update book status",
    });
  }
}

/**
 * GET /books/isbn/:isbn
 */
export async function getBookISBN(
  req: Request,
  res: Response
) {
  try {
    const isbn =
      req.params.isbn as string;

    const book =
      await getBookByISBN(isbn);

    if (!book) {
      return res.status(404).json({
        error: "Book not found",
      });
    }

    return res.json({
      book,
    });
  } catch (error) {
    console.error(
      "GET BOOK ISBN ERROR:",
      error
    );

    return res.status(500).json({
      error:
        "Failed to fetch book information",
    });
  }
}

/**
 * PATCH /books/:id
 */
export async function editBook(
  req: AuthRequest,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const bookId =
      req.params.id as string;

    const {
      isbn,
      title,
      author,
      theme,
      coverImageUrl,
      description,
      condition,
      visibility,
    } = req.body;

    console.log("VISIBILITY REÇUE:", visibility);
    console.log("BODY REÇU:", req.body);

    if (
      !title ||
      !title.trim()
    ) {
      return res.status(400).json({
        error: "title is required",
      });
    }

    if (
      visibility &&
      visibility !== "public" &&
      visibility !== "private"
    ) {
      return res.status(400).json({
        error:
          "visibility must be public or private",
      });
    }

    const book = await updateBook(
      bookId,
      req.userId,
      {
        isbn,
        title: title.trim(),
        author,
        theme,
        coverImageUrl,
        description,
        condition,
        visibility,
      }
    );

    return res.json({
      book,
    });
  } catch (error) {
    console.error(
      "UPDATE BOOK ERROR:",
      error
    );

    if (error instanceof Error) {
      if (
        error.message ===
        "Book not found"
      ) {
        return res.status(404).json({
          error: error.message,
        });
      }

      if (
        error.message ===
        "You are not the owner of this book"
      ) {
        return res.status(403).json({
          error: error.message,
        });
      }
    }

    return res.status(500).json({
      error: "Failed to update book",
    });
  }
}

/**
 * DELETE /books/:id
 */
export async function removeBook(
  req: AuthRequest,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const bookId =
      req.params.id as string;

    await deleteBook(
      bookId,
      req.userId
    );

    return res.json({
      message:
        "Book deleted successfully",
    });
  } catch (error) {
    console.error(
      "DELETE BOOK ERROR:",
      error
    );

    if (error instanceof Error) {
      if (
        error.message ===
        "Book not found"
      ) {
        return res.status(404).json({
          error: error.message,
        });
      }

      if (
        error.message ===
        "You are not the owner of this book"
      ) {
        return res.status(403).json({
          error: error.message,
        });
      }

      if (
        error.message ===
        "Book is currently borrowed"
      ) {
        return res.status(409).json({
          error: error.message,
        });
      }
    }

    return res.status(500).json({
      error: "Failed to delete book",
    });
  }
}