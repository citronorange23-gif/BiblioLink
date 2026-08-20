"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Props = {
  profileId: string;
};

export default function LogoutButton({
  profileId,
}: Props) {
  const router = useRouter();

  const [isOwner, setIsOwner] = useState<boolean | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    async function checkOwner() {
      const token =
        localStorage.getItem("token") ??
        localStorage.getItem("accessToken");

      console.log("LOGOUT BUTTON TOKEN:", !!token);
      console.log("PROFILE ID:", profileId);

      if (!token) {
        setIsOwner(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log(
          "AUTH ME STATUS:",
          response.status
        );

        if (!response.ok) {
          setIsOwner(false);
          return;
        }

        const data = await response.json();

        console.log("AUTH ME DATA:", data);
        console.log(
          "CURRENT USER ID:",
          data.user?.id
        );

        setIsOwner(
          data.user?.id === profileId
        );
      } catch (error) {
        console.error(
          "CHECK PROFILE OWNER ERROR:",
          error
        );

        setIsOwner(false);
      }
    }

    checkOwner();
  }, [profileId]);

  // Pendant le check
  if (isOwner === null) {
    return null;
  }

  // Ce n'est pas ton profil
  if (!isOwner) {
    return null;
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");

    window.dispatchEvent(
      new Event("auth-change")
    );

    router.push("/");
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
      >
        Déconnexion
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold">
              Se déconnecter ?
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              Êtes-vous sûr de vouloir vous
              déconnecter ?
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setShowConfirm(false)
                }
                className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={logout}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}