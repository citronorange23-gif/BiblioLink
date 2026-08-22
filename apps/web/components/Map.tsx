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

type UserLocation = {
  latitude: number | null;
  longitude: number | null;
};

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
  userLocation,
  onConfirm,
}: {
  userLocation?: UserLocation | null;
  onConfirm: (
    radius: number,
    center: [number, number]
  ) => void;
}) {
  const [radius, setRadius] = useState(5);

  // ========================================
  // VÉRIFIER LA LOCALISATION
  // ========================================

  const hasUserLocation =
    typeof userLocation?.latitude === "number" &&
    typeof userLocation?.longitude === "number";

  // Si pas de localisation, on ne devrait normalement
  // jamais arriver ici puisque BooksPage bloque l'ouverture.
  if (!hasUserLocation) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-100">
        <div className="rounded-xl bg-white p-6 text-center shadow-lg">
          <p className="font-semibold text-gray-900">
            Localisation requise
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Définissez votre localisation dans votre profil
            pour utiliser le filtre géographique.
          </p>
        </div>
      </div>
    );
  }

  // ========================================
  // CENTRE = UNIQUEMENT LE USER CONNECTÉ
  // ========================================

  const center: [number, number] = [
    userLocation.latitude!,
    userLocation.longitude!,
  ];

  return (
    <div className="relative h-full w-full">

      {/* ======================================== */}
      {/* PANNEAU DE CONTRÔLE */}
      {/* ======================================== */}

      <div className="absolute top-4 right-4 z-[1000] w-64 rounded-xl border bg-white p-4 shadow-lg">

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

      {/* ======================================== */}
      {/* CARTE */}
      {/* ======================================== */}

      <MapContainer
        center={center}
        zoom={12}
        className="h-full w-full"
      >

        <MapUpdater center={center} />

        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* ======================================== */}
        {/* POSITION DU USER UNIQUEMENT */}
        {/* ======================================== */}

        <Marker position={center}>
          <Popup>
            <strong>Vous êtes ici</strong>
          </Popup>
        </Marker>

        {/* ======================================== */}
        {/* CERCLE DE RECHERCHE */}
        {/* ======================================== */}

        <Circle
          center={center}
          radius={radius * 1000}
          pathOptions={{
            color: "#3b82f6",
            fillColor: "#3b82f6",
            fillOpacity: 0.2,
          }}
        />

      </MapContainer>
    </div>
  );
}