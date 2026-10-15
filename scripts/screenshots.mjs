import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const base = process.env.SHOT_URL ?? "http://127.0.0.1:3000";
const out = path.join(process.cwd(), "docs", "screenshots");
await mkdir(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
await page.addInitScript(() => window.localStorage.clear());
await page.goto(base, { waitUntil: "networkidle" });
await page.getByRole("heading", { name: "Vercel" }).waitFor();
await page.screenshot({ path: path.join(out, "board.png") });

await page.getByTestId("view-analytics").click();
await page.getByTestId("funnel-chart").locator(".recharts-surface").waitFor();
await page.screenshot({ path: path.join(out, "analytics.png") });

await page.getByTestId("view-board").click();
await page.locator("[data-company='Vercel']").click();
await page.getByTestId("application-sheet").waitFor();
await page.screenshot({ path: path.join(out, "detail.png") });

await page.setViewportSize({ width: 390, height: 844 });
await page.keyboard.press("Escape");
await page.screenshot({ path: path.join(out, "mobile.png") });

await browser.close();
console.log(`Wrote screenshots to ${out}`);
