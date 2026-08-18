"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

import "leaflet/dist/leaflet.css";

const API_URL = "http://localhost:4000";

type Owner = {
  id: string;
  username: string;
  latitude: number | null;
  longitude: number | null;
  neighborhood: string | null;
};

type MatchingBook = {
  id: string;
  title: string;
  author: string | null;
  coverImageUrl: string | null;
  owner: Owner;
};

export default function FavoritesMapPage() {
  const [books, setBooks] = useState<MatchingBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [customIcon, setCustomIcon] = useState<any>(null);

  useEffect(() => {
    import("leaflet").then((L) => {
      const icon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });
      setCustomIcon(icon);
    });

    async function fetchMapData() {
      const token =
        localStorage.getItem("token") ??
        localStorage.getItem("accessToken");

      if (!token) {
        setError("Tu dois être connecté pour voir la carte.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/favorites/map`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Impossible de récupérer les données de la carte."
          );
        }

        setBooks(data.books ?? []);
      } catch (err) {
        console.error("FAVORITES MAP FETCH ERROR:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Impossible de récupérer les données de la carte."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchMapData();
  }, []);

  if (loading || !customIcon) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-gray-500">Chargement de la carte...</p>
      </main>
    );
  }

  // Filtrer les livres qui ont un propriétaire géolocalisé
  const validBooks = books.filter(
    (b) => b.owner.latitude !== null && b.owner.longitude !== null
  );

  // Grouper les livres par propriétaire pour éviter les marqueurs superposés en double
  const ownersMap = new Map();
  validBooks.forEach((book) => {
    if (!ownersMap.has(book.owner.id)) {
      ownersMap.set(book.owner.id, {
        owner: book.owner,
        books: [],
      });
    }
    ownersMap.get(book.owner.id).books.push(book);
  });

  const uniqueOwners = Array.from(ownersMap.values()) as Array<{
    owner: Owner;
    books: MatchingBook[];
  }>;

  const quebecCenter: [number, number] = [46.8138, -71.2082];
  const centerMap: [number, number] =
    uniqueOwners.length > 0 &&
    uniqueOwners[0].owner.latitude !== null &&
    uniqueOwners[0].owner.longitude !== null
      ? [uniqueOwners[0].owner.latitude, uniqueOwners[0].owner.longitude]
      : quebecCenter;


    // Ajoute ceci juste avant le return de ta fonction
    console.log("Données des propriétaires sur la carte :", uniqueOwners.map(u => ({
    username: u.owner.username,
    lat: u.owner.latitude,
    lon: u.owner.longitude
    })));

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-4xl font-bold">Carte des favoris 🗺️</h1>
          <p className="mt-2 text-gray-600">
            Clique sur les pins pour découvrir où récupérer tes livres favoris.
          </p>
        </div>

        <Link
          href="/favorites"
          className="inline-flex items-center gap-2 rounded-lg border bg-white px-5 py-3 text-sm font-medium shadow-sm transition hover:bg-gray-50"
        >
          ⬅️ Retour aux favoris
        </Link>
      </div>

      {error ? (
        <div className="rounded-xl border p-10 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      ) : (
        <>
          {uniqueOwners.length === 0 && (
            <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-4 text-amber-800 text-sm">
              📍 Aucune géolocalisation trouvée pour les propriétaires de tes livres favoris. La carte est centrée sur Québec par défaut.
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border shadow-md" style={{ height: "600px", width: "100%" }}>
            <MapContainer
                key={uniqueOwners.map((o) => o.owner.id + o.owner.latitude + o.owner.longitude).join("-")}
                center={centerMap}
                zoom={12}
                style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {uniqueOwners.map(({ owner, books }) => (
                <Marker
                  key={owner.id}
                  position={[owner.latitude!, owner.longitude!]}
                  icon={customIcon}
                >
                  <Popup>
                    <div className="p-2 max-w-xs">
                      <p className="text-xs font-bold text-gray-900 mb-2 border-b pb-1">
                        👤 {owner.username} ({owner.neighborhood || "Quartier inconnu"})
                      </p>

                      <div className="space-y-3 max-h-48 overflow-y-auto">
                        {books.map((book) => (
                          <div key={book.id} className="flex gap-2 items-center border-b pb-2 last:border-none">
                            {book.coverImageUrl && (
                              <img
                                src={book.coverImageUrl}
                                alt={book.title}
                                className="h-12 w-10 object-cover rounded shrink-0"
                              />
                            )}
                            <div className="overflow-hidden">
                              <h4 className="font-semibold text-xs truncate">{book.title}</h4>
                              <p className="text-[10px] text-gray-500 truncate">{book.author}</p>
                              <Link
                                href={`/books/${book.id}`}
                                className="text-[10px] text-blue-600 underline font-medium block mt-0.5"
                              >
                                Voir le livre ➔
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </>
      )}
    </main>
  );
}