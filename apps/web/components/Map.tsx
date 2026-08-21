"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
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

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 12);
  }, [center, map]);
  return null;
}

export default function RadiusMap({ 
  books, 
  userLocation, 
  onConfirm 
}: { 
  books: BookWithLocation[]; 
  userLocation?: { latitude: number | null; longitude: number | null } | null;
  onConfirm: (radius: number, center: [number, number]) => void;
}) {
  const [radius, setRadius] = useState(10);

  // Utilisation de la loc du profil si elle existe, sinon secours
  const center: [number, number] = 
    userLocation && 
    typeof userLocation.latitude === "number" && 
    typeof userLocation.longitude === "number" 
      ? [userLocation.latitude, userLocation.longitude] 
      : [DEFAULT_LAT, DEFAULT_LNG];

  return (
    <div className="relative h-full w-full">
      <div className="absolute top-4 left-4 z-[1000] bg-white p-4 rounded-xl shadow-lg border w-64">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rayon de recherche : {radius} km
        </label>
        <input
          type="range"
          min="1"
          max="100"
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          className="w-full mb-4"
        />
        <button
          onClick={() => onConfirm(radius, center)}
          className="w-full bg-black text-white py-2 rounded-lg text-sm font-semibold hover:bg-gray-800"
        >
          Confirmer ce rayon
        </button>
      </div>

      <MapContainer center={center} zoom={12} className="h-full w-full">
        <MapUpdater center={center} />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        <Circle 
          center={center} 
          radius={radius * 1000} 
          pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2 }} 
        />

        {books.map((book) => {
          if (
            !book.owner || 
            typeof book.owner.latitude !== "number" || 
            typeof book.owner.longitude !== "number"
          ) {
            return null;
          }

          const dist = calculateDistance(center[0], center[1], book.owner.latitude, book.owner.longitude);
          if (dist > radius) return null;

          return (
            <Marker key={book.id} position={[book.owner.latitude, book.owner.longitude]}>
              <Popup>{book.title} chez {book.owner.username}</Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}