type SearchIdentity = {
  id?: string;
  title?: string;
  author?: string;
  englishTitle?: string;
  german?: { title?: string };
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
function normalize(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/[^\p{L}\p{N}]/gu, "");
}
export function searchIdentity(
  item: SearchIdentity,
  language = "en",
  index = 0,
): string {
  const title =
    text(language === "de" ? item.german?.title : item.englishTitle) ||
    text(item.title);
  const rawAuthor = text(item.author);
  const parts = rawAuthor.split(",").map((part) => part.trim());
  const author = normalize(
    parts.length === 2 ? `${parts[1]} ${parts[0]}` : rawAuthor,
  );
  // Never use a shared translated "title unavailable" UI label as an identity.
  if (!title) return JSON.stringify(["id", text(item.id) || index]);
  const normalizedTitle = normalize(title) || title.toLowerCase();
  return JSON.stringify([
    "title",
    normalizedTitle,
    author === "unknownauthor" ? "" : author,
  ]);
}

export function deduplicateSearchResults<T extends SearchIdentity>(
  items: T[],
  language = "en",
): T[] {
  if (!items.length) return items;
  try {
    const seen = new Set<string>();
    const grouped = items.filter((item, index) => {
      const key = searchIdentity(item, language, index);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    // Keep the original primary object intact, including metadata not known here.
    return grouped.length ? grouped : items;
  } catch {
    // Unexpected catalog data must never hide a nonempty API response.
    return items;
  }
}
