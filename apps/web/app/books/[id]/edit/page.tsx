"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import BookCover from "@/components/BookCover";
import BookCoverPicker from "@/components/BookCoverPicker";

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
};

export default function EditBookPage() {
  const params = useParams();
  const router = useRouter();

  const bookId = params.id as string;

  const [book, setBook] = useState<Book | null>(null);

  const [isbn, setIsbn] = useState("");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [theme, setTheme] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBook() {
      try {
        const response = await fetch(
          `${API_URL}/books/${bookId}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Impossible de récupérer le livre."
          );
        }

        const loadedBook: Book = data.book;

        setBook(loadedBook);

        setIsbn(loadedBook.isbn ?? "");
        setTitle(loadedBook.title ?? "");
        setAuthor(loadedBook.author ?? "");
        setTheme(loadedBook.theme ?? "");

        const existingCover =
          loadedBook.coverImageUrl ?? "";

        setCoverImageUrl(existingCover);

        if (existingCover) {
          setCoverPreview(
            existingCover.startsWith("http")
              ? existingCover
              : `${API_URL}${existingCover}`
          );
        } else {
          setCoverPreview("");
        }

        setDescription(
          loadedBook.description ?? ""
        );

        setCondition(
          loadedBook.condition ?? ""
        );
      } catch (error) {
        console.error(
          "LOAD BOOK ERROR:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Impossible de récupérer le livre."
        );
      } finally {
        setLoading(false);
      }
    }

    loadBook();
  }, [bookId]);

  function handleCoverChange(url: string) {
    setCoverImageUrl(url);

    setCoverPreview(
      url.startsWith("http")
        ? url
        : `${API_URL}${url}`
    );

    setError("");
  }

  async function saveBook(
    event: React.FormEvent
  ) {
    event.preventDefault();

    const token =
      localStorage.getItem("token") ??
      localStorage.getItem("accessToken");

    if (!token) {
      router.push("/login");
      return;
    }

    if (!title.trim()) {
      setError(
        "Le titre du livre est obligatoire."
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/books/${bookId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            isbn:
              isbn.trim() || undefined,

            title: title.trim(),

            author:
              author.trim() || undefined,

            theme:
              theme || undefined,

            coverImageUrl:
              coverImageUrl || undefined,

            description:
              description.trim() || undefined,

            condition:
              condition || undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Impossible de modifier le livre."
        );
      }

      router.push(
        `/profile/${data.book.ownerId}`
      );

      router.refresh();
    } catch (error) {
      console.error(
        "UPDATE BOOK ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Impossible de modifier le livre."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-12">
        <p className="text-gray-500">
          Chargement...
        </p>
      </main>
    );
  }

  if (!book) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-2xl font-bold">
          Livre introuvable
        </h1>

        {error && (
          <p className="mt-3 text-red-600">
            {error}
          </p>
        )}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Modifier le livre
        </h1>

        <p className="mt-2 text-gray-600">
          Modifie les informations de ton livre.
        </p>
      </div>

      <form
        onSubmit={saveBook}
        className="space-y-6 rounded-2xl border p-6"
      >
        {/* ISBN */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            ISBN
          </label>

          <input
            type="text"
            value={isbn}
            onChange={(e) =>
              setIsbn(e.target.value)
            }
            className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black"
          />
        </div>

        {/* TITRE */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Titre
          </label>

          <input
            type="text"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            required
            className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black"
          />
        </div>

        {/* AUTEUR */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Auteur
          </label>

          <input
            type="text"
            value={author}
            onChange={(e) =>
              setAuthor(e.target.value)
            }
            className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black"
          />
        </div>

        {/* THÈME */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Thème
          </label>

          <select
            value={theme}
            onChange={(e) =>
              setTheme(e.target.value)
            }
            className="w-full rounded-lg border px-4 py-3"
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
        </div>

        {/* COVER */}
        <div>
          <div className="flex flex-col gap-4 sm:flex-row">
            {/* PREVIEW */}
            <div>
              <div className="h-64 w-44">
                <BookCover
                  src={coverPreview || null}
                  alt={title}
                  emptyClassName="text-5xl"
                />
              </div>
            </div>

            {/* PICKER */}
            <div className="flex flex-col justify-center">
              <BookCoverPicker
                value={coverImageUrl}
                onChange={handleCoverChange}
              />
            </div>
          </div>
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Description
          </label>

          <textarea
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            rows={5}
            className="w-full resize-none rounded-lg border px-4 py-3 outline-none focus:border-black"
            placeholder="Ajoute quelques informations sur ton livre..."
          />
        </div>

        {/* ÉTAT */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            État du livre
          </label>

          <select
            value={condition}
            onChange={(e) =>
              setCondition(e.target.value)
            }
            className="w-full rounded-lg border px-4 py-3"
          >
            <option value="good">
              Bon état
            </option>

            <option value="fair">
              État correct
            </option>

            <option value="poor">
              État moyen
            </option>
          </select>
        </div>

        {/* ERROR */}
        {error && (
          <div className="rounded-lg bg-red-100 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* BUTTONS */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={saving}
            className="rounded-lg border px-5 py-2.5 text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            Annuler
          </button>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Enregistrement..."
              : "Enregistrer"}
          </button>
        </div>
      </form>
    </main>
  );
}