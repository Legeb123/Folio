import { countries, validPublication } from "./geography";
import type { Book, Status } from "./data";
export const dimensions = [
  ["prose", "Writing Style / Prose", "Schreibstil"],
  ["plot", "Plot / Pacing", "Handlung & Tempo"],
  ["characters", "Character Development", "Charaktere"],
  ["world", "Worldbuilding", "Weltgestaltung"],
  ["impact", "Emotional Impact", "Emotionale Wirkung"],
  ["message", "Message", "Botschaft"],
] as const;
export type Dimension = (typeof dimensions)[number][0];
export type Quote = { id: string; text: string; page: string };
export type Background = {
  version?: 2;
  message?: string;
  language: "en" | "de";
  title: string;
  summary: string;
  url: string;
  authorSummary?: string;
  authorUrl?: string;
  fetchedAt: string;
};
export function overall(
  scores: Partial<Record<Dimension, number>> | undefined,
  fallback = 0,
) {
  const values = Object.values(scores || {}).filter(
    (n): n is number => typeof n === "number" && n > 0,
  );
  return values.length
    ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) /
        100
    : fallback;
}
export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function duration(start: string, end: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end))
    return null;
  const n =
    (Date.parse(end + "T00:00:00Z") - Date.parse(start + "T00:00:00Z")) /
    86400000;
  return Number.isFinite(n) && n >= 0 ? n + 1 : null;
}
export function switchStatus(book: Book, status: Status): Book {
  return {
    ...book,
    status,
    startDate:
      status === "Currently Reading" && !book.startDate
        ? today()
        : book.startDate,
    date: status === "Read" ? book.date || today() : "",
  };
}
export function validExtras(b: Book) {
  return (
    (b.publication === undefined ||
      b.publication === null ||
      validPublication(b.publication)) &&
    (b.location === undefined ||
      b.location === null ||
      (typeof b.location === "object" &&
        countries.some((c) => c.id === b.location?.country) &&
        ["setting", "author"].includes(b.location.basis))) &&
    (b.coverStyle === undefined ||
      ["modern", "minimalist", "leather"].includes(b.coverStyle)) &&
    (b.englishTitle === undefined || typeof b.englishTitle === "string") &&
    (b.germanMetadataKey === undefined ||
      (typeof b.germanMetadataKey === "string" &&
        /^\/books\/OL\d+M$/.test(b.germanMetadataKey))) &&
    (b.criteriaInitialized === undefined ||
      typeof b.criteriaInitialized === "boolean") &&
    (b.goalDays === undefined ||
      (Number.isInteger(b.goalDays) &&
        b.goalDays >= 1 &&
        b.goalDays <= 3650)) &&
    (b.startDate === undefined || typeof b.startDate === "string") &&
    (b.thoughts === undefined || typeof b.thoughts === "string") &&
    (b.takeaways === undefined || typeof b.takeaways === "string") &&
    (b.contextNotes === undefined || typeof b.contextNotes === "string") &&
    (b.scores === undefined ||
      (!!b.scores &&
        typeof b.scores === "object" &&
        Object.entries(b.scores).every(
          ([k, v]) =>
            dimensions.some((d) => d[0] === k) &&
            typeof v === "number" &&
            v >= 0 &&
            v <= 5,
        ))) &&
    (b.quotes === undefined ||
      (Array.isArray(b.quotes) &&
        b.quotes.every(
          (q) =>
            q &&
            typeof q.id === "string" &&
            typeof q.text === "string" &&
            typeof q.page === "string",
        ))) &&
    (b.german === undefined ||
      (!!b.german &&
        typeof b.german.title === "string" &&
        typeof b.german.description === "string")) &&
    (b.background === undefined ||
      (!!b.background &&
        (b.background.version === undefined || b.background.version === 2) &&
        (b.background.message === undefined ||
          typeof b.background.message === "string") &&
        ["en", "de"].includes(b.background.language) &&
        typeof b.background.summary === "string" &&
        typeof b.background.title === "string" &&
        typeof b.background.url === "string" &&
        b.background.url.startsWith("https://") &&
        typeof b.background.fetchedAt === "string" &&
        (b.background.authorSummary === undefined ||
          typeof b.background.authorSummary === "string") &&
        (b.background.authorUrl === undefined ||
          b.background.authorUrl.startsWith("https://"))))
  );
}
