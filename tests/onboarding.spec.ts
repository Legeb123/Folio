import { test, expect } from "@playwright/test";
test("first visit completes four steps and retains language and genres", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("dialog", { name: "Welcome to BookTracker" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue with Google" }),
  ).toBeDisabled();
  await expect(page.getByText("Cover preference", { exact: true })).toHaveCount(
    0,
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: /Deutsch/ }).click();
  await expect(
    page.getByRole("button", { name: "Weiter", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await page.getByRole("button", { name: "Geschichte", exact: true }).click();
  await page.getByRole("button", { name: "Fantasy", exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Geschichte", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Los geht’s", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Los geht’s", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("navigation").getByRole("button", { name: "Bibliothek" }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(await page.locator("html").getAttribute("lang")).toBe("de");
  await page
    .getByRole("button", { name: "Einstellungen", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Geschichte", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Einfach", exact: true }).click();
  await page.getByRole("button", { name: "Fertig", exact: true }).click();
  await expect(page.locator(".minimalist-cover").first()).toBeVisible();
  await page.reload();
  await expect(page.locator(".minimalist-cover").first()).toBeVisible();
});
test("onboarding is responsive, back retains choices and replay works", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.screenshot({ path: "folio-onboarding-mobile.jpg", quality: 75 });
  expect(
    await page
      .getByRole("dialog")
      .evaluate((e) => e.scrollWidth <= e.clientWidth),
  ).toBe(true);
  for (let i = 0; i < 2; i++)
    await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Classics", exact: true }).click();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Classics", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Get Started", exact: true }).click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Leather-bound", exact: true }),
  ).toBeVisible();
  expect(
    await page
      .getByRole("dialog")
      .evaluate((e) => e.scrollWidth <= e.clientWidth),
  ).toBe(true);
  await page.getByRole("button", { name: "Show introduction again" }).click();
  await expect(
    page.getByRole("dialog", { name: "Welcome to BookTracker" }),
  ).toBeVisible();
});
test("unconfigured auth is honest and malformed preferences do not erase library", async ({
  page,
  request,
}) => {
  const account = await request.get("/api/account");
  expect((await account.json()).configured).toBe(false);
  expect((await request.get("/api/auth/providers")).status()).toBe(503);
  await page.addInitScript(() =>
    localStorage.setItem("booktracker-preferences-v1", "bad-json"),
  );
  await page.goto("/");
  await expect(
    page.getByText(
      "Preferences cannot be saved in this browser. Changes apply to this session.",
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("booktracker-preferences-v1"),
    ),
  ).toBe("bad-json");
});

test("settings stay centered and new preferences apply and persist", async ({
  page,
}) => {
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
          editions: "single",
        }),
      );
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Reading preferences" });
  await expect(dialog).toBeVisible();
  let box = await dialog.boundingBox();
  expect(Math.abs(box!.y + box!.height / 2 - 500)).toBeLessThan(3);
  expect(box!.height).toBeLessThanOrEqual(800);
  await page
    .getByRole("combobox", { name: "Default library view", exact: true })
    .selectOption("diary");
  await page
    .getByRole("combobox", { name: "Shelf density", exact: true })
    .selectOption("compact");
  await page
    .getByRole("switch", { name: "Reduce motion", exact: true })
    .check();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.locator(".diary")).toBeVisible();
  await expect(page.locator(".app-shell")).toHaveAttribute(
    "data-density",
    "compact",
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-reduce-motion",
    "true",
  );
  await page.reload();
  await expect(page.locator(".diary")).toBeVisible();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(
    page.getByRole("combobox", { name: "Default library view", exact: true }),
  ).toHaveValue("diary");
  await expect(
    page.getByRole("switch", { name: "Reduce motion", exact: true }),
  ).toBeChecked();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 700));
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  box = await dialog.boundingBox();
  expect(Math.abs(box!.y + box!.height / 2 - 422)).toBeLessThan(3);
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.width).toBeLessThanOrEqual(390);
  await expect(
    page.getByRole("button", { name: "Done", exact: true }),
  ).toBeInViewport();
  await expect(
    page.getByRole("heading", { name: "Reading preferences", exact: true }),
  ).toBeInViewport();
  await page.screenshot({ path: "folio-settings-mobile.jpg", quality: 75 });
});
