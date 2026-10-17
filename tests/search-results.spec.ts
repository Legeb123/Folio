import { test, expect } from "@playwright/test";
import { deduplicateSearchResults } from "../lib/search-results";

test("soft grouping normalizes names and preserves the complete primary object", () => {
  const primary = {
    id: "a",
    title: "  Meditations! ",
    author: "Marcus Aurelius",
    cover: "cover.jpg",
    year: 180,
    description: "Description",
    rating: 4.5,
    background: { message: "Context" },
  };
  const grouped = deduplicateSearchResults([
    primary,
    { ...primary, id: "b", title: "meditations", author: "Aurelius, Marcus" },
    { ...primary, id: "c", author: "Another author" },
  ]);
  expect(grouped).toHaveLength(2);
  expect(grouped[0]).toBe(primary);
  expect(grouped[0]).toEqual(primary);
  expect(
    deduplicateSearchResults([
      { title: "The Hobbit", author: "J.R.R. Tolkien" },
      { title: "The Hobbit", author: "J. R. R. Tolkien" },
    ]),
  ).toHaveLength(1);
});

test("missing fields and punctuation-only titles never empty a nonempty result", () => {
  const items = [
    { id: "a", title: "Meditations" },
    { id: "b", title: "meditations!" },
    { id: "c", author: "Someone" },
    { id: "d" },
    { id: "e", title: "!!!" },
    { id: "f", title: "???" },
  ];
  expect(deduplicateSearchResults(items).map((i) => i.id)).toEqual([
    "a",
    "c",
    "d",
    "e",
    "f",
  ]);
  expect(deduplicateSearchResults([{}, {}])).toHaveLength(2);
  expect(
    deduplicateSearchResults([{ id: "x", title: "", author: "" }]),
  ).toHaveLength(1);
  const malformed = [null] as unknown as { id: string }[];
  expect(deduplicateSearchResults(malformed)).toBe(malformed);
  expect(deduplicateSearchResults([])).toEqual([]);
});

test("localized titles group without merging unrelated unavailable translations", () => {
  expect(
    deduplicateSearchResults(
      [
        {
          id: "a",
          title: "Original A",
          german: { title: "Selbstbetrachtungen" },
        },
        {
          id: "b",
          title: "Original B",
          german: { title: "Selbstbetrachtungen!" },
        },
      ],
      "de",
    ),
  ).toHaveLength(1);
  expect(
    deduplicateSearchResults(
      [
        { id: "a", title: "Original A" },
        { id: "b", title: "Original B" },
      ],
      "de",
    ),
  ).toHaveLength(2);
});

test("search shows one entry per pair and retains results missing titles or authors", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "booktracker-preferences-v1",
      JSON.stringify({
        version: 1,
        completed: true,
        step: 3,
        language: "en",
        genres: [],
        cover: "modern",
      }),
    ),
  );
  await page.route("https://openlibrary.org/search.json?**", (r) =>
    r.fulfill({
      json: {
        docs: [
          {
            key: "/works/OL1W",
            title: "Meditations",
            author_name: ["Marcus Aurelius"],
            editions: { docs: [{ title: "Meditations", language: ["eng"] }] },
          },
          {
            key: "/works/OL2W",
            title: "Meditations!",
            author_name: ["Aurelius, Marcus"],
            editions: { docs: [{ title: "Meditations!", language: ["eng"] }] },
          },
          { key: "/works/OL3W", title: "No author" },
          { key: "/works/OL4W", author_name: ["No title"] },
          { key: "/works/OL5W" },
        ],
      },
    }),
  );
  await page.goto("/");
  await page
    .getByRole("combobox", { name: "Search books and authors" })
    .fill("Meditations");
  const results = page.locator("#search-results");
  await expect(results.getByRole("option")).toHaveCount(4);
  await expect(results).toContainText("Marcus Aurelius");
  await expect(results).toContainText("No title");
});
