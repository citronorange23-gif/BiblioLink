const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getBooks() {
  try {
    const response = await fetch(`${API_URL}/books`, {
      // Optionnel mais recommandé pour éviter les caches agressifs en dev
      cache: "no-store", 
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch books: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error("GET_BOOKS_ERROR:", error);
    throw error;
  }
}