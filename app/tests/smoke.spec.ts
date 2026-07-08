import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

// SOW-KH-002 T9 smoke test (AC 6), app-agnostic version:
// the expected title is read from index.html, so the same test passes for
// every app generated with the Dyad wiring block (which mandates an exact
// <title> and an email+password auth screen) — no per-app test edits.
const title = /<title>([^<]*)<\/title>/i
  .exec(readFileSync("index.html", "utf8"))![1]
  .trim();

test("app serves and shows the auth screen", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(title);

  // Wiring block mandates email + password auth for logged-out visitors
  await expect(page.locator('input[type="email"]').first()).toBeVisible();
  await expect(page.locator('input[type="password"]').first()).toBeVisible();
  await expect(page.locator('button[type="submit"]').first()).toBeVisible();
});
