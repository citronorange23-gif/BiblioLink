"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BookCover from "@/components/BookCover";

const API_URL = "http://localhost:4000";

type Book = {
  id: string;
  title: string;
  author: string | null;
  theme: string | null;
  coverImageUrl: string | null;
  status: string;
  condition: string;
};

type Favorite = {
  id: string;
  bookId: string;
  book: Book;
};

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchFavorites() {
      const token =
        localStorage.getItem("token") ??
        localStorage.getItem("accessToken");

      if (!token) {
        setError("Tu dois être connecté pour voir tes favoris.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/favorites`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Impossible de récupérer les favoris."
          );
        }

        setFavorites(data.favorites ?? []);
      } catch (error) {
        console.error("GET FAVORITES ERROR:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Impossible de récupérer les favoris."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchFavorites();
  }, []);

  async function removeFavorite(bookId: string) {
    const token =
      localStorage.getItem("token") ??
      localStorage.getItem("accessToken");

    if (!token) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/favorites/${bookId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();

        throw new Error(
          data.error || "Impossible de retirer le favori."
        );
      }

      setFavorites((current) =>
        current.filter(
          (favorite) => favorite.bookId !== bookId
        )
      );
    } catch (error) {
      console.error("REMOVE FAVORITE ERROR:", error);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-gray-500">
          Chargement des favoris...
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-4xl font-bold">
            Mes favoris ❤️
          </h1>

          <p className="mt-2 text-gray-600">
            Retrouve les livres que tu veux garder de côté.
          </p>
        </div>

        {/* Bouton pour accéder à la carte de la communauté */}
        {favorites.length > 0 && (
          <Link
            href="/favorites/map"
            className="inline-flex items-center gap-2 rounded-lg border bg-white px-5 py-3 text-sm font-medium shadow-sm transition hover:bg-gray-50"
          >
            🗺️ Voir sur la carte
          </Link>
        )}
      </div>

      {error ? (
        <div className="rounded-xl border p-10 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      ) : favorites.length === 0 ? (
        <div className="rounded-xl border p-10 text-center">
          <p className="text-gray-500">
            Aucun livre dans tes favoris.
          </p>

          <Link
            href="/books"
            className="mt-5 inline-block rounded-lg bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-800"
          >
            Rechercher des livres
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((favorite) => {
            const book = favorite.book;

            return (
              <div
                key={favorite.id}
                className="overflow-hidden rounded-xl border transition hover:-translate-y-1 hover:shadow-lg"
              >
                <Link href={`/books/${book.id}`} prefetch={false}>
                  <div className="flex h-64 items-center justify-center bg-gray-100">
                    <BookCover src={book.coverImageUrl} alt={book.title} />
                  </div>
                </Link>

                <div className="flex min-h-[200px] flex-col p-5">
                  <div className="min-h-[64px]">
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        href={`/books/${book.id}`}
                        prefetch={false}
                        className="text-xl font-semibold hover:underline"
                      >
                        {book.title}
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          removeFavorite(book.id)
                        }
                        className="shrink-0 text-xl"
                        aria-label="Retirer des favoris"
                      >
                        ❤️
                      </button>
                    </div>

                    <p className="mt-1 text-gray-600">
                      {book.author || "Auteur inconnu"}
                    </p>
                  </div>

                  <div className="mt-auto pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {book.theme || "Sans thème"}
                      </span>

                      <span
                        className={`text-sm font-medium ${
                          book.status === "available"
                            ? "text-green-600"
                            : "text-red-500"
                        }`}
                      >
                        {book.status === "available"
                          ? "Disponible"
                          : "Emprunté"}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-gray-500">
                      {book.condition === "good"
                        ? "Bon état"
                        : book.condition === "fair"
                        ? "État correct"
                        : "État moyen"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}