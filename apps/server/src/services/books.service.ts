import { prisma } from "../lib/prisma.js";
import { put } from "@vercel/blob";
import crypto from "crypto";

/**
 * Télécharge une couverture OpenLibrary
 * et la sauvegarde sur Vercel Blob.
 */
async function downloadCover(
  coverId: number
): Promise<string | undefined> {
  try {
    const openLibraryUrl = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;

    const response = await fetch(openLibraryUrl);

    if (!response.ok) {
      console.error(
        "OPENLIBRARY COVER ERROR:",
        response.status,
        response.statusText
      );

      return undefined;
    }

    const contentType = response.headers.get("content-type");

    if (
      !contentType ||
      !contentType.startsWith("image/")
    ) {
      console.error(
        "OPENLIBRARY DID NOT RETURN AN IMAGE:",
        contentType
      );

      return undefined;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileName = `${crypto.randomUUID()}.jpg`;

    const blob = await put(
      `covers/${fileName}`,
      buffer,
      {
        access: "public",
        contentType,
      }
    );

    console.log(
      `Cover uploaded to Vercel Blob: ${blob.url}`
    );

    return blob.url;
  } catch (error) {
    console.error(
      "COVER DOWNLOAD ERROR:",
      error
    );

    return undefined;
  }
}

/**
 * Retourne tous les livres publics.
 */
export async function getAllBooks() {
  return prisma.book.findMany({
    where: {
      visibility: "public",
    },

    include: {
      owner: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          bio: true,
          neighborhood: true,
          latitude: true,
          longitude: true,
          createdAt: true,
        },
      },
    },
  });
}

/**
 * Crée un livre.
 */
export async function createBook(data: {
  ownerId: string;
  isbn?: string;
  title: string;
  author?: string;
  theme?: string;
  coverImageUrl?: string;
  description?: string;
  condition?: string;
  visibility?: "public" | "private";
}) {
  const cleanISBN = data.isbn
    ? data.isbn.replace(/[-\s]/g, "")
    : undefined;

  /**
   * Vérifier que la visibilité est valide.
   */
  if (
    data.visibility !== undefined &&
    data.visibility !== "public" &&
    data.visibility !== "private"
  ) {
    throw new Error(
      "Invalid book visibility"
    );
  }

  /**
   * Vérifier si l'utilisateur possède
   * déjà un livre avec le même ISBN.
   */
  if (cleanISBN) {
    const existingBook =
      await prisma.book.findFirst({
        where: {
          ownerId: data.ownerId,
          isbn: cleanISBN,
        },
      });

    if (existingBook) {
      throw new Error(
        "Tu possèdes déjà ce livre (même ISBN) dans ta bibliothèque."
      );
    }
  }

  return prisma.book.create({
    data: {
      ...data,

      isbn: cleanISBN,

      title: data.title.trim(),

      author:
        data.author?.trim() || undefined,

      condition:
        data.condition?.trim() || "Français",

      /**
       * Public par défaut.
       */
      visibility:
        data.visibility || "public",
    },
  });
}

/**
 * Modifier le statut d'un livre.
 */
export async function updateBookStatus(
  bookId: string,
  userId: string,
  status: string
) {
  const book = await prisma.book.findUnique({
    where: {
      id: bookId,
    },
  });

  if (!book) {
    throw new Error("Book not found");
  }

  if (book.ownerId !== userId) {
    throw new Error(
      "You are not the owner of this book"
    );
  }

  if (
    status !== "available" &&
    status !== "borrowed"
  ) {
    throw new Error(
      "Invalid book status"
    );
  }

  return prisma.book.update({
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
 *
 * Un livre est accessible si :
 * - il est public
 * OU
 * - l'utilisateur connecté est le propriétaire.
 */
export async function getBookById(
  bookId: string,
  userId?: string
) {
  return prisma.book.findFirst({
    where: {
      id: bookId,

      OR: [
        {
          visibility: "public",
        },
        {
          ownerId: userId,
        },
      ],
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
 * Recherche un livre par ISBN via OpenLibrary.
 */
export async function getBookByISBN(
  isbn: string
) {
  const cleanISBN =
    isbn.replace(/[-\s]/g, "");

  const response = await fetch(
    `https://openlibrary.org/search.json?isbn=${encodeURIComponent(
      cleanISBN
    )}`
  );

  if (!response.ok) {
    throw new Error(
      "Failed to search book"
    );
  }

  const data =
    await response.json();

  if (
    !data.docs ||
    data.docs.length === 0
  ) {
    return null;
  }

  const book = data.docs[0];

  let coverImageUrl:
    | string
    | undefined;

  if (book.cover_i) {
    coverImageUrl =
      await downloadCover(
        Number(book.cover_i)
      );
  }

  return {
    isbn: cleanISBN,

    title:
      book.title ?? "",

    author:
      book.author_name?.[0] ??
      undefined,

    coverImageUrl,
  };
}

/**
 * Modifier un livre.
 */
export async function updateBook(
  bookId: string,
  userId: string,
  data: {
    isbn?: string;
    title: string;
    author?: string;
    theme?: string;
    coverImageUrl?: string;
    description?: string;
    condition?: string;
    visibility?: "public" | "private";
  }
) {
  const book =
    await prisma.book.findUnique({
      where: {
        id: bookId,
      },
    });

  if (!book) {
    throw new Error(
      "Book not found"
    );
  }

  if (book.ownerId !== userId) {
    throw new Error(
      "You are not the owner of this book"
    );
  }

  /**
   * Vérifier que la visibilité est valide.
   */
  if (
    data.visibility !== undefined &&
    data.visibility !== "public" &&
    data.visibility !== "private"
  ) {
    throw new Error(
      "Invalid book visibility"
    );
  }

  return prisma.book.update({
    where: {
      id: bookId,
    },

    data: {
      ...data,

      isbn: data.isbn
        ? data.isbn.replace(
            /[-\s]/g,
            ""
          )
        : undefined,

      title:
        data.title.trim(),

      author:
        data.author?.trim() ||
        undefined,

      theme:
        data.theme?.trim() ||
        undefined,

      description:
        data.description?.trim() ||
        undefined,

      condition:
        data.condition?.trim() ||
        book.condition,

      visibility:
        data.visibility ??
        book.visibility,
    },
  });
}

/**
 * Supprimer un livre.
 */
export async function deleteBook(
  bookId: string,
  userId: string
) {
  const book =
    await prisma.book.findUnique({
      where: {
        id: bookId,
      },
    });

  if (!book) {
    throw new Error(
      "Book not found"
    );
  }

  if (book.ownerId !== userId) {
    throw new Error(
      "You are not the owner of this book"
    );
  }

  if (book.status === "borrowed") {
    throw new Error(
      "Book is currently borrowed"
    );
  }

  return prisma.book.delete({
    where: {
      id: bookId,
    },
  });
}