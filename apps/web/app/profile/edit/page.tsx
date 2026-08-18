"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { canadaLocations } from "@/app/data/locations";
const API_URL = "http://localhost:4000";


export default function EditProfilePage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // États pour les sélections en cascade
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("");

  // États géolocalisation
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [geocoding, setGeocoding] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  const [cameraOpen, setCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // =========================
  // Charger le profil
  // =========================

  useEffect(() => {
    async function loadProfile() {
      const token =
        localStorage.getItem("token") ??
        localStorage.getItem("accessToken");

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Impossible de récupérer le profil."
          );
        }

        const user = data.user ?? data;

        setUsername(user.username ?? "");
        setBio(user.bio ?? "");
        setAvatarUrl(user.avatarUrl ?? "");
        setLatitude(user.latitude ?? null);
        setLongitude(user.longitude ?? null);

        // Si l'utilisateur a déjà un quartier enregistré, on essaie de le pré-remplir
        // Format attendu stocké : "Quartier, Ville, Province"
        if (user.neighborhood) {
          const parts = user.neighborhood.split(",").map((p: string) => p.trim());
          if (parts.length >= 3) {
            setSelectedNeighborhood(parts[0]);
            setSelectedCity(parts[1]);
            setSelectedProvince(parts[2]);
          } else if (parts.length === 2) {
            setSelectedCity(parts[0]);
            setSelectedProvince(parts[1]);
          } else {
            setSelectedProvince("Québec"); // Valeur par défaut logique
          }
        }
      } catch (error) {
        console.error("LOAD PROFILE ERROR:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Impossible de récupérer le profil."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  // =========================
  // Gestion de la cascade
  // =========================

  function handleProvinceChange(province: string) {
    setSelectedProvince(province);
    setSelectedCity("");
    setSelectedNeighborhood("");
  }

  function handleCityChange(city: string) {
    setSelectedCity(city);
    setSelectedNeighborhood("");
  }

  // =========================
  // Géolocalisation GPS (Nominatim / OpenStreetMap)
  // =========================

  async function handleGeolocate() {
    setError("");

    if (!navigator.geolocation) {
      setError("Géolocalisation non supportée par ce navigateur.");
      return;
    }

    setGeocoding(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lon } = position.coords;
        setLatitude(lat);
        setLongitude(lon);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
            { headers: { "Accept-Language": "fr" } }
          );
          const data = await res.json();

          if (data?.address) {
            const addr = data.address;
            const city = addr.city || addr.town || addr.village || "";
            const state = addr.state || "";
            const suburb =
              addr.suburb || addr.neighbourhood || addr.city_district || "";

            if (canadaLocations[state]) {
              setSelectedProvince(state);

              if (canadaLocations[state][city]) {
                setSelectedCity(city);

                const quartiers = canadaLocations[state][city];
                if (suburb && quartiers.includes(suburb)) {
                  setSelectedNeighborhood(suburb);
                } else {
                  setSelectedNeighborhood("");
                }
              } else {
                setSelectedCity("");
                setSelectedNeighborhood("");
              }
            } else {
              setError("Impossible de faire correspondre ta position à une ville connue.");
            }
          }
        } catch (err) {
          console.error("GEOCODE ERROR:", err);
          setError("Erreur lors de la détection d'adresse.");
        } finally {
          setGeocoding(false);
        }
      },
      () => {
        setError("Permission GPS refusée.");
        setGeocoding(false);
      }
    );
  }

  // =========================
  // Ouvrir la caméra
  // =========================

  async function openCamera() {
    setError("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("La caméra n'est pas disponible dans ce navigateur.");
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });

      setStream(mediaStream);
      setCameraOpen(true);
    } catch (error) {
      console.error("CAMERA ERROR:", error);
      setError("Impossible d'accéder à la caméra. Vérifie les permissions.");
    }
  }

  useEffect(() => {
    if (!cameraOpen || !stream || !videoRef.current) {
      return;
    }

    videoRef.current.srcObject = stream;
    videoRef.current.play().catch((error) => {
      console.error("VIDEO PLAY ERROR:", error);
    });
  }, [cameraOpen, stream]);

  function closeCamera() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
    setCameraOpen(false);
  }

  function takePhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setError("La caméra n'est pas encore prête.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");

    if (!context) {
      setError("Impossible de capturer la photo.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Impossible de créer la photo.");
          return;
        }

        const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
        const previewUrl = URL.createObjectURL(file);

        setAvatarFile(file);
        setAvatarPreview(previewUrl);
        closeCamera();
      },
      "image/jpeg",
      0.9
    );
  }

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  // =========================
  // Sauvegarder le profil
  // =========================

  // =========================
  // Sauvegarder le profil
  // =========================

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();

    const token =
      localStorage.getItem("token") ??
      localStorage.getItem("accessToken");

    if (!token) {
      router.push("/login");
      return;
    }

    setSaving(true);
    setError("");

    try {
      let finalAvatarUrl = avatarUrl;

      if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);

        const avatarResponse = await fetch(`${API_URL}/users/avatar`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const avatarData = await avatarResponse.json();

        if (!avatarResponse.ok) {
          throw new Error(avatarData.error || "Impossible d'envoyer l'image.");
        }

        finalAvatarUrl = avatarData.user.avatarUrl;
      }

      // Construction de la chaîne de localisation propre
      const neighborhoodString = [
        selectedNeighborhood,
        selectedCity,
        selectedProvince,
      ]
        .filter(Boolean)
        .join(", ");

      // 📍 MISE À JOUR AUTOMATIQUE DE LA LAT/LON SI LA LOCALISATION A CHANGÉ VIA LES MENUS
      let currentLat = latitude;
      let currentLon = longitude;

      if (neighborhoodString) {
        try {
          const query = encodeURIComponent(`${neighborhoodString}, Canada`);
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`,
            { headers: { "Accept-Language": "fr" } }
          );
          const geoData = await geoRes.json();

          if (geoData && geoData.length > 0) {
            currentLat = parseFloat(geoData[0].lat);
            currentLon = parseFloat(geoData[0].lon);
          }
        } catch (geoErr) {
          console.error("Erreur géocodage manuel:", geoErr);
          // On continue quand même la sauvegarde même si le fetch Nominatim échoue
        }
      }

      const response = await fetch(`${API_URL}/auth/me`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          bio,
          neighborhood: neighborhoodString,
          latitude: currentLat,
          longitude: currentLon,
          avatarUrl: finalAvatarUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Impossible de modifier le profil.");
      }

      router.push(`/profile/${data.user.id}`);
      router.refresh();
    } catch (error) {
      console.error("UPDATE PROFILE ERROR:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Impossible de modifier le profil."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-12">
        <p className="text-gray-500">Chargement...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Modifier mon profil</h1>
        <p className="mt-2 text-gray-600">
          Modifie les informations de ton profil.
        </p>
      </div>

      <form
        onSubmit={saveProfile}
        className="space-y-6 rounded-2xl border p-6"
      >
        {/* Nom d'utilisateur */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Nom d'utilisateur
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="mb-2 block text-sm font-medium">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            placeholder="Parle un peu de toi..."
            className="w-full resize-none rounded-lg border px-4 py-3 outline-none focus:border-black"
          />
        </div>

        {/* Localisation en cascade (Province ➔ Ville ➔ Quartier) */}
        <div className="space-y-4 rounded-xl border bg-gray-50/50 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">📍 Localisation</h3>
            <button
              type="button"
              onClick={handleGeolocate}
              disabled={geocoding}
              className="text-xs font-medium text-blue-600 underline disabled:opacity-50"
            >
              {geocoding ? "Recherche..." : "🎯 Utiliser ma position"}
            </button>
          </div>

          {/* 1. Province */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Province
            </label>
            <select
              value={selectedProvince}
              onChange={(e) => handleProvinceChange(e.target.value)}
              className="w-full rounded-lg border bg-white px-4 py-2.5 text-sm outline-none focus:border-black"
            >
              <option value="">Sélectionner une province...</option>
              {Object.keys(canadaLocations).map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Ville */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Ville
            </label>
            <select
              value={selectedCity}
              onChange={(e) => handleCityChange(e.target.value)}
              disabled={!selectedProvince}
              className="w-full rounded-lg border bg-white px-4 py-2.5 text-sm outline-none focus:border-black disabled:opacity-50"
            >
              <option value="">Sélectionner une ville...</option>
              {selectedProvince &&
                Object.keys(canadaLocations[selectedProvince]).map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
            </select>
          </div>

          {/* 3. Quartier */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Quartier
            </label>
            <select
              value={selectedNeighborhood}
              onChange={(e) => setSelectedNeighborhood(e.target.value)}
              disabled={!selectedCity}
              className="w-full rounded-lg border bg-white px-4 py-2.5 text-sm outline-none focus:border-black disabled:opacity-50"
            >
              <option value="">Sélectionner un quartier...</option>
              {selectedCity &&
                canadaLocations[selectedProvince][selectedCity].map(
                  (quartier) => (
                    <option key={quartier} value={quartier}>
                      {quartier}
                    </option>
                  )
                )}
            </select>
          </div>
        </div>

        {/* Avatar */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Photo de profil
          </label>
          <div className="flex items-start gap-5">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-3xl">
              {avatarPreview || avatarUrl ? (
                <img
                  src={
                    avatarPreview ||
                    (avatarUrl?.startsWith("http")
                      ? avatarUrl
                      : `${API_URL}${avatarUrl}`)
                  }
                  alt="Aperçu de l'avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                "👤"
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="cursor-pointer rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">
                📁 Choisir une image
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setAvatarFile(file);
                    setAvatarPreview(URL.createObjectURL(file));
                  }}
                />
              </label>

              <button
                type="button"
                onClick={openCamera}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
              >
                📷 Prendre une photo
              </button>
            </div>
          </div>

          {cameraOpen && (
            <div className="mt-5 rounded-xl border bg-black p-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="mx-auto max-h-96 w-full rounded-lg object-cover"
              />
              <div className="mt-4 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={closeCamera}
                  className="rounded-lg bg-white px-4 py-2 text-sm hover:bg-gray-100"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={takePhoto}
                  className="rounded-lg bg-white px-4 py-2 text-sm font-medium hover:bg-gray-100"
                >
                  📸 Prendre la photo
                </button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-lg bg-red-100 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

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
            className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </main>
  );
}