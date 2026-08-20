"use client";

import { useEffect, useRef, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
type Props = {
  value?: string;
  onChange: (url: string) => void;
};

export default function BookCoverPicker({
  value,
  onChange,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const [cameraOpen, setCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;

    setError("");

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Format invalide. Utilise JPG, PNG ou WebP."
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "L'image ne doit pas dépasser 5 Mo."
      );
      return;
    }

    const token =
      localStorage.getItem("token") ??
      localStorage.getItem("accessToken");

    if (!token) {
      setError(
        "Tu dois être connecté pour envoyer une image."
      );
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("cover", file);

      const response = await fetch(
        `${API_URL}/books/cover`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Impossible d'envoyer la couverture."
        );
      }

      const imageUrl = data.coverImageUrl;

      if (!imageUrl) {
        throw new Error(
          "Le serveur n'a pas retourné l'image."
        );
      }

      onChange(imageUrl);
    } catch (error) {
      console.error(
        "COVER UPLOAD ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Impossible d'envoyer la couverture."
      );
    } finally {
      setUploading(false);
    }
  }

  function handleStorageChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    handleFile(file);
    event.target.value = "";
  }

  // =========================
  // Ouvrir la caméra
  // =========================

  async function openCamera() {
    setError("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        "La caméra n'est pas disponible dans ce navigateur."
      );
      return;
    }

    try {
      const mediaStream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment", // Utilise la caméra arrière par défaut pour un livre
          },
          audio: false,
        });

      setStream(mediaStream);
      setCameraOpen(true);
    } catch (error) {
      console.error("CAMERA ERROR:", error);
      setError(
        "Impossible d'accéder à la caméra. Vérifie les permissions du navigateur."
      );
    }
  }

  // =========================
  // Connecter le stream à la vidéo
  // =========================

  useEffect(() => {
    if (!cameraOpen || !stream || !videoRef.current) {
      return;
    }

    videoRef.current.srcObject = stream;

    videoRef.current.play().catch((error) => {
      console.error("VIDEO PLAY ERROR:", error);
    });
  }, [cameraOpen, stream]);

  // =========================
  // Fermer la caméra
  // =========================

  function closeCamera() {
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
    }

    setStream(null);
    setCameraOpen(false);
  }

  // =========================
  // Prendre la photo
  // =========================

  function takePhoto() {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (!video.videoWidth || !video.videoHeight) {
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

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Impossible de créer la photo.");
          return;
        }

        const file = new File(
          [blob],
          "cover.jpg",
          {
            type: "image/jpeg",
          }
        );

        closeCamera();
        handleFile(file);
      },
      "image/jpeg",
      0.9
    );
  }

  // =========================
  // Nettoyage caméra
  // =========================

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, [stream]);

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() =>
          fileInputRef.current?.click()
        }
        disabled={uploading || cameraOpen}
        className="rounded-lg border px-4 py-3 text-sm font-medium transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        📁 Depuis mon appareil
      </button>

      <button
        type="button"
        onClick={openCamera}
        disabled={uploading || cameraOpen}
        className="rounded-lg border px-4 py-3 text-sm font-medium transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        📷 Prendre une photo
      </button>

      {/* Caméra en direct */}
      {cameraOpen && (
        <div className="rounded-xl border bg-black p-4">
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

      {uploading && (
        <p className="text-sm text-gray-500">
          Upload de la couverture...
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleStorageChange}
        className="hidden"
      />
    </div>
  );
}