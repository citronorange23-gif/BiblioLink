"use client";

import { useState } from "react";
import Link from "next/link";
import BookManagementButtons from "./BookManagementButtons";
import BookCover from "@/components/BookCover";

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

type UserBooksListProps = {
  books: Book[];
  userId: string;
};

type ViewSize = "large" | "medium" | "small" | "compact";

export default function UserBooksList({ books, userId }: UserBooksListProps) {
  const [viewSize, setViewSize] = useState<ViewSize>("medium");

  if (books.length === 0) {
    return (
      <div className="rounded-xl border p-10 text-center">
        <p className="text-gray-500">
          Cet utilisateur n'a pas encore ajouté de livres.
        </p>
      </div>
    );
  }

  // Définition des classes de grille et de mise en page selon la taille choisie
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
    <div>
      {/* Boutons de sélection de la taille */}
      <div className="mb-6 flex items-center justify-end gap-2">
        <span className="text-sm text-gray-500 mr-2">Affichage :</span>
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

      {/* Grille des livres */}
      <div className={gridClasses}>
        {books.map((book) => {
          const isAvailable = book.status === "available";

          return (
            <div
              key={book.id}
              className="overflow-hidden rounded-xl border transition hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between bg-white"
            >
              <div>
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

              {/* Management buttons */}
              {viewSize !== "compact" && (
                <div className="px-5 pb-5 pt-2">
                  <BookManagementButtons
                    bookId={book.id}
                    ownerId={userId}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}