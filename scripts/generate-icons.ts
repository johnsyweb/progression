import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#1565c0"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>';

const SIZES = [180, 192, 512] as const;

async function generateIcons(): Promise<void> {
  const assetsDir = join(process.cwd(), "assets");
  mkdirSync(assetsDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const html = `<!DOCTYPE html><html><head><style>body{margin:0;background:transparent;}svg{width:100%;height:100%;}</style></head><body>${SVG}</body></html>`;

  for (const size of SIZES) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(html, { waitUntil: "load" });
    const buffer = await page.screenshot({
      type: "png",
      omitBackground: true,
    });
    const path = join(assetsDir, `icon-${size}.png`);
    writeFileSync(path, buffer);
    console.log(`Wrote ${path}`);
  }

  await browser.close();
}

generateIcons().catch((err) => {
  console.error("Error generating icons:", err);
  process.exit(1);
});
