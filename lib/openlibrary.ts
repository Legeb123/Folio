import type { Book } from "./data";
export type GermanSearchMetadata = {
  editions?: { docs?: { key?: string; title?: string; language?: string[] }[] };
};
export function germanFromSearch(doc: GermanSearchMetadata): Partial<Book> {
  const translated = doc.editions?.docs?.find(
    (e) => e.title && e.language?.some((l) => l === "ger" || l === "deu"),
  );
  const english = doc.editions?.docs?.find(
    (e) => e.title && e.language?.includes("eng"),
  );
  return {
    ...(english ? { englishTitle: english.title } : {}),
    ...(translated
      ? {
          german: { title: translated.title!, description: "" },
          ...(translated.key && /^\/books\/OL\d+M$/.test(translated.key)
            ? { germanMetadataKey: translated.key }
            : {}),
        }
      : {}),
  };
}
