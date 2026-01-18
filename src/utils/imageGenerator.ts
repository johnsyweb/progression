import { chromium } from "playwright";
import { readFileSync } from "fs";
import { join } from "path";
import { type ProgressBarData } from "../progressBar";
import { renderProgressBarForImage } from "./renderProgressBar";

let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;

async function getBrowser() {
  if (!browser) {
    browser = await chromium.launch({ headless: true });
  }
  return browser;
}

// Server-side PNG generation using Playwright (dev mode only)
export async function generateProgressBarPNG(
  data: ProgressBarData
): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // Read CSS file
    const cssPath = join(process.cwd(), "src", "style.css");
    const css = readFileSync(cssPath, "utf-8");

    // Generate HTML for progress bar (without share button)
    const progressHtml = renderProgressBarForImage(data);

    // Create full HTML document
    const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>${css}</style>
</head>
<body>
  <div style="width: 1200px; padding: 40px; background: #fafafa;">
    ${progressHtml}
  </div>
</body>
</html>`;

    await page.setContent(fullHtml);
    
    // Wait for fonts and styles to load
    await page.waitForLoadState("networkidle");

    // Get the progress-container element
    const container = await page.locator(".progress-container");
    
    // Take screenshot of just the container
    const screenshot = await container.screenshot({
      type: "png",
      omitBackground: false,
    });

    return screenshot as Buffer;
  } finally {
    await page.close();
  }
}
