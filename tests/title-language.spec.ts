import { test, expect } from "@playwright/test";
import { createSeed } from "../lib/data";
import { germanFromSearch } from "../lib/openlibrary";
import { bookTitle } from "../lib/i18n";
import { LIBRARY_RESET_KEY } from "../lib/library-reset";

test("only verified edition languages are displayed", () => {
  const book = {
    ...createSeed().books[0],
    id: "/works/OL166894W",
    title: "Преступление и наказание",
  };
  const metadata = germanFromSearch({
    editions: {
      docs: [
        { title: "Crime and Punishment", language: ["eng"] },
        { title: "Schuld und Sühne", language: ["ger"] },
      ],
    },
  });
  expect(bookTitle({ ...book, ...metadata }, "en")).toBe(
    "Crime and Punishment",
  );
  expect(bookTitle({ ...book, ...metadata }, "de")).toBe("Schuld und Sühne");
  expect(bookTitle(book, "en")).toBe("English title unavailable");
  expect(bookTitle(book, "de")).toBe("Deutscher Titel nicht verfügbar");
});
for (const language of ["en", "de"] as const) {
  test(`${language} library and search use translated titles`, async ({
    page,
  }) => {
    const book = {
      ...createSeed().books[0],
      id: "/works/OL166894W",
      title: "Преступление и наказание",
      author: "Fyodor Dostoevsky",
    };
    await page.addInitScript(
      ({ book, language, reset }) => {
        localStorage.setItem(reset, "done");
        localStorage.setItem(
          "folio-library-v1",
          JSON.stringify({ version: 1, books: [book], lists: [], goal: 24 }),
        );
        localStorage.setItem(
          "booktracker-preferences-v1",
          JSON.stringify({
            version: 1,
            completed: true,
            step: 3,
            language,
            genres: [],
            cover: "minimalist",
            favoriteBookIds: [book.id],
          }),
        );
      },
      { book, language, reset: LIBRARY_RESET_KEY },
    );
    const title =
      language === "de" ? "Schuld und Sühne" : "Crime and Punishment";
    const queries: string[] = [];
    await page.route("https://openlibrary.org/search.json?**", (r) => {
      queries.push(new URL(r.request().url()).searchParams.get("q")!);
      return r.fulfill({
        json: {
          docs: [
            {
              key: book.id,
              title: book.title,
              author_name: [book.author],
              editions: {
                docs: [
                  { title, language: [language === "de" ? "ger" : "eng"] },
                ],
              },
            },
          ],
        },
      });
    });
    await page.goto("/");
    await expect(page.locator(".hero-book")).toContainText(title);
    await expect
      .poll(() =>
        page.evaluate((lang) => {
          const b = JSON.parse(localStorage.getItem("folio-library-v1")!)
            .books[0];
          return lang === "de" ? b.german?.title : b.englishTitle;
        }, language),
      )
      .toBe(title);
    await page.locator('input[role="combobox"]').fill("Crime");
    await expect(page.locator("#search-results")).toContainText(title);
    expect(
      queries.every((q) =>
        q.includes(`language:${language === "de" ? "ger" : "eng"}`),
      ),
    ).toBe(true);
    await expect(page.locator("body")).not.toContainText(book.title);
  });
}
