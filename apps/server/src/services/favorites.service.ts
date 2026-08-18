import { prisma } from "../lib/prisma.js";

export async function addFavorite(
  userId: string,
  bookId: string
) {
  const book = await prisma.book.findUnique({
    where: {
      id: bookId,
    },
  });

  if (!book) {
    throw new Error("Book not found");
  }

  const favorite = await prisma.favorite.upsert({
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

export async function removeFavorite(
  userId: string,
  bookId: string
) {
  const favorite = await prisma.favorite.findUnique({
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

  await prisma.favorite.delete({
    where: {
      id: favorite.id,
    },
  });
}

export async function getUserFavorites(userId: string) {
  return prisma.favorite.findMany({
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

export async function getUsersWithFavoriteBooks(userId: string) {
  const userFavorites = await prisma.favorite.findMany({
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
    .filter(
      (book) => book.ownerId !== userId && book.status === "available"
    );
}