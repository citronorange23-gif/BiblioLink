"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Props = {
  bookId: string;
  ownerId: string;
};

export default function BookManagementButtons({
  bookId,
  ownerId,
}: Props) {
  const [isOwner, setIsOwner] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkOwner() {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken");

      if (!token) return;

      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) return;

        const data = await response.json();

        setIsOwner(data.user?.id === ownerId);
      } catch (error) {
        console.error("CHECK OWNER ERROR:", error);
      }
    }

    checkOwner();
  }, [ownerId]);

  if (!isOwner) {
    return null;
  }

  async function deleteBook() {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken");

    if (!token) return;

    setDeleting(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/books/${bookId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Impossible de supprimer le livre."
        );
      }

      setShowConfirm(false);

      window.location.reload();
    } catch (error) {
      console.error("DELETE BOOK ERROR:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Impossible de supprimer le livre."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <Link
          href={`/books/${bookId}/edit`}
          className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Modifier
        </Link>

        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className="rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-red-600"
        >
          Supprimer
        </button>
      </div>

      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => {
            if (!deleting) {
              setShowConfirm(false);
              setError("");
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-xl font-semibold">
              Supprimer ce livre ?
            </h2>

            <p className="mt-3 text-gray-600">
              Cette action est définitive. Le livre sera
              supprimé de ton profil.
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
                disabled={deleting}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={deleteBook}
                disabled={deleting}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
              >
                {deleting
                  ? "Suppression..."
                  : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}