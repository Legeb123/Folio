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
          cover: "first",
          editions: "all",
        }),
      );
  });
});
test("legacy cover settings migrate and leather renders without edition requests", async ({
  page,
}) => {
  let editions = 0;
  page.on("request", (r) => {
    if (r.url().includes("/editions")) editions++;
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Normal", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "First Edition", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText("Edition view", { exact: true })).toHaveCount(0);
  await page
    .getByRole("button", { name: "Leather-bound", exact: true })
    .click();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.locator(".hero-book .leather-cover")).toHaveCount(3);
  await page.reload();
  await expect(page.locator(".hero-book .leather-cover")).toHaveCount(3);
  await page.locator(".book-card").first().click();
  await expect(page.locator(".book-modal-layout .leather-cover")).toHaveCount(
    1,
  );
  await expect(
    page.getByText("Editions & translations", { exact: true }),
  ).toHaveCount(0);
  expect(editions).toBe(0);
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("booktracker-preferences-v1")!)
          .editions,
    ),
  ).toBeUndefined();
});
test("three favorites can be selected in order and persist; cancel discards changes", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Edit favorite books" }).click();
  await page.getByLabel("Favorite 1", { exact: true }).selectOption("sample-8");
  await page.getByLabel("Favorite 2", { exact: true }).selectOption("sample-7");
  await page.getByLabel("Favorite 3", { exact: true }).selectOption("sample-5");
  await page.getByRole("button", { name: "Save favorites" }).click();
  await expect(page.locator(".hero-book-0")).toHaveAttribute(
    "aria-label",
    "Open Dune",
  );
  await expect(page.locator(".hero-book-1")).toHaveAttribute(
    "aria-label",
    "Open Atomic Habits",
  );
  await expect(page.locator(".hero-book-2")).toHaveAttribute(
    "aria-label",
    "Open Sapiens",
  );
  await page.reload();
  await expect(page.locator(".hero-book-0")).toHaveAttribute(
    "aria-label",
    "Open Dune",
  );
  await page.getByRole("button", { name: "Edit favorite books" }).click();
  await page.getByLabel("Favorite 1", { exact: true }).selectOption("sample-0");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.locator(".hero-book-0")).toHaveAttribute(
    "aria-label",
    "Open Dune",
  );
  await page.getByRole("button", { name: "Open welcome flow" }).click();
  await expect(
    page.getByRole("dialog", { name: "Welcome to BookTracker" }),
  ).toBeVisible();
});
test("favorite picker and header shortcuts fit mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Open welcome flow" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Edit favorite books" }).click();
  await expect(
    page.getByRole("button", { name: "Save favorites" }),
  ).toBeVisible();
  expect(
    await page
      .getByRole("dialog")
      .evaluate((e) => e.scrollWidth <= e.clientWidth),
  ).toBe(true);
});
