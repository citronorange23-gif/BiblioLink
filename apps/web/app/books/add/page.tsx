"use client";

import { useEffect, useRef, useState } from "react";
import {
  BrowserMultiFormatReader,
  IScannerControls,
} from "@zxing/browser";
import { useRouter } from "next/navigation";

import BookCover from "@/components/BookCover";
import BookCoverPicker from "@/components/BookCoverPicker";

const API_URL = "http://localhost:4000";

type BookInfo = {
  isbn: string;
  title: string;
  author?: string;
  coverImageUrl?: string;
};

export default function AddBookPage() {
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const isProcessingRef = useRef(false);

  const [isbn, setIsbn] = useState("");
  const [bookInfo, setBookInfo] = useState<BookInfo | null>(null);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [theme, setTheme] = useState("");
  const [condition, setCondition] = useState("good");
  const [description, setDescription] = useState("");

  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);

  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function requestCameraPermission() {
    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: true,
        });

      stream.getTracks().forEach((track) => track.stop());

      setErrorMessage("");
      startScanner();
    } catch (error) {
      console.error(
        "CAMERA PERMISSION ERROR:",
        error
      );

      if (
        error instanceof DOMException &&
        (error.name === "NotAllowedError" ||
          error.name === "PermissionDeniedError")
      ) {
        setErrorMessage(
          "La caméra est bloquée. Clique sur l'icône 🔒 à gauche de l'adresse du site et autorise la caméra."
        );
      }
    }
  }

  function stopScanner() {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }

    setScanning(false);
  }

  // Fonction pour chercher un livre par ISBN (utilisée par le scanner OU si on tape l'ISBN à la main)
  async function fetchBookByIsbn(isbnValue: string) {
    const cleanIsbn = isbnValue.replace(/[-\s]/g, "");
    
    if (!cleanIsbn) return;

    try {
      const response = await fetch(
        `${API_URL}/books/isbn/${cleanIsbn}`
      );

      if (!response.ok) {
        throw new Error("Book not found");
      }

      const data = await response.json();

      setIsbn(cleanIsbn);
      setBookInfo(data.book);
      setTitle(data.book.title ?? "");
      setAuthor(data.book.author ?? "");

      if (data.book.coverImageUrl) {
        setCoverImageUrl(data.book.coverImageUrl);
        setCoverPreview(data.book.coverImageUrl);
      } else {
        setCoverImageUrl("");
        setCoverPreview("");
      }
      setErrorMessage("");
    } catch (error) {
      console.error("ISBN LOOKUP ERROR:", error);
      setErrorMessage(
        "Impossible de trouver automatiquement les informations pour cet ISBN. Remplis les champs manuellement !"
      );
    }
  }

  async function startScanner() {
    if (!videoRef.current || scanning) {
      return;
    }

    setErrorMessage("");
    setScanning(true);
    isProcessingRef.current = false;

    const reader = new BrowserMultiFormatReader();

    try {
      const controls =
        await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          async (result) => {
            if (!result || isProcessingRef.current) {
              return;
            }

            const value = result
              .getText()
              .replace(/[-\s]/g, "");

            const isISBN =
              /^\d{9}[\dX]$/.test(value) ||
              /^(978|979)\d{10}$/.test(value);

            if (!isISBN) {
              return;
            }

            isProcessingRef.current = true;
            stopScanner();
            await fetchBookByIsbn(value);
          }
        );

      controlsRef.current = controls;
    } catch (error) {
      console.error("ISBN SCANNER ERROR:", error);
      setErrorMessage(
        "Impossible d'accéder à la caméra. Vérifie les permissions du navigateur."
      );
      setScanning(false);
    }
  }

  async function publishBook() {
    const token =
      localStorage.getItem("token") ??
      localStorage.getItem("accessToken");

    if (!token) {
      setErrorMessage(
        "Tu dois être connecté pour publier un livre."
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!title.trim()) {
      setErrorMessage(
        "Le titre du livre est obligatoire."
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        `${API_URL}/books`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            isbn: isbn.trim() || undefined,
            title: title.trim(),
            author: author.trim() || undefined,
            theme: theme || undefined,
            coverImageUrl: coverImageUrl || undefined,
            description: description.trim() || undefined,
            condition,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Impossible de publier le livre."
        );
      }

      router.push(`/books/${data.book.id}`);
    } catch (error) {
      console.error("PUBLISH BOOK ERROR:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de publier le livre."
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  }

  function resetScanner() {
    stopScanner();

    setIsbn("");
    setBookInfo(null);
    setTitle("");
    setAuthor("");
    setTheme("");
    setCondition("good");
    setDescription("");

    setCoverImageUrl("");
    setCoverPreview("");

    setErrorMessage("");
    setLoading(false);
    setUploadingCover(false);

    isProcessingRef.current = false;
  }

  useEffect(() => {
    return () => {
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }
    };
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-4xl font-bold">
        Ajouter un livre 📚
      </h1>

      <p className="mt-2 text-gray-600">
        Scanne le code-barres ISBN ou saisis-le manuellement pour remplir les informations.
      </p>

      {/* 1. SECTION SCANNER EN HAUT */}
      <div className="mt-8 overflow-hidden rounded-2xl bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-auto max-h-[500px] w-full object-cover"
        />
      </div>

      {!scanning ? (
        <button
          type="button"
          onClick={requestCameraPermission}
          className="mt-6 w-full rounded-lg bg-black px-6 py-3 font-medium text-white hover:bg-gray-800"
        >
          📷 Scanner l'ISBN
        </button>
      ) : (
        <div className="mt-6 rounded-lg border p-4 text-center">
          <p className="font-medium">
            🔍 Recherche du code-barres...
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Place le code-barres ISBN devant la caméra.
          </p>

          <button
            type="button"
            onClick={stopScanner}
            className="mt-3 rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Arrêter le scanner
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="mt-6 rounded-lg bg-red-100 p-4 text-red-700">
          {errorMessage}
        </div>
      )}

      {/* 2. FORMULAIRE EN BAS */}
      <div className="mt-10 rounded-2xl border p-6">
        <h2 className="text-xl font-bold mb-6">
          Informations du livre
        </h2>

        <div className="flex flex-col gap-6 sm:flex-row">
          <div>
            {coverPreview ? (
              <img
                src={coverPreview}
                alt={title || "Aperçu couverture"}
                className="h-64 w-44 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-64 w-44 items-center justify-center rounded-lg bg-gray-100 text-5xl">
                📖
              </div>
            )}

            <div className="mt-3">
              <BookCoverPicker
                value={coverImageUrl}
                onChange={(url) => {
                  setCoverImageUrl(url);
                  setCoverPreview(
                    url.startsWith("http")
                      ? url
                      : `${API_URL}${url}`
                  );
                }}
              />
            </div>
          </div>

          <div className="flex-1 space-y-5">
            <div>
              <label className="mb-2 block font-medium">
                ISBN (ou Code-barres)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                  className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black"
                  placeholder="Ex: 97820704085cb..."
                />
                <button
                  type="button"
                  onClick={() => fetchBookByIsbn(isbn)}
                  className="rounded-lg bg-gray-200 px-4 py-3 font-medium hover:bg-gray-300 whitespace-nowrap"
                >
                  Chercher
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Se remplit automatiquement au scan ou peut être tapé à la main.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block font-medium">
              Titre
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black"
              placeholder="Titre du livre"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Auteur
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black"
              placeholder="Auteur"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Thème
            </label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full rounded-lg border px-4 py-3"
            >
              <option value="">Choisir un thème</option>
              <option value="Roman">Roman</option>
              <option value="Science">Science</option>
              <option value="Histoire">Histoire</option>
              <option value="Informatique">Informatique</option>
              <option value="Philosophie">Philosophie</option>
              <option value="Jeunesse">Jeunesse</option>
              <option value="Biographie">Biographie</option>
              <option value="Autre">Autre</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block font-medium">
              État du livre
            </label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full rounded-lg border px-4 py-3"
            >
              <option value="good">Bon état</option>
              <option value="fair">État correct</option>
              <option value="poor">État moyen</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full resize-none rounded-lg border px-4 py-3 outline-none focus:border-black"
              placeholder="Ajoute quelques informations sur ton livre..."
            />
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={resetScanner}
            disabled={loading || uploadingCover}
            className="rounded-lg border px-6 py-3 font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            Réinitialiser
          </button>

          <button
            type="button"
            onClick={publishBook}
            disabled={loading || uploadingCover}
            className="flex-1 rounded-lg bg-black px-6 py-3 font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Publication..." : "📚 Publier le livre"}
          </button>
        </div>
      </div>
    </main>
  );
}