import type { BookLocation, Publication } from "./geography";
import {
  validExtras,
  type Dimension,
  type Quote,
  type Background,
} from "./reading";
export type Status = "Read" | "Currently Reading" | "Want to Read";
export type Book = {
  id: string;
  title: string;
  author: string;
  year: number;
  cover: string;
  pages: number;
  status: Status;
  rating: number;
  date: string;
  tags: string[];
  review: string;
  spoiler: boolean;
  description: string;
  progress: number;
  location?: BookLocation | null;
  publication?: Publication | null;
  startDate?: string;
  criteriaInitialized?: boolean;
  goalDays?: number;
  germanMetadataKey?: string;
  scores?: Partial<Record<Dimension, number>>;
  thoughts?: string;
  takeaways?: string;
  quotes?: Quote[];
  contextNotes?: string;
  background?: Background;
  german?: { title: string; description: string };
};
export type ReadingList = {
  id: string;
  title: string;
  description: string;
  books: string[];
  tiers: Record<string, string>;
};
export type LibraryData = {
  version: 1;
  books: Book[];
  lists: ReadingList[];
  goal: number;
};
const seedRows: [string, string, number, string, number, string, number][] = [
  [
    "The Creative Act",
    "Rick Rubin",
    2023,
    "9780593652886",
    432,
    "Creativity",
    4.5,
  ],
  [
    "The Secret History",
    "Donna Tartt",
    1992,
    "9781400031702",
    559,
    "Fiction",
    5,
  ],
  [
    "The Psychology of Money",
    "Morgan Housel",
    2020,
    "9780857197689",
    256,
    "Psychology",
    4,
  ],
  [
    "Meditations",
    "Marcus Aurelius",
    180,
    "9780812968255",
    256,
    "Philosophy",
    5,
  ],
  [
    "Norwegian Wood",
    "Haruki Murakami",
    1987,
    "9780375704024",
    296,
    "Fiction",
    4,
  ],
  ["Sapiens", "Yuval Noah Harari", 2011, "9780062316097", 464, "History", 4.5],
  [
    "The Midnight Library",
    "Matt Haig",
    2020,
    "9780525559474",
    304,
    "Fiction",
    3.5,
  ],
  [
    "Atomic Habits",
    "James Clear",
    2018,
    "9780735211292",
    320,
    "Personal Growth",
    4.5,
  ],
  ["Dune", "Frank Herbert", 1965, "9780441172719", 688, "Science Fiction", 5],
  [
    "A Little Life",
    "Hanya Yanagihara",
    2015,
    "9780804172707",
    832,
    "Fiction",
    4.5,
  ],
  ["The Stranger", "Albert Camus", 1942, "9780679720201", 123, "Philosophy", 4],
  ["Normal People", "Sally Rooney", 2018, "9781984822178", 273, "Fiction", 4],
  ["The Alchemist", "Paulo Coelho", 1988, "9780061122415", 208, "Fiction", 0],
  [
    "Man’s Search for Meaning",
    "Viktor E. Frankl",
    1946,
    "9780807014295",
    165,
    "Psychology",
    0,
  ],
  [
    "The Metamorphosis",
    "Franz Kafka",
    1915,
    "9780553213690",
    201,
    "Fiction",
    0,
  ],
  ["Educated", "Tara Westover", 2018, "9780399590504", 334, "Memoir", 0],
];
const descriptions = [
  "A thoughtful invitation to see creativity as a way of being. Rick Rubin explores attention, openness, and the everyday practice of making something meaningful.",
  "At a secluded New England college, a close-knit group of classics students slips beyond the boundaries of ordinary morality. An atmospheric story of beauty, obsession, and consequence.",
  "Timeless lessons on wealth, greed, and happiness. Morgan Housel examines how our behavior and personal experiences shape the decisions we make about money.",
  "Private reflections of a Roman emperor, exploring how to live with purpose, meet adversity, and find clarity in the things within our control.",
  "A tender story of memory, love, and loss in 1960s Tokyo. Toru Watanabe looks back on the people and choices that shaped his youth.",
  "An expansive journey through human history, from early hunter-gatherers to the ideas and systems that bind the modern world together.",
  "Between life and death lies a library of possible lives. Nora Seed explores roads not taken and what it means to live a life worth choosing.",
  "A practical exploration of the small behaviors that compound over time, with a focus on building systems and shaping your environment.",
  "On the desert planet Arrakis, Paul Atreides is drawn into a struggle over ecology, power, prophecy, and the most valuable substance in the universe.",
  "Four friends build lives in New York, held together by ambition, devotion, and the lasting weight of the past.",
  "An unsettling exploration of alienation and the absurd, following Meursault as he confronts the expectations of society.",
  "Connell and Marianne navigate intimacy, class, and the shifting distance between two people as they move from a small town to university.",
];
export function createSeed(): LibraryData {
  const now = new Date();
  const books: Book[] = seedRows.map((r, i) => {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - Math.floor(i / 2),
      Math.max(1, now.getDate() - (i % 2)),
    );
    return {
      id: `sample-${i}`,
      title: r[0],
      author: r[1],
      year: r[2],
      cover: `/covers/${r[3]}.jpg`,
      pages: r[4],
      tags: [r[5]],
      rating: r[6],
      status:
        i === 0 || i === 8
          ? "Currently Reading"
          : i >= 12
            ? "Want to Read"
            : "Read",
      date:
        i === 0 || i === 8 || i >= 12 ? "" : date.toLocaleDateString("en-CA"),
      review:
        i === 1
          ? "Some books you read. Others you live inside. This is the latter. Beautiful, unsettling, and impossible to put down."
          : i === 3
            ? "A book to return to, again and again. The reminder to focus on what is within our control stays with me."
            : "",
      spoiler: false,
      description:
        descriptions[i] ||
        "A new perspective waiting on your next shelf. Open this book and make it part of your reading story.",
      progress: i === 0 ? 142 : i === 8 ? 216 : 0,
    };
  });
  return {
    version: 1,
    books,
    goal: 24,
    lists: [
      {
        id: "essentials",
        title: "Books that changed my perspective",
        description: "The ones that stayed with me long after the last page.",
        books: ["sample-3", "sample-5", "sample-2", "sample-7"],
        tiers: {
          "sample-3": "S",
          "sample-5": "A",
          "sample-2": "A",
          "sample-7": "B",
        },
      },
      {
        id: "slow-sunday",
        title: "For a slow Sunday",
        description: "A quiet afternoon, a cup of coffee, and nowhere to be.",
        books: ["sample-4", "sample-11", "sample-6"],
        tiers: {},
      },
    ],
  };
}
export function validData(value: unknown): value is LibraryData {
  if (!value || typeof value !== "object") return false;
  const d = value as LibraryData;
  return (
    d.version === 1 &&
    Number.isFinite(d.goal) &&
    d.goal > 0 &&
    Array.isArray(d.books) &&
    d.books.every(
      (b) =>
        b &&
        validExtras(b) &&
        typeof b.id === "string" &&
        typeof b.title === "string" &&
        typeof b.author === "string" &&
        typeof b.cover === "string" &&
        typeof b.date === "string" &&
        typeof b.review === "string" &&
        typeof b.description === "string" &&
        typeof b.spoiler === "boolean" &&
        Number.isFinite(b.year) &&
        Number.isFinite(b.pages) &&
        Number.isFinite(b.progress) &&
        Number.isFinite(b.rating) &&
        b.rating >= 0 &&
        b.rating <= 5 &&
        Array.isArray(b.tags) &&
        b.tags.every((t) => typeof t === "string") &&
        ["Read", "Currently Reading", "Want to Read"].includes(b.status),
    ) &&
    Array.isArray(d.lists) &&
    d.lists.every(
      (l) =>
        l &&
        typeof l.id === "string" &&
        typeof l.title === "string" &&
        typeof l.description === "string" &&
        Array.isArray(l.books) &&
        l.books.every((id) => typeof id === "string") &&
        l.tiers &&
        typeof l.tiers === "object",
    )
  );
}
export function readingStats(books: Book[]) {
  const read = books.filter((b) => b.status === "Read");
  const rated = read.filter((b) => b.rating > 0);
  return {
    read,
    pages: read.reduce((n, b) => n + b.pages, 0),
    average: rated.length
      ? rated.reduce((n, b) => n + b.rating, 0) / rated.length
      : 0,
  };
}
