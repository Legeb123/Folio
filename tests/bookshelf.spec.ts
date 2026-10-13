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
          genres: [],
          cover: "modern",
        }),
      );
  });
});
test("shelf controls and shelf styles are exclusive to My Library and persist across reload", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".shelf-switcher")).toHaveCount(0);
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "My Library", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Rustic Wooden Bookshelf", exact: true })
    .click();
  await expect(page.locator(".shelf-slot")).toHaveCount(16);
  for (const [label, count] of [
    ["Read", 10],
    ["Reading", 2],
    ["Want to Read", 4],
  ] as const) {
    await page
      .locator(".filter-tabs button")
      .filter({ hasText: new RegExp("^" + label + "\\d+$") })
      .click();
    await expect(page.locator(".shelf-slot")).toHaveCount(count);
  }
  await page
    .getByRole("button", { name: "Modern White Bookshelf", exact: true })
    .click();
  await page.reload();
  await expect(page.locator(".book-grid")).toBeVisible();
  await expect(page.locator(".bookshelf")).toHaveCount(0);
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "My Library", exact: true })
    .click();
  await expect(page.locator(".bookshelf-white")).toBeVisible();
  await page.getByRole("button", { name: "Diary view", exact: true }).click();
  await expect(page.locator(".bookshelf")).toHaveCount(0);
  await page.getByRole("button", { name: "Simple View", exact: true }).click();
  await expect(page.locator(".book-grid")).toBeVisible();
});
test("Wishlist remains simple and its goals and status actions work after changing library appearance", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "My Library", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Rustic Wooden Bookshelf", exact: true })
    .click();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Wishlist", exact: true })
    .click();
  await expect(page.locator(".shelf-switcher,.bookshelf")).toHaveCount(0);
  const first = page.locator(".queue-list article").first();
  await first
    .getByRole("button", { name: "Start reading", exact: true })
    .click();
  await page.getByLabel("Reading goal (days)").fill("12");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Start reading", exact: true })
    .click();
  await expect(page.locator(".queue-list article")).toHaveCount(3);
});
test("German library shelf styles fit mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: /Deutsch/ }).click();
  await page.getByRole("button", { name: "Fertig", exact: true }).click();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Bibliothek", exact: true })
    .click();
  for (const name of ["Rustikales Holzregal", "Modernes weißes Regal"]) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(page.locator(".bookshelf")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
