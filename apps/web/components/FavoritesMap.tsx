"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Correction des icônes Leaflet avec Next.js
// @ts-expect-error - Propriété interne Leaflet non typée
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type HolderBook = {
  id: string;
  title: string;
  coverImageUrl?: string;
  owner: {
    id: string;
    username: string;
    latitude: number | null;
    longitude: number | null;
    neighborhood?: string | null;
  };
};

// Formule de Haversine pour calculer la distance en km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function FitMapToMarkers({
  holders,
}: {
  holders: HolderBook[];
}) {
  const map = useMap();

  useEffect(() => {
    const validHolders = holders.filter(
      (item) =>
        item.owner &&
        item.owner.latitude !== null &&
        item.owner.latitude !== undefined &&
        item.owner.longitude !== null &&
        item.owner.longitude !== undefined
    );

    if (validHolders.length === 0) {
      map.setView([46.8139, -71.2080], 12);
      return;
    }

    if (validHolders.length === 1) {
      const owner = validHolders[0].owner;
      map.setView([owner.latitude!, owner.longitude!], 14);
      return;
    }

    const bounds = L.latLngBounds(
      validHolders.map((item) => [
        item.owner.latitude!,
        item.owner.longitude!,
      ])
    );

    map.fitBounds(bounds, {
      padding: [50, 50],
      maxZoom: 14,
      animate: true,
    });
  }, [holders, map]);

  return null;
}

export default function FavoritesMapPage() {
  const [holders, setHolders] = useState<HolderBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Nouveau state pour le filtre par rayon (en km, ou "all")
  const [maxRadius, setMaxRadius] = useState<number | "all">("all");
  
  // Point de référence (par exemple, le centre par défaut ou la position de l'utilisateur connecté)
  // Ici on prend le centre de la carte (Québec) comme point de départ si besoin, ou on peut le dynamiser
  const centerLat = 46.8139;
  const centerLng = -71.2080;

  useEffect(() => {
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
        const response = await fetch(
          `${API_URL}/favorites/map`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Impossible de récupérer les données de la carte."
          );
        }

        setHolders(data.books ?? []);
      } catch (err) {
        console.error("FETCH MAP ERROR:", err);
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

  // Filtrage des détenteurs selon le rayon choisi
  const filteredHolders = holders.filter((item) => {
    if (maxRadius === "all") return true;
    const lat = item.owner?.latitude;
    const lng = item.owner?.longitude;
    if (lat === null || lat === undefined || lng === null || lng === undefined) return false;

    const distance = calculateDistance(centerLat, centerLng, lat, lng);
    return distance <= maxRadius;
  });

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12">
        <p className="text-gray-500">Chargement de la carte...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            🗺️ Où trouver vos livres favoris ?
          </h1>
          <p className="mt-2 text-gray-600">
            Découvrez les utilisateurs autour de vous qui possèdent
            les livres de votre liste de favoris.
          </p>
        </div>

        {/* Sélecteur de rayon */}
        <div className="flex items-center gap-2 bg-white p-3 rounded-xl border shadow-sm">
          <label className="text-sm font-medium text-gray-700">Rayon :</label>
          <select
            value={maxRadius}
            onChange={(e) =>
              setMaxRadius(e.target.value === "all" ? "all" : Number(e.target.value))
            }
            className="rounded-lg border px-3 py-1.5 text-sm outline-none focus:border-black"
          >
            <option value="all">Tous (Illimité)</option>
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
            <option value={20}>20 km</option>
            <option value={50}>50 km</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-8 h-[500px] w-full overflow-hidden rounded-2xl border">
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={12}
          scrollWheelZoom={true}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Ajuste le zoom dynamiquement sur les éléments filtrés */}
          <FitMapToMarkers holders={filteredHolders} />

          {filteredHolders.map((item) => {
            const latitude = item.owner?.latitude;
            const longitude = item.owner?.longitude;

            if (
              latitude === null ||
              latitude === undefined ||
              longitude === null ||
              longitude === undefined
            ) {
              return null;
            }

            return (
              <Marker
                key={item.id}
                position={[latitude, longitude]}
              >
                <Popup>
                  <div className="min-w-[180px] p-1">
                    <p className="font-bold">{item.title}</p>
                    <p className="mt-1 text-sm text-gray-600">
                      Possédé par :{" "}
                      <span className="font-medium">
                        {item.owner.username}
                      </span>
                    </p>
                    {item.owner.neighborhood && (
                      <p className="mt-1 text-xs text-gray-400">
                        📍 {item.owner.neighborhood}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </main>
  );
}