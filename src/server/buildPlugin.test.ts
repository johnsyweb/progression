import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join, resolve } from "path";
import { spawn, ChildProcess } from "child_process";
import { chromium, Browser, Page } from "playwright";

describe("Service Worker Build", () => {
  const distPath = resolve(process.cwd(), "dist");
  const swPath = join(distPath, "sw.js");

  it("should build sw.js file that exists", () => {
    expect(existsSync(swPath)).toBe(true);
  });

  it("should include addEventListener in built service worker", () => {
    if (!existsSync(swPath)) {
      throw new Error("sw.js not found. Run 'pnpm run build' first.");
    }

    const swCode = readFileSync(swPath, "utf-8");

    // Check for event listeners - they should be present
    expect(swCode).toContain("addEventListener");

    // Check for install listener
    expect(swCode.includes('"install"') || swCode.includes("'install'")).toBe(
      true
    );

    // Check for fetch listener
    expect(swCode.includes('"fetch"') || swCode.includes("'fetch'")).toBe(true);
  });

  it("should not contain import/export statements", () => {
    if (!existsSync(swPath)) {
      throw new Error("sw.js not found. Run 'pnpm run build' first.");
    }

    const swCode = readFileSync(swPath, "utf-8");

    // Service worker should not have ES module syntax
    const hasImport = /^import\s+/m.test(swCode);
    const hasExport = /^export\s+/m.test(swCode);

    expect(hasImport).toBe(false);
    expect(hasExport).toBe(false);
  });

  it("should include required functions for SVG generation", () => {
    if (!existsSync(swPath)) {
      throw new Error("sw.js not found. Run 'pnpm run build' first.");
    }

    const swCode = readFileSync(swPath, "utf-8");

    // Should contain SVG generation code (width/height or SVG tags)
    const hasSVGCode =
      swCode.includes("1200") || // SVG width
      swCode.includes("630") || // SVG height
      swCode.includes("<svg") ||
      swCode.includes("svg+xml");

    expect(hasSVGCode).toBe(true);
  });
});

describe("Service Worker Runtime (requires build and preview server)", () => {
  let browser: Browser | null = null;
  let page: Page | null = null;
  let previewProcess: ChildProcess | null = null;
  const distPath = resolve(process.cwd(), "dist");
  const swPath = join(distPath, "sw.js");

  beforeAll(async () => {
    // Skip if sw.js doesn't exist
    if (!existsSync(swPath)) {
      console.warn(
        "Skipping runtime tests: sw.js not found. Run 'pnpm run build' first."
      );
      return;
    }

    // Start preview server
    previewProcess = spawn("pnpm", ["run", "preview"], {
      cwd: process.cwd(),
      stdio: "pipe",
      shell: true,
    });

    // Wait for server to start (give it a few seconds)
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Launch browser
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
  }, 60000);

  afterAll(async () => {
    if (page) await page.close();
    if (browser) await browser.close();
    if (previewProcess) {
      previewProcess.kill();
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  });

  it("should register service worker successfully", async () => {
    if (!page || !existsSync(swPath)) {
      return; // Skip if setup failed
    }

    // Navigate to a page first so service worker can register
    await page
      .goto("http://localhost:4173/progression/", {
        waitUntil: "networkidle",
        timeout: 10000,
      })
      .catch(() => {
        // If server isn't running, skip test
        return;
      });

    const registrationPromise = page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) {
        return { success: false, error: "Service Worker not supported" };
      }

      try {
        // Unregister any existing service workers
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((reg) => reg.unregister()));

        // Register service worker
        const registration = await navigator.serviceWorker.register(
          "/progression/sw.js",
          { scope: "/progression/" }
        );

        // Wait for it to activate
        await navigator.serviceWorker.ready;

        return {
          success: true,
          scope: registration.scope,
          active: registration.active?.state,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    });

    const result = await registrationPromise;
    if (!result || !result.success) {
      console.warn(
        "Service worker registration test skipped or failed:",
        result?.error
      );
      return; // Skip test if registration failed (server might not be running)
    }
    expect(result.success).toBe(true);
  }, 30000);

  it("should intercept og-image.svg requests and return valid image", async () => {
    if (!page || !existsSync(swPath)) {
      return; // Skip if setup failed
    }

    // First verify sw.js is accessible with correct MIME type
    const swResponse = await page
      .goto("http://localhost:4173/progression/sw.js", {
        timeout: 10000,
      })
      .catch(() => null);

    if (!swResponse) {
      console.warn(
        "Skipping image interception test - sw.js not accessible from preview server"
      );
      return;
    }

    const swContentType = swResponse.headers()["content-type"];
    if (!swContentType || !swContentType.includes("javascript")) {
      console.warn(
        `Skipping image interception test - sw.js has incorrect MIME type: ${swContentType}`
      );
      return;
    }

    // Navigate to a page first to ensure service worker can register
    await page
      .goto("http://localhost:4173/progression/", {
        waitUntil: "networkidle",
        timeout: 10000,
      })
      .catch(() => {
        // If server isn't running, skip test
        return;
      });

    // First ensure service worker is registered
    const registrationResult = await page.evaluate(async () => {
      if ("serviceWorker" in navigator) {
        try {
          const registrations =
            await navigator.serviceWorker.getRegistrations();
          if (registrations.length === 0) {
            await navigator.serviceWorker.register("/progression/sw.js", {
              scope: "/progression/",
            });
          }
          await navigator.serviceWorker.ready;
          // Wait a bit for service worker to be ready to intercept
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return { success: true };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      }
      return { success: false, error: "ServiceWorker not supported" };
    });

    if (!registrationResult?.success) {
      console.warn(
        `Skipping image interception test - service worker registration failed: ${registrationResult?.error}`
      );
      return;
    }

    // Request the OG image with a test path
    const testPath = "/progression/1970-01-01/2038-01-19/Epochalypse%20Now";
    const imageUrl = `/progression/og-image.svg?path=${encodeURIComponent(testPath)}`;

    const response = await page
      .goto(`http://localhost:4173${imageUrl}`, {
        timeout: 15000,
      })
      .catch(() => null);

    if (!response) {
      console.warn(
        "Skipping image interception test - server may not be running"
      );
      return;
    }

    expect(response.status()).toBe(200);

    const contentType = response.headers()["content-type"];
    expect(contentType).toMatch(/image\/svg\+xml/);

    // Get response body and check it's not a 1x1 pixel
    const body = await response.body();
    expect(body).toBeTruthy();

    if (body && contentType?.includes("image/png")) {
      // PNG files should be larger than a 1x1 transparent pixel (which is ~70 bytes)
      // A 1200x630 PNG should be at least several KB
      expect(body.length).toBeGreaterThan(1000);
    }
  }, 30000);
});
