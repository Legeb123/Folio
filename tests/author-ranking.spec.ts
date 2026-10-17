import { test, expect } from "@playwright/test";
import { rankAuthorWorks } from "../lib/author-ranking";
test("signature books precede popular adaptations and lesser works", () => {
  const books = [
    { key: "c", title: "1984 (adaptation)", readinglog_count: 9000 },
    { key: "b", title: "Animal Farm", readinglog_count: 1000 },
    { key: "a", title: "Nineteen Eighty-Four", readinglog_count: 800 },
    { key: "d", title: "Collected reviews", edition_count: 2000 },
  ];
  expect(rankAuthorWorks(books, "George Orwell").map((b) => b.key)).toEqual([
    "a",
    "b",
    "c",
    "d",
  ]);
  expect(books[0].key).toBe("c");
});
test("unlisted authors use popularity and influence signals with deterministic ties", () => {
  const books = [
    { key: "z", title: "Zulu" },
    { key: "a", title: "Alpha" },
    { key: "b", title: "Readers favorite", readinglog_count: 100 },
    { key: "c", title: "Frequently taught", osp_count: 500 },
  ];
  const order = rankAuthorWorks(books, "Unlisted Writer").map((b) => b.key);
  expect(order.slice(0, 2)).toEqual(["b", "c"]);
  expect(order.slice(2)).toEqual(["a", "z"]);
  expect(
    rankAuthorWorks([...books].reverse(), "Unlisted Writer").map((b) => b.key),
  ).toEqual(order);
});
test("rank before slicing keeps later pages from reordering the bibliography", () => {
  const books = Array.from({ length: 60 }, (_, i) => ({
    key: String(i),
    title: `Book ${i}`,
    readinglog_count: i,
  }));
  const ranked = rankAuthorWorks(books, "Unlisted Writer");
  expect(
    new Set([...ranked.slice(0, 24), ...ranked.slice(24, 48)].map((b) => b.key))
      .size,
  ).toBe(48);
  expect(ranked[0].readinglog_count).toBe(59);
  expect(ranked[24].readinglog_count).toBe(35);
});
test("duplicate signature-title records do not crowd out other major works", () => {
  const ranked = rankAuthorWorks(
    [
      { key: "1", title: "Pride and Prejudice", readinglog_count: 200 },
      { key: "2", title: "Pride and Prejudice", readinglog_count: 2 },
      { key: "3", title: "Sense and Sensibility", readinglog_count: 50 },
    ],
    "Jane Austen",
  );
  expect(ranked.map((b) => b.title)).toEqual([
    "Pride and Prejudice",
    "Sense and Sensibility",
  ]);
  expect(ranked[0].key).toBe("1");
});
