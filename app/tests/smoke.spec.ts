import { test, expect } from "@playwright/test";

// SOW-KH-002 T9 smoke test (AC 6):
// navigate to the app, assert the login page loads, assert the page title.
test("login page loads with correct title", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("QuickNotes");

  // AuthScreen renders for logged-out visitors
  await expect(page.getByRole("heading", { name: "QuickNotes" })).toBeVisible();
  await expect(page.locator('button[type="submit"]')).toHaveText("Log In");
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
});
