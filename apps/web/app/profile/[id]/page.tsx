"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import EditProfileButton from "./EditProfileButton";
import LogoutButton from "./LogoutButton";
import BookManagementButtons from "./BookManagementButtons";
import BookCover from "@/components/BookCover";

const API_URL = "http://localhost:4000";

type Book = {
  id: string;
  title: string;
  author: string | null;
  theme: string | null;
  coverImageUrl: string | null;
  condition: string;
  status: string;
  createdAt: string;
};

type UserProfile = {
  id: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  neighborhood: string | null;
  createdAt: string;
  books: Book[];
};

type ViewSize = "large" | "medium" | "small" | "compact";

export default function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [viewSize, setViewSize] = useState<ViewSize>("medium");

  useEffect(() => {
    params.then((p) => {
      setResolvedParams(p);
      fetch(`${API_URL}/users/${p.id}`)
        .then((res) => {
          if (!res.ok) throw new Error("Not found");
          return res.json();
        })
        .then((data) => {
          setUser(data.user);
          setLoading(false);
        })
        .catch(() => {
          setError(true);
          setLoading(false);
        });
    });
  }, [params]);

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12 text-center">
        <p className="text-gray-500">Chargement du profil...</p>
      </main>
    );
  }

  if (error || !user) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-bold">Utilisateur introuvable</h1>
        <Link href="/books" className="mt-6 inline-block underline">
          Retour aux livres
        </Link>
      </main>
    );
  }

  const gridClasses = {
    large: "grid gap-6 sm:grid-cols-1 lg:grid-cols-2",
    medium: "grid gap-5 sm:grid-cols-2 lg:grid-cols-3",
    small: "grid gap-4 sm:grid-cols-3 lg:grid-cols-4",
    compact: "grid gap-3 sm:grid-cols-4 lg:grid-cols-6",
  }[viewSize];

  const imageHeight = {
    large: "h-72",
    medium: "h-56",
    small: "h-40",
    compact: "h-28",
  }[viewSize];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <Link href="/books" className="text-sm text-gray-500 hover:text-black">
        ← Retour aux livres
      </Link>

      {/* Profile header */}
      <section className="mt-8 rounded-2xl border p-6 sm:p-8">
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-4xl">
            {user.avatarUrl ? (
              <img
                src={
                  user.avatarUrl.startsWith("http")
                    ? user.avatarUrl
                    : `${API_URL}${user.avatarUrl}`
                }
                alt={user.username}
                className="h-full w-full object-cover"
              />
            ) : (
              "👤"
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="break-words text-3xl font-bold sm:text-4xl">
                {user.username}
              </h1>

              <div className="flex flex-wrap gap-2">
                <EditProfileButton profileId={user.id} />
                <LogoutButton profileId={user.id} />
              </div>
            </div>

            {user.neighborhood && (
              <p className="mt-2 text-gray-500">📍 {user.neighborhood}</p>
            )}

            {user.bio && (
              <p className="mt-4 max-w-2xl leading-relaxed text-gray-600">
                {user.bio}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Books */}
      <section className="mt-10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Ses livres 📚</h2>
            <p className="mt-1 text-gray-500">
              {user.books.length} {user.books.length === 1 ? "livre" : "livres"}
            </p>
          </div>

          {/* Boutons de sélection de la taille */}
          {user.books.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 mr-1">Taille :</span>
              {(
                [
                  { key: "large", label: "Grand" },
                  { key: "medium", label: "Moyen" },
                  { key: "small", label: "Petit" },
                  { key: "compact", label: "Compact" },
                ] as const
              ).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setViewSize(key)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    viewSize === key
                      ? "bg-black text-white"
                      : "border bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {user.books.length === 0 ? (
          <div className="rounded-xl border p-10 text-center">
            <p className="text-gray-500">
              Cet utilisateur n'a pas encore ajouté de livres.
            </p>
          </div>
        ) : (
          <div className={gridClasses}>
            {user.books.map((book) => {
              const isAvailable = book.status === "available";

              return (
                <div
                  key={book.id}
                  className="overflow-hidden rounded-xl border transition hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between bg-white"
                >
                  <div>
                    {/* Book card */}
                    <Link href={`/books/${book.id}`} prefetch={false} className="block">
                      <div className={`flex items-center justify-center bg-gray-100 ${imageHeight}`}>
                        <BookCover
                          src={book.coverImageUrl}
                          alt={book.title}
                          emptyClassName={viewSize === "compact" ? "text-2xl" : "text-6xl"}
                        />
                      </div>

                      <div className={viewSize === "compact" ? "p-3" : "p-5"}>
                        <h3 className={`font-semibold truncate ${viewSize === "compact" ? "text-sm" : "text-lg"}`}>
                          {book.title}
                        </h3>

                        {viewSize !== "compact" && (
                          <p className="mt-1 text-gray-600 text-sm truncate">
                            {book.author || "Auteur inconnu"}
                          </p>
                        )}

                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="text-xs text-gray-500 truncate">
                            {book.theme || "Sans thème"}
                          </span>

                          <span
                            className={
                              isAvailable
                                ? "text-xs font-medium text-green-600"
                                : "text-xs font-medium text-red-500"
                            }
                          >
                            {isAvailable ? "Dispo." : "Emprunté"}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>

                  {/* Management buttons OUTSIDE the Link */}
                  {viewSize !== "compact" && (
                    <div className="px-5 pb-5 pt-2">
                      <BookManagementButtons
                        bookId={book.id}
                        ownerId={user.id}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}