import type { Book } from "./data";
import { germanFromSearch } from "./openlibrary";

export async function localizedTitles(
  books: Book[],
  language: string,
  signal: AbortSignal,
) {
  const missing = books.filter(
    (b) =>
      /^\/works\/OL\d+W$/.test(b.id) &&
      !(language === "de" ? b.german?.title : b.englishTitle),
  );
  const updates = new Map<string, Partial<Book>>();
  for (let start = 0; start < missing.length; start += 40) {
    const batch = missing.slice(start, start + 40);
    const q = `(${batch.map((b) => `key:${b.id}`).join(" OR ")}) language:${language === "de" ? "ger" : "eng"}`;
    const params = new URLSearchParams({
      q,
      lang: language,
      limit: "40",
      fields: "key,editions,editions.key,editions.title,editions.language",
    });
    const response = await fetch(
      `https://openlibrary.org/search.json?${params}`,
      { signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]) },
    );
    if (!response.ok) throw Error("Titles unavailable");
    const result = await response.json();
    for (const doc of result.docs || [])
      updates.set(doc.key, germanFromSearch(doc));
  }
  return updates;
}
export function mergeTitleMetadata(book: Book, update: Partial<Book>): Book {
  return {
    ...book,
    ...update,
    ...(update.german
      ? {
          german: {
            ...update.german,
            description: book.german?.description || update.german.description,
          },
        }
      : {}),
  };
}
