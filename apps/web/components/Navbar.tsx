
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const API_URL = "http://localhost:4000";

export default function Navbar() {
  const [userId, setUserId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function getCurrentUser() {
      const token =
        localStorage.getItem("token") ??
        localStorage.getItem("accessToken");

      if (!token) {
        setUserId(null);
        setUnreadCount(0);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          setUserId(null);
          setUnreadCount(0);
          return;
        }

        const data = await response.json();

        setUserId(data.user?.id ?? null);
      } catch (error) {
        console.error(
          "Failed to get current user:",
          error
        );

        setUserId(null);
        setUnreadCount(0);
      }
    }

    async function getUnreadCount() {
      const token =
        localStorage.getItem("token") ??
        localStorage.getItem("accessToken");

      if (!token) {
        setUnreadCount(0);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/notifications/unread-count`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          setUnreadCount(0);
          return;
        }

        const data = await response.json();

        setUnreadCount(data.count ?? 0);
      } catch (error) {
        console.error(
          "Failed to get unread notifications:",
          error
        );

        setUnreadCount(0);
      }
    }

    async function refreshAuthAndNotifications() {
      await getCurrentUser();
      await getUnreadCount();
    }

    refreshAuthAndNotifications();

    const handleAuthChange = () => {
      refreshAuthAndNotifications();
    };

    window.addEventListener(
      "auth-change",
      handleAuthChange
    );

    const handleNotificationsChange = () => {
      getUnreadCount();
    };

    window.addEventListener(
      "notifications-change",
      handleNotificationsChange
    );

    // Vérifie régulièrement les nouvelles notifications
    const interval = setInterval(() => {
      getUnreadCount();
    }, 5000);

    return () => {
      window.removeEventListener(
        "auth-change",
        handleAuthChange
      );

      window.removeEventListener(
        "notifications-change",
        handleNotificationsChange
      );

      clearInterval(interval);
    };
  }, []);

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="text-2xl font-bold"
        >
          Livret
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/books"
            className="text-gray-600 hover:text-black"
          >
            Livres
          </Link>

          {userId && (
            <Link
              href="/favorites"
              className="text-gray-600 hover:text-black"
            >
              ❤️ Favoris
            </Link>
          )}

          {userId && (
            <Link
              href="/books/add"
              className="rounded-lg bg-black px-4 py-2 font-medium text-white hover:bg-gray-800"
            >
              + Ajouter un livre
            </Link>
          )}

          <Link
            href="/conversations"
            className="flex items-center gap-2 text-gray-600 hover:text-black"
          >
            Messages

            {unreadCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                {unreadCount > 99
                  ? "99+"
                  : unreadCount}
              </span>
            )}
          </Link>

          {userId ? (
            <Link
              href={`/profile/${userId}`}
              className="text-gray-600 hover:text-black"
            >
              Profil
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-gray-600 hover:text-black"
            >
              Connexion
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}