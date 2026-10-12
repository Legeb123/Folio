import { test, expect } from "@playwright/test";
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
          genres: ["History"],
          cover: "modern",
          favoriteBookIds: ["sample-3", "sample-0", "sample-1"],
        }),
      );
  });
});
const saved = (page: import("@playwright/test").Page) =>
  page.evaluate(
    () => JSON.parse(localStorage.getItem("folio-library-v1")!).books,
  );
test("dimension averages, reading duration and validation persist", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator(".book-card").first().click();
  await page.getByRole("slider", { name: "Writing Style / Prose" }).focus();
  await page.keyboard.press("End");
  await page.getByRole("slider", { name: "Plot / Pacing" }).focus();
  await page.keyboard.press("End");
  for (let i = 0; i < 4; i++) await page.keyboard.press("ArrowLeft");
  await expect(page.locator(".overall-aside>strong")).toHaveText("4.00");
  await page.getByLabel("Start Date", { exact: true }).fill("2026-01-01");
  await page.getByLabel("Completion Date", { exact: true }).fill("2026-01-10");
  await expect(page.locator(".reading-duration")).toContainText("10 days");
  await page.getByLabel("Completion Date", { exact: true }).fill("2025-12-31");
  await expect(
    page.getByRole("button", { name: "Save to library" }),
  ).toBeDisabled();
  await page.getByLabel("Completion Date", { exact: true }).fill("2026-01-10");
  await page.getByRole("button", { name: "Save to library" }).click();
  await expect.poll(async () => (await saved(page))[0].rating).toBe(4);
  await page.reload();
  await page.locator(".book-card").first().click();
  await expect(page.getByLabel("Start Date", { exact: true })).toHaveValue(
    "2026-01-01",
  );
  await expect(
    page.getByRole("slider", { name: "Writing Style / Prose" }),
  ).toHaveValue("5");
  await expect(page.getByRole("slider", { name: "Plot / Pacing" })).toHaveValue(
    "3",
  );
  await expect(page.locator(".reading-duration")).toContainText("10 days");
});
test("notes quotes clipboard and background survive reload", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.route("**/api/background?**", (r) =>
    r.fulfill({
      json: {
        language: "en",
        title: "Reference article",
        summary: "Publication and literary background from the reference.",
        url: "https://en.wikipedia.org/wiki/Book",
        authorSummary: "A reference biography of the author.",
        authorUrl: "https://en.wikipedia.org/wiki/Author",
        fetchedAt: "2026-10-12T12:00:00Z",
      },
    }),
  );
  await page.goto("/");
  await page.locator(".book-card").first().click();
  await page.getByRole("tab", { name: "Notes & quotes" }).click();
  await page
    .getByLabel("Personal thoughts", { exact: true })
    .fill("A personal reflection.");
  await page
    .getByLabel("Key takeaways", { exact: true })
    .fill("Notice everyday details.\nKeep creating.");
  await page.getByRole("button", { name: "Add quote", exact: true }).click();
  await page.getByLabel("Quote 1", { exact: true }).fill("My saved quotation.");
  await page.getByLabel("Page / location").fill("42");
  await page.getByRole("button", { name: "Copy quote 1", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Quote copied.");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "My saved quotation.",
  );
  await page.getByRole("tab", { name: "Background & context" }).click();
  await expect(
    page.getByText("Publication and literary background from the reference."),
  ).toBeVisible();
  await page
    .getByLabel("Your historical / literary notes", { exact: true })
    .fill("My interpretation, with a source.");
  await page.getByRole("button", { name: "Save to library" }).click();
  await page.reload();
  await page.locator(".book-card").first().click();
  await page.getByRole("tab", { name: "Notes & quotes" }).click();
  await expect(
    page.getByLabel("Personal thoughts", { exact: true }),
  ).toHaveValue("A personal reflection.");
  await expect(page.getByLabel("Quote 1", { exact: true })).toHaveValue(
    "My saved quotation.",
  );
  await page.getByRole("tab", { name: "Background & context" }).click();
  await expect(
    page.getByLabel("Your historical / literary notes", { exact: true }),
  ).toHaveValue("My interpretation, with a source.");
  await expect(
    page.getByText("Publication and literary background from the reference."),
  ).toBeVisible();
});
test("Ideas explain recommendations, exclude owned books and add to wishlist", async ({
  page,
}) => {
  const queries: string[] = [];
  await page.route("https://openlibrary.org/search.json?**", (r) => {
    queries.push(new URL(r.request().url()).searchParams.get("q") || "");
    return r.fulfill({
      json: {
        docs: [
          {
            key: "/works/NEWIDEA",
            title: "A New Discovery",
            author_name: ["Donna Tartt"],
            first_publish_year: 2020,
          },
          {
            key: "/works/ALREADY",
            title: "The Creative Act",
            author_name: ["Rick Rubin"],
          },
        ],
      },
    });
  });
  await page.goto("/");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Ideas", exact: true })
    .click();
  await expect(page.locator(".idea-card")).toHaveCount(1);
  await expect(page.locator(".idea-reason")).toContainText("More by");
  expect(queries.some((q) => q.includes("author:"))).toBe(true);
  expect(queries.some((q) => q.includes("History"))).toBe(true);
  await page
    .locator(".idea-card")
    .getByRole("button", { name: "Want to Read" })
    .click();
  await expect
    .poll(async () =>
      (await saved(page)).some(
        (b: { id: string; status: string }) =>
          b.id === "/works/NEWIDEA" && b.status === "Want to Read",
      ),
    )
    .toBe(true);
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Wishlist", exact: true })
    .click();
  await expect(
    page.locator(".queue-book").filter({ hasText: "A New Discovery" }),
  ).toBeVisible();
  await page
    .locator(".queue-list article")
    .filter({ hasText: "A New Discovery" })
    .getByRole("button", { name: "Start reading" })
    .click();
  await expect(
    page.locator(".queue-book").filter({ hasText: "A New Discovery" }),
  ).toHaveCount(0);
  await expect
    .poll(
      async () =>
        (await saved(page)).find(
          (b: { id: string }) => b.id === "/works/NEWIDEA",
        ).status,
    )
    .toBe("Currently Reading");
});
test("German titles descriptions and editor controls preserve original metadata", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: /Deutsch/ }).click();
  await page.getByRole("button", { name: "Fertig", exact: true }).click();
  await expect(page.locator(".book-card").first()).toContainText(
    "Kreativ. Die Kunst zu sein",
  );
  await page.locator(".book-card").first().click();
  await expect(page.locator(".description")).toContainText(
    "Kreativität als Lebenshaltung",
  );
  await expect(page.getByRole("slider", { name: "Schreibstil" })).toBeVisible();
  await expect(page.getByLabel("Startdatum", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Notizen & Zitate" }).click();
  await page
    .getByLabel("Persönliche Gedanken", { exact: true })
    .fill("Meine eigenen Worte.");
  await page.getByRole("button", { name: "In Bibliothek speichern" }).click();
  expect((await saved(page))[0].title).toBe("The Creative Act");
  expect((await saved(page))[0].thoughts).toBe("Meine eigenen Worte.");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Statistik" })
    .click();
  await expect(page.getByText("So bewertest du deine Bücher")).toBeVisible();
});
test("mobile detail panels, wishlist and Ideas failure state remain usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("https://openlibrary.org/search.json?**", (r) => r.abort());
  await page.goto("/");
  await page.locator(".book-card").first().click();
  await page.getByRole("tab", { name: "Notes & quotes" }).click();
  await expect(page.getByLabel("Personal thoughts")).toBeVisible();
  expect(
    await page
      .getByRole("dialog")
      .evaluate((e) => e.scrollWidth <= e.clientWidth),
  ).toBe(true);
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Ideas", exact: true })
    .click();
  await expect(
    page.getByText(
      "Some recommendations could not be loaded. Available results or your saved reading queue are shown.",
    ),
  ).toBeVisible();
  await expect(page.locator(".idea-card")).toHaveCount(4);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("imported German metadata keeps original title and localized description", async ({
  page,
}) => {
  await page.route("https://openlibrary.org/search.json?**", (r) =>
    r.fulfill({
      json: {
        docs: [
          {
            key: "/works/TRANSLATEDW",
            title: "Original Work",
            author_name: ["Example Author"],
            first_publish_year: 2000,
            editions: {
              docs: [
                {
                  key: "/books/OL123M",
                  title: "Ein deutscher Titel",
                  language: ["ger"],
                },
              ],
            },
          },
        ],
      },
    }),
  );
  await page.route("https://openlibrary.org/works/TRANSLATEDW.json", (r) =>
    r.fulfill({ json: { description: "Original description." } }),
  );
  await page.route("https://openlibrary.org/books/OL123M.json", (r) =>
    r.fulfill({
      json: {
        title: "Ein deutscher Titel",
        languages: [{ key: "/languages/ger" }],
        description: "Eine verfügbare deutsche Beschreibung aus dem Katalog.",
      },
    }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: /Deutsch/ }).click();
  await page.getByRole("button", { name: "Fertig", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Bücher und Autoren suchen" })
    .fill("Original");
  await page.getByRole("option", { name: /Ein deutscher Titel/ }).click();
  await expect(page.locator(".description")).toHaveText(
    "Eine verfügbare deutsche Beschreibung aus dem Katalog.",
  );
  await page.getByRole("button", { name: "In Bibliothek speichern" }).click();
  const book = (await saved(page)).find(
    (b: { id: string }) => b.id === "/works/TRANSLATEDW",
  );
  expect(book.title).toBe("Original Work");
  expect(book.german.title).toBe("Ein deutscher Titel");
  expect(book.german.description).toContain("deutsche Beschreibung");
});
test("future date remains invalid after switching detail panels", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator(".book-card").first().click();
  await page.getByLabel("Start Date", { exact: true }).fill("2099-01-01");
  await page.getByRole("tab", { name: "Notes & quotes" }).click();
  await expect(
    page.getByRole("button", { name: "Save to library" }),
  ).toBeDisabled();
  await page.getByRole("tab", { name: "Reading & rating" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "Reading dates cannot be in the future.",
  );
});
