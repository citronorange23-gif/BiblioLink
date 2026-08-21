"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Book = {
  id: string;
  title: string;
  author: string | null;
  theme: string | null;
  coverImageUrl: string | null;
  status: string;
  condition: string;
};

// Composant dédié à l'image avec spinner de chargement intégré
function BookCover({
  src,
  alt,
}: {
  src: string | null;
  alt: string;
}) {
  const [isLoading, setIsLoading] = useState(true);

  if (!src) {
    return <span className="text-6xl">📖</span>;
  }

  return (
    <div className="relative h-full w-full flex items-center justify-center">
      {/* Spinner affiché tant que l'image n'est pas complètement chargée */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-black" />
        </div>
      )}

      <img
        src={src}
        alt={alt}
        onLoad={() => setIsLoading(false)}
        onError={() => setIsLoading(false)}
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
      />
    </div>
  );
}

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [themeFilter, setThemeFilter] = useState("all");
  const [conditionFilter, setConditionFilter] = useState("all");

  useEffect(() => {
    async function fetchBooks() {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_URL}/books`);
        const data = await response.json();
        setBooks(data.books ?? []);
      } catch (error) {
        console.error("BOOKS FETCH ERROR:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBooks();
  }, []);

  const filteredBooks = books.filter((book) => {
    const searchValue = search.toLowerCase();

    const matchesSearch =
      book.title.toLowerCase().includes(searchValue) ||
      book.author?.toLowerCase().includes(searchValue);

    const matchesStatus = filter === "all" || book.status === filter;
    const matchesTheme = themeFilter === "all" || book.theme === themeFilter;
    const matchesCondition =
      conditionFilter === "all" || book.condition === conditionFilter;

    return matchesSearch && matchesStatus && matchesTheme && matchesCondition;
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-bold">Livres 📚</h1>
        <p className="mt-2 text-gray-600">
          Trouve un livre disponible près de chez toi.
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <input
          type="text"
          placeholder="Rechercher un livre ou un auteur..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border px-4 py-3 outline-none focus:border-black lg:col-span-3"
        />

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border px-4 py-3 lg:col-span-1"
        >
          <option value="all">Tous les statuts</option>
          <option value="available">Disponibles</option>
          <option value="borrowed">Empruntés</option>
        </select>

        <select
          value={themeFilter}
          onChange={(e) => setThemeFilter(e.target.value)}
          className="rounded-lg border px-4 py-3 lg:col-span-1"
        >
          <option value="all">Tous les thèmes</option>
          <option value="Roman">Roman</option>
          <option value="Science">Science</option>
          <option value="Histoire">Histoire</option>
          <option value="Informatique">Informatique</option>
          <option value="Philosophie">Philosophie</option>
          <option value="Jeunesse">Jeunesse</option>
          <option value="Cuisine">Cuisine</option>
          <option value="Bande dessinée">Bande dessinée</option>
          <option value="Fantastique">Fantastique</option>
          <option value="Biographie">Biographie</option>
          <option value="Autre">Autre</option>
        </select>

        <select
          value={conditionFilter}
          onChange={(e) => setConditionFilter(e.target.value)}
          className="rounded-lg border px-4 py-3 lg:col-span-1"
        >
          <option value="all">Tous les états</option>
          <option value="good">Bon état</option>
          <option value="fair">État correct</option>
          <option value="poor">État moyen</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-black" />
          <p className="mt-4 text-sm text-gray-500">Chargement des livres...</p>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="rounded-xl border p-10 text-center">
          <p className="text-gray-500">Aucun livre trouvé.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBooks.map((book) => (
            <Link
              key={book.id}
              href={`/books/${book.id}`}
              prefetch={false}
              className="overflow-hidden rounded-xl border transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex h-64 items-center justify-center bg-gray-100">
                <BookCover src={book.coverImageUrl} alt={book.title} />
              </div>

              <div className="flex min-h-[180px] flex-col p-5">
                <div className="h-[76px]">
                  <h2 className="text-xl font-semibold">{book.title}</h2>
                  <p className="mt-1 text-gray-600">
                    {book.author || "Auteur inconnu"}
                  </p>
                </div>

                <div className="mt-auto pt-4">
                  <div className="mb-2">
                    <span className="text-sm text-gray-500">
                      {book.theme || "Sans thème"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span
                      className={`relative -ml-3 rounded-full px-3 py-1 text-sm font-medium ${
                        book.status === "available"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {book.status === "available" ? "Disponible" : "Emprunté"}
                    </span>

                    <span
                      className={`text-sm font-medium ${
                        book.condition === "good"
                          ? "text-green-600"
                          : book.condition === "fair"
                          ? "text-orange-500"
                          : "text-red-500"
                      }`}
                    >
                      {book.condition === "good"
                        ? "Bon état"
                        : book.condition === "fair"
                        ? "État correct"
                        : "État moyen"}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}