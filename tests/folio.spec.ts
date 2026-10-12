import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "booktracker-preferences-v1",
      JSON.stringify({
        version: 1,
        completed: true,
        step: 3,
        language: "en",
        genres: [],
        cover: "modern",
        editions: "single",
      }),
    );
  });
});
const stored = (page: import("@playwright/test").Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("folio-library-v1")!));
test("logging, half stars, spoilers, filtering and persistence", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator(".book-card")).toHaveCount(8);
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "My Library" })
    .click();
  await expect(page.locator(".book-card")).toHaveCount(16);
  await page
    .locator(".book-card")
    .filter({ hasText: "The Creative Act" })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Completed", exact: true }).click();
  await dialog
    .getByRole("button", { name: "Rate 3.5 stars", exact: true })
    .click();
  await dialog.getByLabel("Completion Date").fill("2026-10-10");
  await dialog
    .getByLabel("Your review")
    .fill("A fresh perspective on everyday creativity.");
  await dialog.getByLabel("Tags", { exact: true }).fill("Creativity, Favorite");
  await dialog.getByLabel("This review contains spoilers").check();
  await dialog.getByRole("button", { name: "Save to library" }).click();
  await expect
    .poll(
      async () =>
        (await stored(page)).books.find(
          (b: { id: string }) => b.id === "sample-0",
        ).rating,
    )
    .toBe(3.5);
  await page.reload();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "My Library" })
    .click();
  await page.getByLabel("Filter by genre or tag").selectOption("Favorite");
  await expect(page.locator(".book-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Diary view" }).click();
  await expect(
    page.getByText("A fresh perspective on everyday creativity."),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Contains spoilers · Reveal review" })
    .click();
  await expect(
    page.getByText("A fresh perspective on everyday creativity."),
  ).toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Analytics" })
    .click();
  await expect(page.locator(".analytics-metrics .stat").first()).toContainText(
    "11",
  );
  await expect(page.locator(".chart-card")).toHaveCount(4);
  expect(errors).toEqual([]);
});
test("create, rank, tier and reopen a custom list", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Custom Lists" })
    .click();
  await page
    .getByRole("button", { name: "Create a list", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("List title").fill("Weekend essentials");
  await dialog
    .getByLabel("Description", { exact: true })
    .fill("Books worth another look.");
  await dialog
    .locator(".add-books")
    .getByRole("button", { name: "The Creative Act", exact: true })
    .click();
  await dialog
    .locator(".add-books")
    .getByRole("button", { name: "Meditations", exact: true })
    .click();
  await dialog.getByLabel("Move Meditations up").click();
  await dialog.getByLabel("Tier for Meditations").selectOption("S");
  await dialog.getByRole("button", { name: "Save collection" }).click();
  await page.reload();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Custom Lists" })
    .click();
  await page
    .locator(".list-card")
    .filter({ hasText: "Weekend essentials" })
    .click();
  await expect(page.locator(".ranked-book").first()).toContainText(
    "Meditations",
  );
  await expect(page.locator(".tier-S")).toHaveText("S");
  await page.getByRole("button", { name: "Tier board" }).click();
  await expect(
    page.locator(".tier-row").filter({ has: page.locator(".tier-S") }),
  ).toContainText("Meditations");
  await page.getByRole("button", { name: "Edit & rank" }).click();
  await expect(page.getByLabel("Description", { exact: true })).toHaveValue(
    "Books worth another look.",
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("search results, remote description and adding a book", async ({
  page,
}) => {
  await page.route("https://openlibrary.org/search.json?**", (r) =>
    r.fulfill({
      json: {
        docs: [
          {
            key: "/works/OLTESTW",
            title: "A Test Book",
            author_name: ["Test Author"],
            first_publish_year: 2020,
            number_of_pages_median: 200,
          },
        ],
      },
    }),
  );
  await page.route("https://openlibrary.org/works/OLTESTW.json", (r) =>
    r.fulfill({
      json: { description: { value: "A remote work description." } },
    }),
  );
  await page.goto("/");
  await page
    .getByRole("combobox", { name: "Search books and authors" })
    .fill("test");
  await page.getByRole("option", { name: /A Test Book/ }).click();
  await expect(page.getByText("A remote work description.")).toBeVisible();
  await page.getByRole("button", { name: "Save to library" }).click();
  await expect.poll(async () => (await stored(page)).books.length).toBe(17);
});
test("offline search fallback and malformed storage preservation", async ({
  page,
}) => {
  await page.route("https://openlibrary.org/search.json?**", (r) => r.abort());
  await page.goto("/");
  await page
    .getByRole("combobox", { name: "Search books and authors" })
    .fill("Meditations");
  await expect(
    page.getByText(
      "Open Library is unavailable. Showing matches from your library.",
    ),
  ).toBeVisible();
  await expect(page.getByRole("option", { name: /Meditations/ })).toBeVisible();
  await page.evaluate(() =>
    localStorage.setItem("folio-library-v1", "invalid-json"),
  );
  await page.reload();
  await expect(
    page.getByText(
      "Browser storage is unavailable. Changes will only last for this session.",
    ),
  ).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("folio-library-v1")),
  ).toBe("invalid-json");
});
test("mobile layouts and book dialog fit the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Between the covers/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .locator(".hero-book img")
    .first()
    .evaluate((img: HTMLImageElement) => img.decode());
  await page.screenshot({
    path: "folio-mobile.jpg",
    fullPage: true,
    quality: 70,
  });
  await page.locator(".book-card").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(
    await page
      .getByRole("dialog")
      .evaluate((e) => e.scrollWidth <= e.clientWidth),
  ).toBe(true);
  await page.getByRole("button", { name: "Save to library" }).click();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Analytics" })
    .click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "folio-analytics-mobile.jpg",
    fullPage: true,
    quality: 65,
  });
});
