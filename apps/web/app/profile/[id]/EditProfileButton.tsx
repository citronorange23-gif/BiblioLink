"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Props = {
  profileId: string;
};

export default function EditProfileButton({
  profileId,
}: Props) {
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    async function checkOwner() {
      const token =
        localStorage.getItem("token") ??
        localStorage.getItem("accessToken");

      if (!token) {
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        setIsOwner(data.user?.id === profileId);
      } catch (error) {
        console.error("CHECK PROFILE OWNER ERROR:", error);
      }
    }

    checkOwner();
  }, [profileId]);

  if (!isOwner) {
    return null;
  }

  return (
    <Link
      href="/profile/edit"
      className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
    >
      Modifier le profil
    </Link>
  );
}