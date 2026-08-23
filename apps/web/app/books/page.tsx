"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

import { calculateDistance } from "../../lib/geo";

const RadiusMap = dynamic(() => import("../../components/Map"), {
  ssr: false,
});

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const DEFAULT_LOCATION = {
  latitude: 52.4760892,
  longitude: -71.8258668,
};

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
  // POSITION DU USER
  // ========================================

  const [userLocation, setUserLocation] =
    useState<UserLocation | null>(null);

  // ========================================
  // FILTRES
  // ========================================

  const [search, setSearch] = useState("");

  // MULTI-SÉLECTION
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [themeFilters, setThemeFilters] = useState<string[]>([]);
  const [conditionFilters, setConditionFilters] = useState<string[]>([]);

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
  // OPTIONS FILTRES
  // ========================================

  const themes = [
    "Roman",
    "Science",
    "Histoire",
    "Informatique",
    "Philosophie",
    "Jeunesse",
    "Cuisine",
    "Bande dessinée",
    "Fantastique",
    "Biographie",
    "Autre",
  ];

  const conditions = [
    "Français",
    "Anglais",
    "Espagnol",
    "Arabe",
    "Portugais",
    "Italien",
    "Allemend",
    "Japonais",
    "Autre",
  ];

  const statuses = [
    {
      value: "available",
      label: "Disponible",
    },
    {
      value: "borrowed",
      label: "Emprunté",
    },
  ];

  // ========================================
  // TOGGLE FILTRE
  // ========================================

  function toggleFilter(
    value: string,
    currentFilters: string[],
    setFilters: React.Dispatch<React.SetStateAction<string[]>>
  ) {
    if (currentFilters.includes(value)) {
      setFilters(
        currentFilters.filter(
          (item) => item !== value
        )
      );
    } else {
      setFilters([
        ...currentFilters,
        value,
      ]);
    }
  }

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

        const user = data.user ?? data;

        console.log(
          "USER CONNECTÉ :",
          user
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

        if (
          user.latitude === DEFAULT_LOCATION.latitude &&
          user.longitude === DEFAULT_LOCATION.longitude
        ) {
          console.log(
            "📍 Position par défaut détectée."
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
        statusFilters.length === 0 ||
        statusFilters.includes(book.status);

      // ========================================
      // 3. THÈME
      // ========================================

      const matchesTheme =
        themeFilters.length === 0 ||
        themeFilters.includes(
          book.theme ?? ""
        );

      // ========================================
      // 4. LANGUE
      // ========================================

      const matchesCondition =
        conditionFilters.length === 0 ||
        conditionFilters.includes(
          book.condition
        );

      // ========================================
      // 5. FILTRE GÉOGRAPHIQUE
      // ========================================

      let matchesRadius = true;

      if (radiusFilter !== null) {
        // Position utilisateur

        if (
          !userLocation ||
          typeof userLocation.latitude !==
            "number" ||
          typeof userLocation.longitude !==
            "number"
        ) {
          matchesRadius = false;
        }

        // Position propriétaire

        else if (
          !book.owner ||
          typeof book.owner.latitude !==
            "number" ||
          typeof book.owner.longitude !==
            "number"
        ) {
          matchesRadius = false;
        }

        // Distance

        else {
          const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            book.owner.latitude,
            book.owner.longitude
          );

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

  // ========================================
  // RESET FILTRES
  // ========================================

  function resetFilters() {
    setSearch("");
    setStatusFilters([]);
    setThemeFilters([]);
    setConditionFilters([]);
    setRadiusFilter(null);
  }

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
      {/* RECHERCHE */}
      {/* ====================================== */}

      <div className="mb-6">
        <input
          type="text"
          placeholder="Rechercher un livre ou un auteur..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-black sm:text-base"
        />
      </div>

      {/* ====================================== */}
      {/* FILTRES */}
      {/* ====================================== */}

      <div className="mb-8 space-y-5 rounded-xl border bg-gray-50 p-4 sm:p-5">

        {/* STATUT */}

        <div>
          <p className="mb-2 text-sm font-semibold text-gray-900">
            Statut
          </p>

          <div className="flex flex-wrap gap-2">
            {statuses.map((status) => {
              const selected =
                statusFilters.includes(
                  status.value
                );

              return (
                <button
                  key={status.value}
                  type="button"
                  onClick={() =>
                    toggleFilter(
                      status.value,
                      statusFilters,
                      setStatusFilters
                    )
                  }
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    selected
                      ? "border-black bg-black text-white"
                      : "bg-white hover:bg-gray-100"
                  }`}
                >
                  {selected && "✓ "}
                  {status.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* THÈMES */}

        <div>
          <p className="mb-2 text-sm font-semibold text-gray-900">
            Thèmes
          </p>

          <div className="flex flex-wrap gap-2">
            {themes.map((theme) => {
              const selected =
                themeFilters.includes(theme);

              return (
                <button
                  key={theme}
                  type="button"
                  onClick={() =>
                    toggleFilter(
                      theme,
                      themeFilters,
                      setThemeFilters
                    )
                  }
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${
                    selected
                      ? "border-black bg-black text-white"
                      : "bg-white hover:bg-gray-100"
                  }`}
                >
                  {selected && "✓ "}
                  {theme}
                </button>
              );
            })}
          </div>
        </div>

        {/* LANGUES */}

        <div>
          <p className="mb-2 text-sm font-semibold text-gray-900">
            Langue
          </p>

          <div className="flex flex-wrap gap-2">
            {conditions.map((condition) => {
              const selected =
                conditionFilters.includes(
                  condition
                );

              return (
                <button
                  key={condition}
                  type="button"
                  onClick={() =>
                    toggleFilter(
                      condition,
                      conditionFilters,
                      setConditionFilters
                    )
                  }
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${
                    selected
                      ? "border-black bg-black text-white"
                      : "bg-white hover:bg-gray-100"
                  }`}
                >
                  {selected && "✓ "}
                  {condition}
                </button>
              );
            })}
          </div>
        </div>

        {/* RESET */}

        {(statusFilters.length > 0 ||
          themeFilters.length > 0 ||
          conditionFilters.length > 0 ||
          search) && (
          <div>
            <button
              type="button"
              onClick={resetFilters}
              className="text-sm font-medium text-gray-600 underline hover:text-black"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
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
              {typeof userLocation?.latitude ===
                "number" &&
              typeof userLocation?.longitude ===
                "number"
                ? radiusFilter !== null
                  ? `Actuellement filtré à ${radiusFilter} km autour de vous`
                  : "Aucun filtre de distance appliqué"
                : "Position non définie"}
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">

          {radiusFilter !== null && (
            <button
              type="button"
              onClick={() =>
                setRadiusFilter(null)
              }
              className="w-full rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-gray-100 sm:w-auto"
            >
              Réinitialiser
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              const hasUserLocation =
                typeof userLocation?.latitude ===
                  "number" &&
                typeof userLocation?.longitude ===
                  "number";

              if (!hasUserLocation) {
                alert(
                  "Vous devez d'abord définir votre localisation dans votre profil pour utiliser ce filtre."
                );

                return;
              }

              setIsMapModalOpen(true);
            }}
            className="w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 sm:w-auto"
          >
            {radiusModifierTexte(
              radiusFilter
            )}
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
                type="button"
                onClick={() =>
                  setIsMapModalOpen(false)
                }
                className="text-xl font-bold text-gray-500 hover:text-black"
              >
                ✕
              </button>
            </div>

            <div className="relative flex-1">
              <RadiusMap
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

                  setIsMapModalOpen(false);
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

          {filteredBooks.map((book) => (
            <Link
              key={book.id}
              href={`/books/${book.id}`}
              prefetch={false}
              className="overflow-hidden rounded-xl border transition hover:-translate-y-1 hover:shadow-lg"
            >

              {/* COVER */}

              <div className="flex h-56 items-center justify-center bg-gray-100 sm:h-64">
                <BookCover
                  src={book.coverImageUrl}
                  alt={book.title}
                />
              </div>

              {/* INFOS */}

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
                      className={`rounded-full px-3 py-1 text-sm font-medium ${
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
          ))}
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