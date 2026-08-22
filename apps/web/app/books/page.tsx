"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

import { calculateDistance } from "../../lib/geo";

// Import dynamique de Leaflet pour éviter les problèmes SSR
const RadiusMap = dynamic(() => import("../../components/Map"), {
  ssr: false,
});

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// ========================================
// TYPES
// ========================================

type UserLocation = {
  latitude: number | null;
  longitude: number | null;
};

type Book = {
  id: string;
  title: string;
  author: string | null;
  theme: string | null;
  coverImageUrl: string | null;
  status: string;
  condition: string;

  owner?: {
    username: string;
    latitude: number | null;
    longitude: number | null;
  };
};

// ========================================
// COVER LIVRE
// ========================================

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
    <div className="relative flex h-full w-full items-center justify-center">
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

// ========================================
// PAGE LIVRES
// ========================================

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ========================================
  // POSITION DU USER CONNECTÉ
  // ========================================

  const [userLocation, setUserLocation] =
    useState<UserLocation | null>(null);

  // ========================================
  // FILTRES
  // ========================================

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [themeFilter, setThemeFilter] = useState("all");
  const [conditionFilter, setConditionFilter] = useState("all");

  // ========================================
  // MODAL CARTE
  // ========================================

  const [isMapModalOpen, setIsMapModalOpen] =
    useState(false);

  // ========================================
  // RAYON
  // ========================================

  const [radiusFilter, setRadiusFilter] =
    useState<number | null>(null);

  // ========================================
  // RÉCUPÉRER TOUS LES LIVRES
  // ========================================

  useEffect(() => {
    async function fetchBooks() {
      try {
        setIsLoading(true);

        const response = await fetch(
          `${API_URL}/books`
        );

        if (!response.ok) {
          throw new Error(
            "Impossible de récupérer les livres"
          );
        }

        const data = await response.json();

        console.log(
          "LIVRES RÉCUPÉRÉS :",
          data.books
        );

        setBooks(data.books ?? []);
      } catch (error) {
        console.error(
          "BOOKS FETCH ERROR:",
          error
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchBooks();
  }, []);

  // ========================================
  // RÉCUPÉRER LE USER CONNECTÉ
  // ========================================

  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const token =
          localStorage.getItem("token");

        if (!token) {
          console.error(
            "Aucun token trouvé dans localStorage"
          );
          return;
        }

        const response = await fetch(
          `${API_URL}/users/me`,
          {
            method: "GET",

            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          const errorText =
            await response.text();

          console.error(
            "USER /me ERROR:",
            response.status,
            errorText
          );

          throw new Error(
            `Impossible de récupérer l'utilisateur connecté (${response.status})`
          );
        }

        const data =
          await response.json();

        // Selon ton backend, l'utilisateur
        // peut être directement dans data
        // ou dans data.user.
        const user = data.user ?? data;

        console.log(
          "================================"
        );

        console.log(
          "USER CONNECTÉ :",
          user
        );

        console.log(
          "LATITUDE :",
          user.latitude
        );

        console.log(
          "LONGITUDE :",
          user.longitude
        );

        console.log(
          "================================"
        );

        if (
          typeof user.latitude !== "number" ||
          typeof user.longitude !== "number"
        ) {
          console.error(
            "Le user n'a pas de coordonnées GPS valides.",
            {
              latitude: user.latitude,
              longitude: user.longitude,
            }
          );

          setUserLocation({
            latitude: null,
            longitude: null,
          });

          return;
        }

        setUserLocation({
          latitude: user.latitude,
          longitude: user.longitude,
        });
      } catch (error) {
        console.error(
          "CURRENT USER FETCH ERROR:",
          error
        );
      }
    }

    fetchCurrentUser();
  }, []);

  // ========================================
  // FILTRAGE DES LIVRES
  // ========================================

  const filteredBooks = books.filter(
    (book) => {
      // ========================================
      // 1. RECHERCHE
      // ========================================

      const searchValue =
        search.toLowerCase();

      const matchesSearch =
        book.title
          .toLowerCase()
          .includes(searchValue) ||
        book.author
          ?.toLowerCase()
          .includes(searchValue);

      // ========================================
      // 2. STATUT
      // ========================================

      const matchesStatus =
        filter === "all" ||
        book.status === filter;

      // ========================================
      // 3. THÈME
      // ========================================

      const matchesTheme =
        themeFilter === "all" ||
        book.theme === themeFilter;

      // ========================================
      // 4. CONDITION / LANGUE
      // ========================================

      const matchesCondition =
        conditionFilter === "all" ||
        book.condition === conditionFilter;

      // ========================================
      // 5. FILTRE GÉOGRAPHIQUE
      // ========================================

      let matchesRadius = true;

      // Si aucun rayon n'est sélectionné,
      // on garde tous les livres.
      if (radiusFilter !== null) {
        // ------------------------------------
        // Vérifier la position du user
        // ------------------------------------

        if (
          !userLocation ||
          typeof userLocation.latitude !==
            "number" ||
          typeof userLocation.longitude !==
            "number"
        ) {
          console.log(
            `Livre "${book.title}" ignoré : position utilisateur inconnue`
          );

          matchesRadius = false;
        }

        // ------------------------------------
        // Vérifier la position du owner
        // ------------------------------------

        else if (
          !book.owner ||
          typeof book.owner.latitude !==
            "number" ||
          typeof book.owner.longitude !==
            "number"
        ) {
          console.log(
            `Livre "${book.title}" ignoré : position du propriétaire inconnue`
          );

          matchesRadius = false;
        }

        // ------------------------------------
        // CALCUL DE LA DISTANCE
        // ------------------------------------

        else {
          const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            book.owner.latitude,
            book.owner.longitude
          );

          console.log("📍 DISTANCE:", {
            book: book.title,
            user: userLocation,
            owner: {
              latitude: book.owner.latitude,
              longitude: book.owner.longitude,
            },
            distance,
            radiusFilter,
            shouldShow: distance <= radiusFilter,
          });

          // ----------------------------------
          // Garder uniquement les livres
          // qui sont dans le rayon
          // ----------------------------------

          matchesRadius =
            distance <= radiusFilter;
        }
      }

      // ========================================
      // RÉSULTAT FINAL
      // ========================================

      return (
        matchesSearch &&
        matchesStatus &&
        matchesTheme &&
        matchesCondition &&
        matchesRadius
      );
    }
  );

  console.log("GEO FILTER STATE:", {
    radiusFilter,
    userLocation,
    booksCount: books.length,
  });

  // ========================================
  // RENDER
  // ========================================

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:py-12">

      {/* ====================================== */}
      {/* HEADER */}
      {/* ====================================== */}

      <div className="mb-8 sm:mb-10">
        <h1 className="text-3xl font-bold sm:text-4xl">
          Livres 📚
        </h1>

        <p className="mt-2 text-sm text-gray-600 sm:text-base">
          Trouve un livre disponible près de chez toi.
        </p>
      </div>

      {/* ====================================== */}
      {/* FILTRES */}
      {/* ====================================== */}

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:gap-4">

        {/* Recherche */}

        <input
          type="text"
          placeholder="Rechercher un livre ou un auteur..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-black sm:text-base lg:col-span-3"
        />

        {/* Statut */}

        <select
          value={filter}
          onChange={(e) =>
            setFilter(e.target.value)
          }
          className="w-full rounded-lg border px-4 py-3 lg:col-span-1"
        >
          <option value="all">
            Tous les statuts
          </option>

          <option value="available">
            Disponibles
          </option>

          <option value="borrowed">
            Empruntés
          </option>
        </select>

        {/* Thème */}

        <select
          value={themeFilter}
          onChange={(e) =>
            setThemeFilter(e.target.value)
          }
          className="w-full rounded-lg border px-4 py-3 lg:col-span-1"
        >
          <option value="all">
            Tous les thèmes
          </option>

          <option value="Roman">
            Roman
          </option>

          <option value="Science">
            Science
          </option>

          <option value="Histoire">
            Histoire
          </option>

          <option value="Informatique">
            Informatique
          </option>

          <option value="Philosophie">
            Philosophie
          </option>

          <option value="Jeunesse">
            Jeunesse
          </option>

          <option value="Cuisine">
            Cuisine
          </option>

          <option value="Bande dessinée">
            Bande dessinée
          </option>

          <option value="Fantastique">
            Fantastique
          </option>

          <option value="Biographie">
            Biographie
          </option>

          <option value="Autre">
            Autre
          </option>
        </select>

        {/* Langue */}

        <select
          value={conditionFilter}
          onChange={(e) =>
            setConditionFilter(
              e.target.value
            )
          }
          className="w-full rounded-lg border px-4 py-3 lg:col-span-1"
        >
          <option value="all">
            Toutes les langues
          </option>

          <option value="Français">
            Français
          </option>

          <option value="Anglais">
            Anglais
          </option>

          <option value="Espagnol">
            Espagnol
          </option>

          <option value="Arabe">
            Arabe
          </option>

          <option value="Portugais">
            Portugais
          </option>
        </select>

      </div>

      {/* ====================================== */}
      {/* FILTRE GÉOGRAPHIQUE */}
      {/* ====================================== */}

      <div className="mb-8 flex flex-col gap-4 rounded-xl border bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex items-center gap-2">
          <span className="text-xl">
            📍
          </span>

          <div>
            <p className="font-semibold text-gray-900">
              Filtre géographique par rayon
            </p>

            <p className="text-sm text-gray-500">
              {radiusFilter !== null
                ? `Actuellement filtré à ${radiusFilter} km autour de vous`
                : "Aucun filtre de distance appliqué"}
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">

          {radiusFilter !== null && (
            <button
              onClick={() => setRadiusFilter(null)}
              className="w-full rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-gray-100 sm:w-auto"
            >
              Réinitialiser
            </button>
          )}

          <button
            onClick={() => setIsMapModalOpen(true)}
            className="w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 sm:w-auto"
          >
            {radiusModifierTexte(radiusFilter)}
          </button>

        </div>

      </div>

      {/* ====================================== */}
      {/* MODAL CARTE */}
      {/* ====================================== */}

      {isMapModalOpen && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 backdrop-blur-sm sm:p-4">

          <div className="relative flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:h-[80vh] sm:w-[90vw]">

            <div className="flex items-center justify-between gap-4 border-b px-4 py-3 sm:px-6 sm:py-4">

              <h2 className="text-base font-bold sm:text-lg">
                Choisir un rayon de recherche
              </h2>

              <button
                onClick={() =>
                  setIsMapModalOpen(false)
                }
                className="text-xl font-bold text-gray-500 hover:text-black"
              >
                ✕
              </button>

            </div>

            {/* Carte */}

            <div className="relative flex-1">

              <RadiusMap
                books={books}
                userLocation={userLocation}
                onConfirm={(
                  selectedRadius: number,
                  center: [number, number]
                ) => {

                  console.log(
                    "Rayon sélectionné :",
                    selectedRadius
                  );

                  console.log(
                    "Centre :",
                    center
                  );

                  setRadiusFilter(
                    selectedRadius
                  );

                  setIsMapModalOpen(
                    false
                  );
                }}
              />

            </div>

          </div>

        </div>

      )}

      {/* ====================================== */}
      {/* LIVRES */}
      {/* ====================================== */}

      {isLoading ? (

        <div className="flex flex-col items-center justify-center py-20">

          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-black" />

          <p className="mt-4 text-sm text-gray-500">
            Chargement des livres...
          </p>

        </div>

      ) : filteredBooks.length === 0 ? (

        <div className="rounded-xl border p-10 text-center">

          <p className="text-gray-500">
            Aucun livre trouvé.
          </p>

        </div>

      ) : (

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">

          {filteredBooks.map(
            (book) => (

              <Link
                key={book.id}
                href={`/books/${book.id}`}
                prefetch={false}
                className="overflow-hidden rounded-xl border transition hover:-translate-y-1 hover:shadow-lg"
              >

                {/* Cover */}

                <div className="flex h-56 items-center justify-center bg-gray-100 sm:h-64">

                  <BookCover
                    src={
                      book.coverImageUrl
                    }
                    alt={book.title}
                  />

                </div>

                {/* Infos */}

                <div className="flex min-h-[170px] flex-col p-4 sm:min-h-[180px] sm:p-5">

                  <div className="h-[76px]">

                    <h2 className="line-clamp-2 text-lg font-semibold sm:text-xl">
                      {book.title}
                    </h2>

                    <p className="mt-1 text-gray-600">
                      {book.author ||
                        "Auteur inconnu"}
                    </p>

                  </div>

                  <div className="mt-auto pt-4">

                    <div className="mb-2">

                      <span className="text-sm text-gray-500">
                        {book.theme ||
                          "Sans thème"}
                      </span>

                    </div>

                    <div className="flex items-center justify-between">

                      <span
                        className={`relative -ml-3 rounded-full px-3 py-1 text-sm font-medium ${
                          book.status ===
                          "available"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {book.status ===
                        "available"
                          ? "Disponible"
                          : "Emprunté"}
                      </span>

                      <span className="text-sm font-medium text-gray-600">
                        {book.condition ||
                          "Français"}
                      </span>

                    </div>

                  </div>

                </div>

              </Link>

            )
          )}

        </div>

      )}

    </main>
  );
}

// ========================================
// TEXTE DU BOUTON RAYON
// ========================================

function radiusModifierTexte(
  radius: number | null
) {
  if (radius === null) {
    return "Définir un rayon";
  }

  return `Modifier le rayon (${radius} km)`;
}