"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const DEFAULT_LAT = 46.8139;
const DEFAULT_LNG = -71.2080;

type BookWithLocation = {
  id: string;
  title: string;
  owner?: {
    username: string;
    latitude: number | null;
    longitude: number | null;
  };
};

type UserLocation = {
  latitude: number | null;
  longitude: number | null;
};

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  return (
    R *
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    )
  );
}

function MapUpdater({
  center,
}: {
  center: [number, number];
}) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, 12);
  }, [center, map]);

  return null;
}

export default function RadiusMap({
  books,
  userLocation,
  onConfirm,
}: {
  books: BookWithLocation[];
  userLocation?: UserLocation | null;
  onConfirm: (
    radius: number,
    center: [number, number]
  ) => void;
}) {
  // Rayon par défaut = 5 km
  const [radius, setRadius] = useState(5);

  /*
   * Centre de recherche
   *
   * Priorité :
   * 1. latitude / longitude du profil
   * 2. Québec par défaut
   */
  const center: [number, number] =
    userLocation &&
    typeof userLocation.latitude === "number" &&
    typeof userLocation.longitude === "number"
      ? [
          userLocation.latitude,
          userLocation.longitude,
        ]
      : [DEFAULT_LAT, DEFAULT_LNG];

  return (
    <div className="relative h-full w-full">
      
      {/* ========================= */}
      {/* PANNEAU DE CONTRÔLE */}
      {/* ========================= */}

      <div className="absolute top-4 right-4 left-auto z-[1000] w-64 rounded-xl border bg-white p-4 shadow-lg">
        
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Rayon de recherche : {radius} km
        </label>

        <input
          type="range"
          min="1"
          max="100"
          value={radius}
          onChange={(e) =>
            setRadius(Number(e.target.value))
          }
          className="mb-4 w-full"
        />

        <button
          onClick={() =>
            onConfirm(radius, center)
          }
          className="w-full rounded-lg bg-black py-2 text-sm font-semibold text-white hover:bg-gray-800"
        >
          Confirmer ce rayon
        </button>

      </div>

      {/* ========================= */}
      {/* CARTE */}
      {/* ========================= */}

      <MapContainer
        center={center}
        zoom={12}
        className="h-full w-full"
      >

        <MapUpdater center={center} />

        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* ========================= */}
        {/* POINT O = UTILISATEUR */}
        {/* ========================= */}

        <Marker position={center}>
          <Popup>
            <strong>Vous êtes ici</strong>
          </Popup>
        </Marker>

        {/* ========================= */}
        {/* CERCLE DE RECHERCHE */}
        {/* ========================= */}

        <Circle
          center={center}
          radius={radius * 1000}
          pathOptions={{
            color: "#3b82f6",
            fillColor: "#3b82f6",
            fillOpacity: 0.2,
          }}
        />

        {/* ========================= */}
        {/* LIVRES DANS LE RAYON */}
        {/* ========================= */}

        {books.map((book) => {
          // Pas de localisation du propriétaire
          if (
            !book.owner ||
            typeof book.owner.latitude !==
              "number" ||
            typeof book.owner.longitude !==
              "number"
          ) {
            return null;
          }

          // Distance entre le user et le propriétaire
          const distance =
            calculateDistance(
              center[0],
              center[1],
              book.owner.latitude,
              book.owner.longitude
            );

          // Livre hors du rayon
          if (distance > radius) {
            return null;
          }

          return (
            <Marker
              key={book.id}
              position={[
                book.owner.latitude,
                book.owner.longitude,
              ]}
            >
              <Popup>
                <div>
                  <strong>
                    {book.title}
                  </strong>

                  <br />

                  Chez{" "}
                  {book.owner.username}

                  <br />

                  À{" "}
                  {distance.toFixed(1)} km
                </div>
              </Popup>
            </Marker>
          );
        })}

      </MapContainer>
    </div>
  );
}