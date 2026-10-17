import { test, expect } from "@playwright/test";
import { createSeed } from "../lib/data";
import { LIBRARY_RESET_KEY } from "../lib/library-reset";
const library = (page: import("@playwright/test").Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("folio-library-v1")!));

test("fresh users complete onboarding with an empty library and favorites", async ({
  page,
}) => {
  await page.goto("/");
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Get Started", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect((await library(page)).books).toEqual([]);
  expect((await library(page)).lists).toEqual([]);
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("booktracker-preferences-v1")!)
          .favoriteBookIds,
    ),
  ).toEqual([]);
  await expect(page.locator(".hero-book")).toHaveCount(0);
});

test("existing data is reset once and books added afterward survive reload", async ({
  page,
}) => {
  await page.addInitScript((seed) => {
    if (!localStorage.getItem("test-installed")) {
      localStorage.setItem("folio-library-v1", JSON.stringify(seed));
      localStorage.setItem("folio-library-reset-2026-10-17", "done");
      localStorage.setItem(
        "booktracker-preferences-v1",
        JSON.stringify({
          version: 1,
          completed: true,
          step: 3,
          language: "en",
          genres: ["History"],
          cover: "modern",
          favoriteBookIds: ["sample-1"],
        }),
      );
      localStorage.setItem("test-installed", "true");
    }
  }, createSeed());
  await page.goto("/");
  await expect(page.getByRole("navigation")).toBeVisible();
  expect((await library(page)).books).toEqual([]);
  expect((await library(page)).lists).toEqual([]);
  expect(
    await page.evaluate((key) => localStorage.getItem(key), LIBRARY_RESET_KEY),
  ).toBe("done");
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("booktracker-preferences-v1")!)
          .favoriteBookIds,
    ),
  ).toEqual([]);
  const newBook = { ...createSeed().books[0], id: "new-book", rating: 0 };
  await page.evaluate((book) => {
    const data = JSON.parse(localStorage.getItem("folio-library-v1")!);
    data.books = [book];
    localStorage.setItem("folio-library-v1", JSON.stringify(data));
  }, newBook);
  await page.reload();
  await expect(page.locator(".book-card").first()).toBeVisible();
  expect((await library(page)).books).toEqual([newBook]);
  await expect(page.locator(".hero-book")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Edit favorite books", exact: true })
    .click();
  await expect(page.getByLabel("Favorite 1", { exact: true })).toHaveValue("");
  await page.getByLabel("Favorite 1", { exact: true }).selectOption("new-book");
  await page
    .getByRole("button", { name: "Save favorites", exact: true })
    .click();
  await expect(page.locator(".hero-book")).toHaveCount(1);
});
