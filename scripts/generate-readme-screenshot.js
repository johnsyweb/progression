import { chromium } from "playwright";
import { writeFileSync } from "fs";
import { join } from "path";
async function generateReadmeScreenshot() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        // Set viewport size for consistent screenshot
        await page.setViewportSize({ width: 1200, height: 800 });
        const basePath = (process.env.BASE_URL ?? "/progression/").replace(/\/$/, "") ||
            "/progression";
        const pathSegment = "/2025-07-01/2026-06-30/Pete's%20Career%20Break";
        const path = `${basePath}${pathSegment}`;
        const port = process.env.PREVIEW_PORT ?? "4173";
        const url = `http://localhost:${port}${path}`;
        console.log(`Navigating to: ${url}`);
        // Try to navigate - if preview server isn't running, use a fallback
        try {
            await page.goto(url, { waitUntil: "networkidle", timeout: 5000 });
        }
        catch (error) {
            console.warn("Could not connect to preview server. Please run `pnpm run build && pnpm run preview` first.");
            throw error;
        }
        // Wait for the progress container to be visible
        await page.waitForSelector(".progress-container", { timeout: 5000 });
        // Take screenshot of the entire page
        const screenshot = await page.screenshot({
            type: "png",
            fullPage: true,
            omitBackground: false,
        });
        // Ensure assets directory exists
        const assetsDir = join(process.cwd(), "assets");
        const { mkdir } = await import("fs/promises");
        try {
            await mkdir(assetsDir, { recursive: true });
        }
        catch {
            // Directory might already exist
        }
        const screenshotPath = join(assetsDir, "screenshot.png");
        // Write screenshot to file
        writeFileSync(screenshotPath, screenshot);
        console.log(`Screenshot saved to: ${screenshotPath}`);
    }
    finally {
        await browser.close();
    }
}
generateReadmeScreenshot().catch((error) => {
    console.error("Error generating screenshot:", error);
    process.exit(1);
});
