"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Props = {
  bookId: string;
  isAvailable: boolean;
};

export default function BorrowButton({
  bookId,
  isAvailable,
}: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleBorrow() {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken");

    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Impossible de créer la conversation.");
        return;
      }

      router.push(`/conversations/${data.conversation.id}`);
    } catch (error) {
      console.error("BORROW ERROR:", error);
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  if (!isAvailable) {
    return (
      <button
        disabled
        className="mt-6 w-full cursor-not-allowed rounded-lg bg-gray-200 px-6 py-3 font-medium text-gray-500"
      >
        Déjà emprunté
      </button>
    );
  }

  return (
    <div className="mt-6">
      <button
        onClick={handleBorrow}
        disabled={loading}
        className="w-full rounded-lg bg-black px-6 py-3 font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {loading
          ? "Création de la conversation..."
          : "Demander à emprunter"}
      </button>

      {error && (
        <p className="mt-3 text-center text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}