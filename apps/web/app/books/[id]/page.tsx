"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import BorrowButton from "./BorrowButton";
import FavoriteButton from "./FavoriteButton";
import BookCover from "@/components/BookCover";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Book = {
  id: string;
  ownerId: string;
  isbn: string | null;
  title: string;
  author: string | null;
  theme: string | null;
  coverImageUrl: string | null;
  description: string | null;
  condition: string;
  status: string;
  createdAt: string;
  owner: {
    id: string;
    username: string;
    avatarUrl: string | null;
    bio: string | null;
    neighborhood: string | null;
    createdAt: string;
  };
};

export default function BookPage() {
  const params = useParams();
  const id = params.id as string;

  const [book, setBook] = useState<Book | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBook() {
      const token =
        localStorage.getItem("token") ??
        localStorage.getItem("accessToken");

      try {
        const response = await fetch(`${API_URL}/books/${id}`, {
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : {},
        });

        if (!response.ok) {
          setNotFound(true);
          return;
        }

        const data = await response.json();
        setBook(data.book);
      } catch (error) {
        console.error("FETCH BOOK ERROR:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    fetchBook();
  }, [id]);

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <p>Chargement...</p>
      </main>
    );
  }

  if (notFound || !book) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-bold">Livre introuvable</h1>

        <Link href="/books" className="mt-6 inline-block underline">
          Retour aux livres
        </Link>
      </main>
    );
  }

  const isAvailable = book.status === "available";

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <Link
        href="/books"
        className="text-sm text-gray-500 hover:text-black"
      >
        ← Retour aux livres
      </Link>

      <div className="mt-8 grid gap-10 md:grid-cols-2">
        <div className="flex h-[500px] items-center justify-center rounded-2xl bg-gray-100">
          <BookCover
            src={book.coverImageUrl}
            alt={book.title}
            emptyClassName="text-8xl"
          />
        </div>

        <div>
          <div className="mb-4">
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                isAvailable
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {isAvailable ? "Disponible" : "Emprunté"}
            </span>
          </div>

          <div className="flex items-start justify-between gap-4">
            <h1 className="text-4xl font-bold">{book.title}</h1>

            <FavoriteButton bookId={book.id} />
          </div>

          <p className="mt-2 text-xl text-gray-600">
            {book.author || "Auteur inconnu"}
          </p>

          <div className="mt-6 space-y-3">
            {book.theme && (
              <p>
                <span className="font-semibold">Thème :</span>{" "}
                {book.theme}
              </p>
            )}

            <p>
              <span className="font-semibold">Langue :</span>{" "}
              {book.condition || "Français"}
            </p>

            {book.isbn && (
              <p>
                <span className="font-semibold">ISBN :</span>{" "}
                {book.isbn}
              </p>
            )}
          </div>

          {book.description && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold">Description</h2>

              <p className="mt-2 leading-relaxed text-gray-600">
                {book.description}
              </p>
            </div>
          )}

          <div className="mt-8 rounded-xl border p-5">
            <h2 className="font-semibold">Propriétaire</h2>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                  {book.owner.avatarUrl ? (
                    <img
                      src={
                        book.owner.avatarUrl.startsWith("http")
                          ? book.owner.avatarUrl
                          : `${API_URL}${book.owner.avatarUrl}`
                      }
                      alt={book.owner.username}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    "👤"
                  )}
                </div>

                <div>
                  <p className="font-medium">{book.owner.username}</p>

                  {book.owner.neighborhood && (
                    <p className="text-sm text-gray-500">
                      {book.owner.neighborhood}
                    </p>
                  )}
                </div>
              </div>

              <Link
                href={`/profile/${book.owner.id}`}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
              >
                Voir le profil
              </Link>
            </div>
          </div>

          <BorrowButton bookId={book.id} isAvailable={isAvailable} />
        </div>
      </div>
    </main>
  );
}