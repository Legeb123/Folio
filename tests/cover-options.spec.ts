import { test, expect } from "@playwright/test";
import { createSeed } from "../lib/data";
import { LIBRARY_RESET_KEY } from "../lib/library-reset";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ({ seed, reset }) => {
      if (localStorage.getItem(reset)) return;
      localStorage.setItem(reset, "done");
      localStorage.setItem("folio-library-v1", JSON.stringify(seed));
      localStorage.setItem(
        "booktracker-preferences-v1",
        JSON.stringify({
          version: 1,
          completed: true,
          step: 3,
          language: "en",
          genres: [],
          cover: "minimalist",
          favoriteBookIds: [],
          shelfStyle: "white",
        }),
      );
    },
    {
      seed: { ...createSeed(), books: createSeed().books.slice(0, 2) },
      reset: LIBRARY_RESET_KEY,
    },
  );
});

test("individual cover previews, saves, survives global changes and can follow global again", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator(".book-card").first().click();
  const style = page.getByLabel("Cover style for this book");
  await expect(style).toHaveValue("global");
  await style.selectOption("leather");
  await expect(
    page.locator(".book-modal-layout aside .leather-cover"),
  ).toBeVisible();
  await style.selectOption("modern");
  await expect(page.locator(".book-modal-layout aside .cover img")).toHaveCount(
    1,
  );
  await style.selectOption("minimalist");
  await expect(
    page.locator(".book-modal-layout aside .minimalist-cover"),
  ).toBeVisible();
  await style.selectOption("leather");
  await page
    .getByRole("button", { name: "Save to library", exact: true })
    .click();
  await expect(
    page.locator(".book-card").first().locator(".leather-cover"),
  ).toBeVisible();
  await expect(
    page.locator(".book-card").nth(1).locator(".minimalist-cover"),
  ).toBeVisible();
  await page.evaluate(() => {
    const key = "booktracker-preferences-v1";
    const p = JSON.parse(localStorage.getItem(key)!);
    p.cover = "modern";
    localStorage.setItem(key, JSON.stringify(p));
  });
  await page.reload();
  await expect(
    page.locator(".book-card").first().locator(".leather-cover"),
  ).toBeVisible();
  await page.locator(".book-card").first().click();
  await expect(style).toHaveValue("leather");
  await style.selectOption("global");
  await page
    .getByRole("button", { name: "Save to library", exact: true })
    .click();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("folio-library-v1")!).books[0]
          .coverStyle,
    ),
  ).toBeUndefined();
  await expect(
    page.locator(".book-card").first().locator(".cover img"),
  ).toHaveCount(1);
});

test("white shelf has a dark backing and matte white boards on desktop and mobile", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "My Library", exact: true })
    .click();
  const shelf = page.locator(".bookshelf-white");
  await expect(shelf).toBeVisible();
  expect(
    await shelf.evaluate((el) => getComputedStyle(el).backgroundColor),
  ).toBe("rgb(18, 19, 24)");
  const board = await shelf
    .locator(".shelf-slot")
    .first()
    .evaluate((el) => ({
      background: getComputedStyle(el, "::before").backgroundColor,
      image: getComputedStyle(el, "::before").backgroundImage,
    }));
  expect(board).toEqual({ background: "rgb(216, 216, 209)", image: "none" });
  await page.screenshot({
    path: "folio-matte-white-shelf.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
