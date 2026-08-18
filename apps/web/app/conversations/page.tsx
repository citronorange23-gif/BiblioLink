"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_URL = "http://localhost:4000";

type Message = {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
};

type Conversation = {
  id: string;
  userAId: string;
  userBId: string;
  bookId: string;
  createdAt: string;
  unreadNotificationCount?: number;
  unreadCount?: number;
  unread?: number;

  userA: {
    id: string;
    username: string;
  };

  userB: {
    id: string;
    username: string;
  };

  book: {
    id: string;
    title: string;
    author: string | null;
    coverImageUrl: string | null;
    status: string;
  };

  messages: Message[];
};

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const [conversationToDelete, setConversationToDelete] =
    useState<Conversation | null>(null);

  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchConversations() {
      try {
        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("accessToken");

        if (!token) {
          return;
        }

        const response = await fetch(`${API_URL}/conversations`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          console.error("CONVERSATIONS API:", data);
          return;
        }

        if (isMounted) {
          setConversations(data.conversations ?? []);
        }
      } catch (error) {
        console.error("FETCH CONVERSATIONS ERROR:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    // Premier chargement
    fetchConversations();

    // Refresh automatique
    const interval = setInterval(() => {
      fetchConversations();
    }, 2000);

    // Permet de rafraîchir instantanément depuis la Navbar
    const handleNotificationsChange = () => {
      fetchConversations();
    };

    window.addEventListener(
      "notifications-change",
      handleNotificationsChange
    );

    return () => {
      isMounted = false;
      clearInterval(interval);

      window.removeEventListener(
        "notifications-change",
        handleNotificationsChange
      );
    };
  }, []);

  async function deleteConversation() {
    if (!conversationToDelete) {
      return;
    }

    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken");

    if (!token) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(
        `${API_URL}/conversations/${conversationToDelete.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("DELETE CONVERSATION API:", data);
        return;
      }

      // Disparition immédiate sans reload
      setConversations((current) =>
        current.filter(
          (conversation) =>
            conversation.id !== conversationToDelete.id
        )
      );

      setConversationToDelete(null);

      window.dispatchEvent(
        new Event("notifications-change")
      );
    } catch (error) {
      console.error("DELETE CONVERSATION ERROR:", error);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="text-3xl font-bold">Messages</h1>

        <p className="mt-6 text-gray-500">
          Chargement...
        </p>
      </main>
    );
  }

  return (
    <>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold sm:text-4xl">
            Messages
          </h1>

          <p className="mt-2 text-gray-600">
            Tes conversations concernant les livres.
          </p>
        </div>

        {conversations.length === 0 ? (
          <div className="rounded-2xl border p-8 text-center sm:p-12">
            <div className="text-5xl">💬</div>

            <h2 className="mt-4 text-xl font-semibold">
              Aucune conversation
            </h2>

            <p className="mt-2 text-gray-500">
              Quand tu demanderas un livre, ta conversation apparaîtra ici.
            </p>

            <Link
              href="/books"
              className="mt-6 inline-block rounded-lg bg-black px-5 py-3 font-medium text-white hover:bg-gray-800"
            >
              Voir les livres
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((conversation) => {
              const lastMessage = conversation.messages[0];
              
              // Vérifie toutes les variantes possibles du champ de notification non lue
              const unreadCount = 
                conversation.unreadNotificationCount ?? 
                conversation.unreadCount ?? 
                conversation.unread ?? 
                0;

              return (
                <Link
                  key={conversation.id}
                  href={`/conversations/${conversation.id}`}
                  className="flex items-center gap-4 rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"
                >
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
                    {conversation.book.coverImageUrl ? (
                      <img
                        src={conversation.book.coverImageUrl}
                        alt={conversation.book.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl">📖</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-lg font-semibold">
                      {conversation.book.title} -{" "}
                      {(() => {
                        const token =
                          localStorage.getItem("token") ||
                          localStorage.getItem("accessToken");

                        if (!token) {
                          return "";
                        }

                        try {
                          const payload = JSON.parse(
                            atob(token.split(".")[1])
                          );

                          const currentUserId =
                            payload.userId ||
                            payload.sub ||
                            "";

                          return conversation.userA.id === currentUserId
                            ? conversation.userB.username
                            : conversation.userA.username;
                        } catch {
                          return "";
                        }
                      })()}
                    </h2>

                    <p className="truncate text-sm text-gray-500">
                      {lastMessage?.content || "Aucun message"}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    {unreadCount > 0 && (
                      <span
                        className="h-3 w-3 rounded-full bg-red-500"
                        title="Nouveau message"
                      />
                    )}

                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();

                        setConversationToDelete(conversation);
                      }}
                      className="rounded-lg px-2 py-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                      title="Supprimer la conversation"
                    >
                      🗑️
                    </button>

                    <span className="hidden text-sm text-gray-400 sm:block">
                      →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      {conversationToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => {
            if (!deleting) {
              setConversationToDelete(null);
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-xl font-semibold">
              Supprimer la conversation ?
            </h2>

            <p className="mt-3 text-gray-600">
              La conversation sera retirée de ta liste.
              Elle pourra réapparaître si tu reçois un nouveau
              message.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConversationToDelete(null)}
                disabled={deleting}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={deleteConversation}
                disabled={deleting}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}