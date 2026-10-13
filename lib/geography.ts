import type { Book } from "./data";
import countries from "./world-countries.json";
export { countries };
// Retained only so older saved libraries remain readable.
export type BookLocation = { country: string; basis: "setting" | "author" };
export type Publication = {
  country: string;
  kind: "first" | "catalog" | "manual";
  source?: string;
};
const rows: [string, string, string, string][] = [
  [
    "The Creative Act",
    "Rick Rubin",
    "USA",
    "https://www.penguinrandomhouse.com/books/717356/the-creative-act-by-rick-rubin/",
  ],
  [
    "The Secret History",
    "Donna Tartt",
    "USA",
    "https://www.penguinrandomhouse.com/books/176619/the-secret-history-by-donna-tartt/",
  ],
  [
    "The Psychology of Money",
    "Morgan Housel",
    "GBR",
    "https://cir.nii.ac.jp/crid/1971712334813449877",
  ],
  [
    "Meditations",
    "Marcus Aurelius",
    "CHE",
    "https://en.wikisource.org/wiki/The_Meditations_of_the_Emperor_Marcus_Antoninus/Introduction",
  ],
  [
    "Norwegian Wood",
    "Haruki Murakami",
    "JPN",
    "https://en.wikipedia.org/wiki/Norwegian_Wood_(novel)",
  ],
  [
    "Sapiens",
    "Yuval Noah Harari",
    "ISR",
    "https://en.wikipedia.org/wiki/Sapiens:_A_Brief_History_of_Humankind",
  ],
  [
    "The Midnight Library",
    "Matt Haig",
    "GBR",
    "https://ci.nii.ac.jp/ncid/BC05931667",
  ],
  [
    "Atomic Habits",
    "James Clear",
    "USA",
    "https://www.penguinrandomhouse.com/books/543993/atomic-habits-by-james-clear/",
  ],
  [
    "Dune",
    "Frank Herbert",
    "USA",
    "https://en.wikipedia.org/wiki/Dune_(novel)",
  ],
  [
    "A Little Life",
    "Hanya Yanagihara",
    "USA",
    "https://www.penguinrandomhouse.com/books/246605/a-little-life-by-hanya-yanagihara/",
  ],
  [
    "The Stranger",
    "Albert Camus",
    "FRA",
    "https://en.wikipedia.org/wiki/The_Stranger_(Camus_novel)",
  ],
  [
    "Normal People",
    "Sally Rooney",
    "GBR",
    "https://www.faber.co.uk/product/9780571334650-normal-people/",
  ],
  [
    "The Alchemist",
    "Paulo Coelho",
    "BRA",
    "https://en.wikipedia.org/wiki/The_Alchemist_(novel)",
  ],
  [
    "Man’s Search for Meaning",
    "Viktor E. Frankl",
    "AUT",
    "https://en.wikipedia.org/wiki/Man%27s_Search_for_Meaning",
  ],
  [
    "The Metamorphosis",
    "Franz Kafka",
    "DEU",
    "https://en.wikipedia.org/wiki/The_Metamorphosis",
  ],
  [
    "Educated",
    "Tara Westover",
    "USA",
    "https://www.penguinrandomhouse.com/books/550168/educated-by-tara-westover/",
  ],
];
export function validPublication(value: unknown): value is Publication {
  const p = value as Publication;
  return (
    !!p &&
    typeof p === "object" &&
    countries.some((c) => c.id === p.country) &&
    ["first", "catalog", "manual"].includes(p.kind) &&
    (p.source === undefined ||
      (typeof p.source === "string" && p.source.startsWith("https://")))
  );
}
export function locationFor(book: Book): Publication | undefined {
  if (book.publication === null) return undefined;
  if (book.publication) return book.publication;
  const row = rows.find(
    ([title, author]) => title === book.title && author === book.author,
  );
  return row ? { country: row[2], kind: "first", source: row[3] } : undefined;
}
export function countryName(id: string, language: string) {
  const c = countries.find((c) => c.id === id);
  return c ? (language === "de" ? c.de : c.name) : id;
}
export function publicationLabel(p: Publication, language: string) {
  return language === "de"
    ? {
        first: "Erstveröffentlichung",
        catalog: "Veröffentlichung laut Katalog",
        manual: "Veröffentlichungsland",
      }[p.kind]
    : {
        first: "First publication",
        catalog: "Catalog publication",
        manual: "Publication country",
      }[p.kind];
}
export function project(lon: number, lat: number) {
  return { x: ((lon + 180) / 360) * 1000, y: ((90 - lat) / 180) * 500 };
}
export function mappedBooks(books: Book[]) {
  return books.flatMap((book) => {
    const location = locationFor(book);
    const country = countries.find((c) => c.id === location?.country);
    return location && country
      ? [{ book, location, country, ...project(country.lon, country.lat) }]
      : [];
  });
}
