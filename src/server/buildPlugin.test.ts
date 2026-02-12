import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join, resolve } from "path";

describe("Build Plugin", () => {
  const distPath = resolve(process.cwd(), "dist");

  beforeAll(() => {
    // Tests assume build has been run (e.g. in CI or via pnpm run build)
  });

  it("should produce index.html after build", () => {
    const htmlPath = join(distPath, "index.html");
    expect(existsSync(htmlPath)).toBe(true);
  });

  it("should produce 404.html for GitHub Pages SPA routing", () => {
    const notFoundPath = join(distPath, "404.html");
    expect(existsSync(notFoundPath)).toBe(true);
  });

  it("should produce sitemap.xml", () => {
    const sitemapPath = join(distPath, "sitemap.xml");
    expect(existsSync(sitemapPath)).toBe(true);
  });

  it("should inject base tag when base path is not root", () => {
    const htmlPath = join(distPath, "index.html");
    if (!existsSync(htmlPath)) {
      return;
    }
    const html = readFileSync(htmlPath, "utf-8");
    // Default build uses BASE_URL=/progression/ so base tag should be present
    const baseUrl = process.env.BASE_URL || "/progression/";
    if (baseUrl !== "/" && !baseUrl.startsWith("http")) {
      expect(html).toContain("<base href=");
    }
  });

  it("should copy assets directory when present", () => {
    const assetsSourceDir = resolve(process.cwd(), "assets");
    const assetsDestDir = join(distPath, "assets");
    if (existsSync(assetsSourceDir)) {
      expect(existsSync(assetsDestDir)).toBe(true);
    }
  });
});
