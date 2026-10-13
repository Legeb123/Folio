import { test, expect, type Page } from "@playwright/test";
import { countryFromPublication } from "../lib/publication-catalog";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem("booktracker-preferences-v1"))
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
      );
  });
});
const library = async (page: Page) =>
  page
    .getByRole("navigation")
    .getByRole("button", { name: "My Library", exact: true })
    .click();
const openMap = async (page: Page) =>
  page.getByRole("button", { name: "Open BookMap", exact: true }).click();
test("compact transparent map icon exists only in My Library and every sample book has a publication pin", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.locator(".bookmap-icon,.shelf-switcher,.view-switch"),
  ).toHaveCount(0);
  await library(page);
  const icon = page.getByRole("button", { name: "Open BookMap", exact: true });
  await expect(icon).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  expect((await icon.boundingBox())!.width).toBeLessThanOrEqual(72);
  await page.screenshot({
    path: "folio-compact-map-icon.jpg",
    type: "jpeg",
    quality: 75,
  });
  await openMap(page);
  await expect(page.locator(".bookmap-book")).toHaveCount(16);
  await expect(page.locator(".bookmap-unmapped")).toHaveCount(0);
  await expect(
    page.locator(".bookmap-book").filter({ hasText: "Meditations" }),
  ).toContainText("Switzerland");
  await expect(
    page.locator(".bookmap-book").filter({ hasText: "Normal People" }),
  ).toContainText("United Kingdom");
  await page
    .getByRole("button", {
      name: "Norwegian Wood · Japan · First publication",
      exact: true,
    })
    .click();
  await expect(page.getByLabel("Publication country / region")).toHaveValue(
    "JPN",
  );
  await expect(page.getByLabel("Location represents")).toHaveCount(0);
});
test("map includes the entire collection regardless of shelf filters, with status and navigation controls", async ({
  page,
}) => {
  await page.goto("/");
  await library(page);
  await page.getByLabel("Filter by genre or tag").selectOption("Psychology");
  await openMap(page);
  await expect(page.locator(".bookmap-book")).toHaveCount(16);
  const filters = page.getByRole("group", { name: "Map reading status" });
  for (const [status, count] of [
    ["Completed", 10],
    ["Want to Read", 4],
    ["Currently Reading", 2],
  ] as const) {
    await filters.getByRole("button", { name: status, exact: true }).click();
    await expect(page.locator(".bookmap-book")).toHaveCount(count);
  }
  await filters.getByRole("button", { name: "All books", exact: true }).click();
  await page.locator(".marker-cluster").first().click();
  await expect(
    page.getByRole("heading", { name: "Books at this marker" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Show all mapped books" }).click();
  const svg = page.locator(".bookmap-canvas");
  const initial = await svg.getAttribute("viewBox");
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect(svg).not.toHaveAttribute("viewBox", initial!);
  const zoomed = await svg.getAttribute("viewBox");
  await svg.focus();
  await page.keyboard.press("ArrowRight");
  await expect(svg).not.toHaveAttribute("viewBox", zoomed!);
  await page.getByRole("button", { name: "Reset map", exact: true }).click();
  await expect(svg).toHaveAttribute("viewBox", initial!);
});
test("old origin data is never reused as publication data and manual corrections persist", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".book-card").first()).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => !!localStorage.getItem("folio-library-v1")))
    .toBe(true);
  await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem("folio-library-v1")!);
    data.books[0].location = { country: "BRA", basis: "author" };
    localStorage.setItem("folio-library-v1", JSON.stringify(data));
  });
  await page.reload();
  await library(page);
  await openMap(page);
  const entry = page
    .locator(".bookmap-book")
    .filter({ hasText: "The Creative Act" });
  await expect(entry).toContainText("United States");
  await entry.click();
  await page.getByLabel("Publication country / region").selectOption("GBR");
  await page.getByRole("button", { name: "Save to library" }).click();
  await page.reload();
  await library(page);
  await openMap(page);
  await expect(entry).toContainText("United Kingdom");
  await expect(entry).toContainText("Publication country");
});
test("added books are resolved from catalog metadata and unresolved books remain visible", async ({
  page,
}) => {
  await page.route("**/api/publication?**", (route) =>
    new URL(route.request().url()).searchParams.get("work") ===
    "/works/OL99991W"
      ? route.fulfill({
          json: {
            country: "CAN",
            kind: "catalog",
            source: "https://openlibrary.org/books/OL123M",
          },
        })
      : route.fulfill({ status: 404, json: { error: "Unavailable" } }),
  );
  await page.goto("/");
  await expect(page.locator(".book-card").first()).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => !!localStorage.getItem("folio-library-v1")))
    .toBe(true);
  await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem("folio-library-v1")!);
    data.books.push(
      {
        ...data.books[0],
        id: "/works/OL99991W",
        title: "New catalog book",
        author: "New Author",
        status: "Read",
      },
      {
        ...data.books[0],
        id: "/works/OL99992W",
        title: "Missing publication",
        author: "Unknown Author",
        status: "Want to Read",
      },
    );
    localStorage.setItem("folio-library-v1", JSON.stringify(data));
  });
  await page.reload();
  await library(page);
  await openMap(page);
  await expect(
    page.locator(".bookmap-book").filter({ hasText: "New catalog book" }),
  ).toContainText("Canada");
  await expect(page.locator(".bookmap-unmapped")).toContainText(
    "Missing publication",
  );
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("folio-library-v1")!).books.find(
            (b: { id: string }) => b.id === "/works/OL99991W",
          ).publication?.country,
      ),
    )
    .toBe("CAN");
});
test("German mobile publication map stays compact and accessible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: /Deutsch/ }).click();
  await page.getByRole("button", { name: "Fertig", exact: true }).click();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Bibliothek", exact: true })
    .click();
  await page.screenshot({
    path: "folio-compact-map-mobile.jpg",
    type: "jpeg",
    quality: 75,
  });
  await page.getByRole("button", { name: "BookMap öffnen" }).click();
  await expect(
    page.getByRole("group", { name: "Lesestatus auf der Karte" }),
  ).toBeVisible();
  await expect(page.locator(".bookmap-book")).toHaveCount(16);
  expect(
    (await page.locator(".marker-hit").first().boundingBox())!.width,
  ).toBeGreaterThanOrEqual(43);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("publication parser uses publisher locations and never setting, language or ambiguous city guesses", () => {
  expect(countryFromPublication({ publish_country: "nyu" })).toBe("USA");
  expect(countryFromPublication({ publish_places: ["London"] })).toBe("GBR");
  expect(countryFromPublication({ publish_places: ["Leipzig"] })).toBe("DEU");
  expect(
    countryFromPublication({ publish_places: ["Cambridge"] }),
  ).toBeUndefined();
  expect(
    countryFromPublication({ publish_places: ["Unknown"] }),
  ).toBeUndefined();
});
