"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function Navbar() {
  const [userId, setUserId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

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
        console.error("Failed to get current user:", error);

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

    const handleNotificationsChange = () => {
      getUnreadCount();
    };

    window.addEventListener("auth-change", handleAuthChange);

    window.addEventListener(
      "notifications-change",
      handleNotificationsChange
    );

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

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* HEADER */}
        <div className="flex h-16 items-center justify-between">
          {/* LOGO */}
          <Link
            href="/"
            onClick={closeMenu}
            className="text-2xl font-bold"
          >
            Livret
          </Link>

          {/* DESKTOP MENU */}
          <div className="hidden items-center gap-6 md:flex">
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
                className="whitespace-nowrap rounded-lg bg-black px-4 py-2 font-medium text-white hover:bg-gray-800"
              >
                + Ajouter un livre
              </Link>
            )}

            {userId && (
              <Link
                href="/conversations"
                className="flex items-center gap-2 whitespace-nowrap text-gray-600 hover:text-black"
              >
                Messages

                {unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            )}

            {userId ? (
              <Link
                href={`/profile/${userId}`}
                className="whitespace-nowrap text-gray-600 hover:text-black"
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

          {/* MOBILE BUTTON */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-xl md:hidden"
            aria-label="Ouvrir le menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* MOBILE MENU */}
        {menuOpen && (
          <div className="border-t py-4 md:hidden">
            <div className="flex flex-col gap-2">
              <Link
                href="/books"
                onClick={closeMenu}
                className="rounded-lg px-3 py-3 text-gray-700 hover:bg-gray-100"
              >
                📚 Livres
              </Link>

              {userId && (
                <Link
                  href="/favorites"
                  onClick={closeMenu}
                  className="rounded-lg px-3 py-3 text-gray-700 hover:bg-gray-100"
                >
                  ❤️ Favoris
                </Link>
              )}

              {userId && (
                <Link
                  href="/books/add"
                  onClick={closeMenu}
                  className="rounded-lg bg-black px-3 py-3 text-center font-medium text-white hover:bg-gray-800"
                >
                  + Ajouter un livre
                </Link>
              )}

              {userId && (
                <Link
                  href="/conversations"
                  onClick={closeMenu}
                  className="flex items-center justify-between rounded-lg px-3 py-3 text-gray-700 hover:bg-gray-100"
                >
                  <span>💬 Messages</span>

                  {unreadCount > 0 && (
                    <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-2 text-xs font-bold text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
              )}

              {userId ? (
                <Link
                  href={`/profile/${userId}`}
                  onClick={closeMenu}
                  className="rounded-lg px-3 py-3 text-gray-700 hover:bg-gray-100"
                >
                  👤 Profil
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="rounded-lg px-3 py-3 text-gray-700 hover:bg-gray-100"
                >
                  Connexion
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}