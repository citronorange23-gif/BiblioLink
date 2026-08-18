"use client";

import { useEffect, useState } from "react";

const API_URL = "http://localhost:4000";

type Props = {
  bookId: string;
};

export default function FavoriteButton({ bookId }: Props) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkFavorite() {
      const token =
        localStorage.getItem("token") ??
        localStorage.getItem("accessToken");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/favorites`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        const exists = data.favorites.some(
          (favorite: { bookId: string }) =>
            favorite.bookId === bookId
        );

        setIsFavorite(exists);
      } catch (error) {
        console.error("CHECK FAVORITE ERROR:", error);
      } finally {
        setLoading(false);
      }
    }

    checkFavorite();
  }, [bookId]);

  async function toggleFavorite() {
    const token =
      localStorage.getItem("token") ??
      localStorage.getItem("accessToken");

    if (!token || loading) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/favorites/${bookId}`,
        {
          method: isFavorite ? "DELETE" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.error || "Impossible de modifier le favori."
        );
      }

      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error("TOGGLE FAVORITE ERROR:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggleFavorite}
      disabled={loading}
      aria-label={
        isFavorite
          ? "Retirer des favoris"
          : "Ajouter aux favoris"
      }
      className="rounded-full border px-4 py-2 text-2xl transition hover:bg-gray-50 disabled:opacity-50"
    >
      {isFavorite ? "❤️" : "🤍"}
    </button>
  );
}