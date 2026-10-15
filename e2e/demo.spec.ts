import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { summarize } from "../src/lib/funnel";
import { seedApplications } from "../src/lib/seed";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
});

test("shows the seeded board, response rate, and analytics", async ({ page }) => {
  const summary = summarize(seedApplications());
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Vercel" })).toBeVisible();
  await expect(page.getByTestId("column-OFFER").locator("[data-company='Vercel']")).toBeVisible();
  await expect(page.getByTestId("column-SAVED").locator("[data-company='Anthropic']")).toBeVisible();
  await expect(page.getByTestId("response-rate")).toHaveAttribute("data-rate", String(summary.rate));
  await expect(page.getByText("Demo mode.")).toBeVisible();

  await page.getByTestId("view-analytics").click();
  await expect(page.getByTestId("analytics-insight")).toContainText(`${Math.round((summary.rate ?? 0) * 100)}%`);
  await expect(page.getByTestId("funnel-chart").locator(".recharts-surface")).toBeVisible();
  await expect(page.getByTestId("response-chart").locator(".recharts-surface")).toBeVisible();
});

test("creates an application, adds a note and reminder, moves it, and deletes it", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("add-application").click();
  await page.getByTestId("create-company").fill("Initech");
  await page.getByTestId("create-role").fill("Product Engineer");
  await page.getByTestId("create-location").fill("Austin");
  await page.getByTestId("save-application").click();

  const card = page.locator("[data-company='Initech']");
  await expect(page.getByTestId("column-SAVED").locator("[data-company='Initech']")).toBeVisible();
  await card.click();
  await expect(page.getByTestId("application-sheet")).toBeVisible();

  await page.getByTestId("note-input").fill("Referral from Ada");
  await page.getByTestId("save-note").click();
  await expect(page.getByText("Referral from Ada")).toBeVisible();

  await page.getByTestId("reminder-title").fill("Send portfolio");
  await page.getByTestId("reminder-due").fill("2026-12-01T09:30");
  await page.getByTestId("save-reminder").click();
  await expect(page.getByText("Send portfolio")).toBeVisible();

  await page.getByTestId("edit-stage").selectOption("APPLIED");
  await page.getByTestId("save-application-edit").click();
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("column-APPLIED").locator("[data-company='Initech']")).toBeVisible();

  await card.click();
  await page.getByTestId("delete-application").click();
  await page.getByTestId("confirm-delete").click();
  await expect(page.locator("[data-company='Initech']")).toHaveCount(0);
});

test("drags a saved role into applied", async ({ page }) => {
  await page.goto("/");
  await dragCard(page, "card-seed-anthropic", "column-APPLIED");
  await expect(page.getByTestId("column-APPLIED").locator("[data-company='Anthropic']")).toBeVisible();
});

test("exports and imports csv, then resets the sample search", async ({ page }) => {
  await page.goto("/");
  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("export-csv").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain("jobtrackr-applications.csv");
  const csv = readFileSync(await download.path(), "utf8");
  expect(csv).toContain("Vercel");
  expect(csv).toContain("OFFER");

  await page.getByTestId("search").fill("figma");
  await expect(page.locator("[data-company='Figma']")).toBeVisible();
  await expect(page.locator("[data-company='Vercel']")).toHaveCount(0);
  await page.getByTestId("search").fill("");

  await page.getByTestId("import-csv").setInputFiles(path.join(process.cwd(), "e2e/fixtures/import.csv"));
  await expect(page.locator("[data-company='Hooli']")).toBeVisible();
  await page.locator("[data-company='Hooli']").click();
  await expect(page.getByText("Coffee chat with Gavin")).toBeVisible();
  await page.keyboard.press("Escape");

  await page.getByTestId("reset-demo").click();
  await expect(page.locator("[data-company='Hooli']")).toHaveCount(0);
  await expect(page.locator("[data-company='Vercel']")).toBeVisible();
});

async function dragCard(page: Page, cardId: string, columnId: string) {
  const card = page.getByTestId(cardId);
  const column = page.getByTestId(columnId);
  await card.scrollIntoViewIfNeeded();
  await column.scrollIntoViewIfNeeded();
  const source = await card.boundingBox();
  const target = await column.boundingBox();
  if (!source || !target) throw new Error("Missing drag target");
  await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2);
  await page.mouse.down();
  await page.mouse.move(source.x + source.width / 2 + 12, source.y + source.height / 2 + 12, { steps: 4 });
  await page.mouse.move(target.x + target.width / 2, target.y + 140, { steps: 18 });
  await page.mouse.up();
}
