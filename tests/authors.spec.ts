import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
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
  await page.route("**/api/authors?**", (route) => {
    const url = new URL(route.request().url());
    return route.fulfill({
      json: {
        authors: url.searchParams
          .getAll("name")
          .map((name) => ({
            name,
            biography:
              url.searchParams.get("lang") === "de"
                ? "Eine deutschsprachige Biografie."
                : "A sourced author biography.",
            source: "https://en.wikipedia.org/wiki/" + encodeURIComponent(name),
            portrait: "/missing-portrait.jpg",
          })),
      },
    });
  });
});
test("author search, library filter, profile references and tracked book interaction", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Authors", exact: true })
    .click();
  await expect(page.locator(".author-card")).toHaveCount(19);
  await page
    .getByRole("button", { name: "In my library", exact: true })
    .click();
  await expect(page.locator(".author-card")).toHaveCount(16);
  await page.getByRole("textbox", { name: "Search authors" }).fill("rooney");
  await expect(page.locator(".author-card")).toHaveCount(1);
  await page.locator(".author-card").click();
  await expect(
    page.getByRole("heading", { name: "Biography", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".author-biography")).toContainText(
    "A sourced author biography.",
  );
  await expect(page.locator(".author-influence")).toHaveCount(2);
  await expect(page.locator(".author-influence a").first()).toHaveAttribute(
    "href",
    /britishcouncil.org/,
  );
  await expect(page.locator(".author-books .book-card")).toHaveCount(1);
  await page.locator(".author-books .book-card").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "All authors", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Search authors" }),
  ).toHaveValue("rooney");
  await page
    .getByRole("textbox", { name: "Search authors" })
    .fill("no-such-person");
  await expect(
    page.getByRole("heading", { name: "No authors found" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.locator(".author-card")).toHaveCount(19);
});
test("German mobile author profiles, empty bibliography and influence fallback", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const p = JSON.parse(localStorage.getItem("booktracker-preferences-v1")!);
    p.language = "de";
    localStorage.setItem("booktracker-preferences-v1", JSON.stringify(p));
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Autor:innen", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Autor:innen suchen" })
    .fill("Austen");
  await page.locator(".author-card").click();
  await expect(page.locator(".author-biography")).toHaveText(
    "Eine deutschsprachige Biografie.",
  );
  await expect(
    page.getByText("Noch keine Bücher dieser Person", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("Für diese Person sind noch keine belegten", {
      exact: false,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "folio-authors-mobile.jpg", fullPage: true });
});
test("reference failure allows browsing and retry", async ({ page }) => {
  await page.route("**/api/authors?**", (route) =>
    route.fulfill({ status: 502, json: { error: "Unavailable" } }),
  );
  await page.goto("/");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Authors", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Retry", exact: true }),
  ).toBeVisible();
  await page.getByRole("textbox", { name: "Search authors" }).fill("Orwell");
  await page.locator(".author-card").click();
  await expect(
    page.getByText("No verified biography", { exact: false }),
  ).toBeVisible();
  await expect(page.locator(".author-influence")).toHaveCount(2);
});
