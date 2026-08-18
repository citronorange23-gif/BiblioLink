"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import FinalizeBorrowButton from "./FinalizeBorrowButton";
import Link from "next/link";

const API_URL = "http://localhost:4000";

type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: string;
  createdAt: string;
};

type Conversation = {
  id: string;
  userAId: string;
  userBId: string;
  bookId: string;
  createdAt: string;

  book: {
    id: string;
    title: string;
    author: string | null;
    coverImageUrl: string | null;
    status: string;
    ownerId: string;
  };

  messages: Message[];
};

export default function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [conversation, setConversation] =
    useState<Conversation | null>(null);

  const [currentUserId, setCurrentUserId] =
    useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchConversation() {
      const { id } = await params;

      try {
        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("accessToken");

        if (!token) {
          return;
        }

        // Récupérer l'utilisateur connecté
        try {
          const payload = JSON.parse(
            atob(token.split(".")[1])
          );

          if (isMounted) {
            setCurrentUserId(
              payload.userId ||
                payload.sub ||
                null
            );
          }
        } catch {
          console.error(
            "Failed to decode authentication token"
          );
        }

        const response = await fetch(
          `${API_URL}/conversations/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          console.error(
            "CONVERSATION API:",
            data
          );
          return;
        }

        if (isMounted) {
          setConversation(data.conversation);
        }

        // Marquer les notifications de cette conversation
        // comme lues une seule fois
        if (isMounted) {
          const notificationResponse =
            await fetch(
              `${API_URL}/notifications/conversation/${id}/read`,
              {
                method: "PATCH",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

          if (!notificationResponse.ok) {
              console.error(
                "MARK NOTIFICATIONS READ:",
                await notificationResponse.json()
              );
          }

          // Prévenir la Navbar
          window.dispatchEvent(
            new Event("notifications-change")
          );
        }
      } catch (error) {
        console.error(
          "FETCH CONVERSATION ERROR:",
          error
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchConversation();

    const interval = setInterval(
      fetchConversation,
      2000
    );

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [params]);

  async function sendMessage(
    event: FormEvent
  ) {
    event.preventDefault();

    if (
      !message.trim() ||
      !conversation
    ) {
      return;
    }

    setSending(true);

    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken");

      if (!token) {
        return;
      }

      const response = await fetch(
        `${API_URL}/conversations/${conversation.id}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: message.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(
          "SEND MESSAGE API:",
          data
        );
        return;
      }

      setConversation((current) => {
        if (!current) {
          return current;
        }

        const exists =
          current.messages.some(
            (msg) =>
              msg.id === data.message.id
          );

        if (exists) {
          return current;
        }

        return {
          ...current,
          messages: [
            ...current.messages,
            data.message,
          ],
        };
      });

      setMessage("");
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
        });
      }, 50);
    } catch (error) {
      console.error(
        "SEND MESSAGE ERROR:",
        error
      );
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <p className="text-gray-500">
          Chargement...
        </p>
      </main>
    );
  }

  if (!conversation) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="text-2xl font-bold">
          Conversation introuvable
        </h1>

        <Link
          href="/conversations"
          className="mt-5 inline-block underline"
        >
          ← Retour aux messages
        </Link>
      </main>
    );
  }

  const isOwner =
    currentUserId ===
    conversation.book.ownerId;

  return (
    <main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-4xl flex-col px-4 py-6 sm:px-6 sm:py-8">

      <Link
        href="/conversations"
        className="mb-6 text-sm text-gray-500 hover:text-black"
      >
        ← Retour aux messages
      </Link>

      {/* HEADER */}
      <div className="flex items-center justify-between gap-4 border-b pb-5">

        <div className="flex min-w-0 items-center gap-4">

          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100">

            {conversation.book.coverImageUrl ? (
              <img
                src={
                  conversation.book
                    .coverImageUrl
                }
                alt={
                  conversation.book.title
                }
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-2xl">
                📖
              </span>
            )}

          </div>

          <div className="min-w-0">

            <h1 className="truncate text-xl font-bold">
              {conversation.book.title}
            </h1>

            <p className="truncate text-sm text-gray-500">
              {conversation.book.author ||
                "Auteur inconnu"}
            </p>

          </div>

        </div>

        {/* SEUL LE PROPRIETAIRE VOIT LE BOUTON */}
        {isOwner && (
          <FinalizeBorrowButton
            conversationId={conversation.id}
            bookStatus={conversation.book.status}
            ownerId={conversation.book.ownerId}
            />
        )}

      </div>

      {/* MESSAGES */}
      <div className="flex-1 space-y-4 overflow-y-auto py-6">

        {conversation.messages.length ===
        0 ? (
          <div className="py-10 text-center text-gray-500">
            Aucun message pour le moment.
          </div>
        ) : (
          conversation.messages.map(
            (msg) => {

              {/* MESSAGE SYSTEME */}
              if (
                msg.type === "SYSTEM"
              ) {
                return (
                  <div
                    key={msg.id}
                    className="flex justify-center py-2"
                  >
                    <p className="rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-500">
                      {msg.content}
                    </p>
                  </div>
                );
              }

              {/* MESSAGE NORMAL */}
              const isMine =
                msg.senderId ===
                currentUserId;

              return (
                <div
                  key={msg.id}
                  className={`flex ${
                    isMine
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >

                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[70%] ${
                      isMine
                        ? "bg-black text-white"
                        : "bg-gray-100 text-black"
                    }`}
                  >

                    <p className="whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>

                    <p
                      className={`mt-1 text-xs ${
                        isMine
                          ? "text-gray-300"
                          : "text-gray-500"
                      }`}
                    >
                      {new Date(
                        msg.createdAt
                      ).toLocaleTimeString(
                        [],
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>

                  </div>

                </div>

                
              );
            }
            
          )
        )}

        <div ref={messagesEndRef} />

      </div>

      {/* INPUT */}
      <form
        onSubmit={sendMessage}
        className="flex gap-2 border-t pt-4"
      >

        <input
          type="text"
          value={message}
          onChange={(event) =>
            setMessage(
              event.target.value
            )
          }
          placeholder="Écrire un message..."
          className="min-w-0 flex-1 rounded-xl border px-4 py-3 outline-none focus:border-black"
          disabled={sending}
        />

        <button
          type="submit"
          disabled={
            sending ||
            !message.trim()
          }
          className="rounded-xl bg-black px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {sending
            ? "..."
            : "Envoyer"}
        </button>

      </form>

    </main>
  );
}