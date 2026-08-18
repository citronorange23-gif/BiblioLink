import Link from "next/link";
import { getBooks } from "@/lib/api";

export default async function Home() {
  const data = await getBooks();

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <section className="mb-12">
        <h1 className="text-5xl font-bold tracking-tight">
          Les livres de ton quartier 📚
        </h1>

        <p className="mt-4 text-lg text-gray-600">
          Trouve un livre près de chez toi et discute directement avec son
          propriétaire.
        </p>

        <div className="mt-8">
          <Link
            href="/books"
            className="rounded-lg bg-black px-6 py-3 text-white hover:bg-gray-800"
          >
            Voir tous les livres
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-6 text-2xl font-semibold">
          Livres disponibles
        </h2>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.books.map((book: any) => (
            <Link
              key={book.id}
              href={`/books/${book.id}`}
              className="flex h-full flex-col rounded-xl border p-5 transition hover:shadow-md"
            >
              <div className="mb-4 flex h-48 items-center justify-center rounded-lg bg-gray-100">
                {book.coverImageUrl ? (
                  <img
                    src={book.coverImageUrl}
                    alt={book.title}
                    className="h-full w-full rounded-lg object-cover"
                  />
                ) : (
                  <span className="text-5xl">📖</span>
                )}
              </div>

              <div className="flex flex-1 flex-col">
                <div className="min-h-[64px]">
                  <h3 className="text-xl font-semibold">
                    {book.title}
                  </h3>

                  <p className="mt-1 text-gray-600">
                    {book.author || "Auteur inconnu"}
                  </p>
                </div>

                <div className="mt-auto flex items-center justify-between pt-4">
                  <span className="text-sm text-gray-500">
                    {book.theme || "Sans thème"}
                  </span>

                  <span
                    className={`text-sm font-medium ${
                      book.status === "available"
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >
                    {book.status === "available"
                      ? "Disponible"
                      : "Emprunté"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}