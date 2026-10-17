import { test, expect } from "@playwright/test";
import {
  authorRecommendations,
  rotateAuthors,
  literaryAuthors,
} from "../lib/author-discovery";
import { createSeed } from "../lib/data";
import { authorKey } from "../lib/authors";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "booktracker-preferences-v1",
      JSON.stringify({
        version: 1,
        completed: true,
        step: 3,
        language: "en",
        genres: ["Sci-Fi"],
        cover: "modern",
      }),
    ),
  );
  await page.route("**/api/authors?**", (r) => {
    const u = new URL(r.request().url());
    return r.fulfill({
      json: {
        authors: u.searchParams.getAll("name").map((name) => ({
          name,
          biography: "A documented life.",
          source: "https://en.wikipedia.org/wiki/" + encodeURIComponent(name),
        })),
      },
    });
  });
  await page.route("**/api/author-catalog?**", (r) => {
    const u = new URL(r.request().url());
    const q = u.searchParams.get("q");
    return r.fulfill({
      json: {
        total: 1,
        authors: [
          {
            name: q === "orwell" ? "George Orwell" : "Octavia E. Butler",
            id: q === "orwell" ? "OL118077A" : "OL30802A",
            birth: "1947",
            topWork: "Kindred",
          },
        ],
      },
    });
  });
  await page.route("**/api/author-profile?**", (r) => {
    const u = new URL(r.request().url());
    return r.fulfill({
      json: {
        id: "OL30802A",
        name: u.searchParams.get("name"),
        birth: "1947",
        biography: "A documented catalog biography.",
        source: "https://openlibrary.org/authors/OL30802A",
        total: 25,
        books:
          u.searchParams.get("page") === "2"
            ? [
                {
                  ...createSeed().books[0],
                  id: "/works/OL2W",
                  title: "Second page work",
                },
              ]
            : [
                {
                  ...createSeed().books[0],
                  id: "/works/OL1W",
                  title: "Kindred",
                  author: "Octavia E. Butler",
                  status: "Want to Read",
                  rating: 0,
                },
              ],
      },
    });
  });
});
const enter = async (page: import("@playwright/test").Page) => {
  await page.goto("/");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Authors", exact: true })
    .click();
};
test("eight independent authors rotate on reentry; completed authors and thematic suggestions appear", async ({
  page,
}) => {
  await enter(page);
  await expect(page.locator(".author-spotlight .author-card")).toHaveCount(8);
  const first = await page.locator(".author-spotlight h2").allTextContents();
  await expect(page.locator(".author-personal")).toContainText("Sally Rooney");
  await expect(page.locator(".author-personal")).not.toContainText(
    "Paulo Coelho",
  );
  await expect(page.locator(".author-similar .author-card")).not.toHaveCount(0);
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Home", exact: true })
    .click();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Authors", exact: true })
    .click();
  await expect(page.locator(".author-spotlight .author-card")).toHaveCount(8);
  const second = await page
    .locator(".author-spotlight .author-card h2")
    .allTextContents();
  expect(second.every((n) => !first.includes(n))).toBe(true);
});
test("global search opens popup with catalog books, life details, pagination and book logging", async ({
  page,
}) => {
  await enter(page);
  await page
    .getByRole("textbox", { name: "Search all authors" })
    .fill("octavia");
  await page.locator(".author-search-results .author-card").click();
  const dialog = page.getByRole("dialog", { name: "Octavia E. Butler" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("A documented life.");
  await expect(dialog.locator(".author-works-grid")).toContainText("Kindred");
  await dialog.getByRole("button", { name: "More works", exact: true }).click();
  await expect(dialog.locator(".author-works-grid")).toContainText(
    "Second page work",
  );
  await dialog.locator(".author-works-grid .book-card").first().click();
  await expect(
    page.getByRole("dialog", { name: "Octavia E. Butler" }),
  ).toHaveCount(0);
  await expect(page.getByRole("dialog")).toContainText("Kindred");
  await page
    .getByRole("button", { name: "Save to library", exact: true })
    .click();
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("folio-library-v1")!).books.some(
        (b: { title: string }) => b.title === "Kindred",
      ),
    ),
  ).toBe(true);
});
test("sourced influences and explicit search failure recovery", async ({
  page,
}) => {
  await enter(page);
  await page
    .getByRole("textbox", { name: "Search all authors" })
    .fill("orwell");
  await page.locator(".author-search-results .author-card").click();
  await expect(page.locator(".author-influence")).toHaveCount(2);
  await expect(page.locator(".author-influence a").first()).toHaveAttribute(
    "href",
    /orwellfoundation/,
  );
  await page.keyboard.press("Escape");
  await page.route("**/api/author-catalog?**", (r) =>
    r.fulfill({ status: 502, json: { error: "unavailable" } }),
  );
  await page
    .getByRole("textbox", { name: "Search all authors" })
    .fill("missing");
  await expect(
    page.getByRole("button", { name: "Retry search" }),
  ).toBeVisible();
});
test("mobile profile stays inside viewport and closes with Escape", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enter(page);
  await page.locator(".author-spotlight .author-card").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(
    await page
      .getByRole("dialog")
      .evaluate((e) => e.scrollWidth <= e.clientWidth),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("rotation and recommendations depend on completed books and preferences, never wishlist authors", () => {
  const first = rotateAuthors();
  const second = rotateAuthors(first.map((a) => a.name));
  expect(new Set(first.map((a) => a.name)).size).toBe(8);
  expect(second.every((a) => !first.some((f) => f.name === a.name))).toBe(true);
  expect(literaryAuthors.length).toBeGreaterThan(16);
  const seed = createSeed();
  const rec = authorRecommendations(seed.books, []);
  expect(rec.familiar.some((a) => a.name === "Paulo Coelho")).toBe(false);
  expect(authorRecommendations([], ["Sci-Fi"]).similar.length).toBeGreaterThan(
    0,
  );
  expect(authorRecommendations([], [])).toEqual({ familiar: [], similar: [] });
  expect(authorKey("村上春樹")).not.toBe(authorKey("夏目漱石"));
});
test("a changed search cannot show results from an older request", async ({
  page,
}) => {
  await page.route("**/api/author-catalog?**", async (r) => {
    const q = new URL(r.request().url()).searchParams.get("q");
    if (q === "older") await new Promise((resolve) => setTimeout(resolve, 700));
    await r
      .fulfill({
        json: {
          total: 1,
          authors: [
            {
              id: q === "older" ? "OL1A" : "OL2A",
              name: q === "older" ? "Old result" : "New result",
            },
          ],
        },
      })
      .catch(() => {});
  });
  await enter(page);
  const input = page.getByRole("textbox", { name: "Search all authors" });
  await input.fill("older");
  await page.waitForRequest((r) => r.url().includes("q=older"));
  await input.fill("newer");
  await expect(page.locator(".author-search-results")).toContainText(
    "New result",
  );
  await page.waitForTimeout(800);
  await expect(page.locator(".author-search-results")).not.toContainText(
    "Old result",
  );
});
test("German overview and profile failure remain usable", async ({ page }) => {
  await page.addInitScript(() => {
    const p = JSON.parse(localStorage.getItem("booktracker-preferences-v1")!);
    p.language = "de";
    localStorage.setItem("booktracker-preferences-v1", JSON.stringify(p));
  });
  await page.route("**/api/author-profile?**", (r) =>
    r.fulfill({ status: 502, json: { error: "offline" } }),
  );
  await page.goto("/");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Autor:innen", exact: true })
    .click();
  await expect(page.locator(".author-spotlight .author-card")).toHaveCount(8);
  await page.locator(".author-spotlight .author-card").first().click();
  await expect(
    page.getByRole("button", { name: "Profil erneut laden" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Einflüsse & Lieblingsbücher" }),
  ).toBeVisible();
});
