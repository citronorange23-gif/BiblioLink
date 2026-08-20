"use client";

import { useEffect, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Props = {
  conversationId: string;
  bookStatus: string;
  ownerId: string;
};

export default function FinalizeBorrowButton({
  conversationId,
  bookStatus,
  ownerId,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const token =
      localStorage.getItem("token") ??
      localStorage.getItem("accessToken");

    if (!token) {
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));

      setCurrentUserId(
        payload.userId || payload.sub || null
      );
    } catch {
      setCurrentUserId(null);
    }
  }, []);

  // Le bouton n'existe même pas pour l'autre utilisateur
  if (!currentUserId || currentUserId !== ownerId) {
    return null;
  }

  async function changeBookStatus() {
    const token =
      localStorage.getItem("token") ??
      localStorage.getItem("accessToken");

    if (!token) {
      setError("Tu dois être connecté.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const endpoint =
        bookStatus === "available"
          ? `${API_URL}/conversations/${conversationId}/finalize`
          : `${API_URL}/conversations/${conversationId}/return`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          `Le serveur a renvoyé une réponse non-JSON (${response.status})`
        );
      }

      if (!response.ok) {
        throw new Error(data.error || "Erreur API");
      }

      setShowConfirm(false);

      window.location.reload();
    } catch (error) {
      console.error("BOOK STATUS ERROR:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Impossible de modifier le statut du livre."
      );
    } finally {
      setLoading(false);
    }
  }

  const isBorrowed = bookStatus === "borrowed";

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        disabled={loading}
        className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 ${
          isBorrowed
            ? "bg-gray-600 hover:bg-gray-700"
            : "bg-black hover:bg-gray-800"
        }`}
      >
        {loading
          ? "..."
          : isBorrowed
          ? "↩ Remettre disponible"
          : "Finaliser l'emprunt"}
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold">
              {isBorrowed
                ? "Remettre le livre disponible"
                : "Confirmer l'emprunt"}
            </h2>

            <p className="mt-3 text-gray-600">
              {isBorrowed
                ? "Es-tu sûr que le livre a été rendu ? Il sera de nouveau marqué comme disponible."
                : "Es-tu sûr que vous êtes bien d'accord pour finaliser l'emprunt ? Le livre sera marqué comme emprunté."}
            </p>

            {error && (
              <div className="mt-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowConfirm(false);
                  setError("");
                }}
                disabled={loading}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={changeBookStatus}
                disabled={loading}
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {loading
                  ? "..."
                  : isBorrowed
                  ? "Confirmer le retour"
                  : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}