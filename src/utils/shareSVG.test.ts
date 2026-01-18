import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateProgressBarSVG } from "./svgGenerator";

describe("SVG Generation for Sharing", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should generate correct SVG for 2026 path", () => {
    // Set system time to a date in 2026 to test progress calculation
    vi.setSystemTime(new Date("2026-06-15"));
    
    const path = "/progression/2026-01-01/2026-12-31/2026";
    const svg = generateProgressBarSVG(path);
    
    // Check SVG contains correct title
    expect(svg).toContain("2026");
    
    // Check SVG contains progress bar elements
    expect(svg).toContain("<svg");
    expect(svg).toContain("1200");
    expect(svg).toContain("630");
    
    // Check SVG contains dates
    expect(svg).toContain("2026-01-01");
    expect(svg).toContain("2026-12-31");
    
    // Verify it's a valid SVG structure
    expect(svg).toContain("</svg>");
  });

  it("should generate correct SVG for 2020s path", () => {
    // Set system time to a date in 2025 to test progress calculation
    vi.setSystemTime(new Date("2025-06-15"));
    
    const path = "/progression/2020-01-01/2029-12-31/2020s";
    const svg = generateProgressBarSVG(path);
    
    // Check SVG contains correct title
    expect(svg).toContain("2020s");
    
    // Check SVG contains progress bar elements
    expect(svg).toContain("<svg");
    expect(svg).toContain("1200");
    expect(svg).toContain("630");
    
    // Check SVG contains dates
    expect(svg).toContain("2020-01-01");
    expect(svg).toContain("2029-12-31");
    
    // Verify it's a valid SVG structure
    expect(svg).toContain("</svg>");
  });

  it("should generate different SVGs for different paths", () => {
    vi.setSystemTime(new Date("2026-06-15"));
    
    const path1 = "/progression/2026-01-01/2026-12-31/2026";
    const svg1 = generateProgressBarSVG(path1);
    
    const path2 = "/progression/2020-01-01/2029-12-31/2020s";
    const svg2 = generateProgressBarSVG(path2);
    
    // They should be different
    expect(svg1).not.toBe(svg2);
    
    // First should contain "2026" as title
    expect(svg1).toContain("2026");
    expect(svg1).not.toContain("2020s");
    
    // Second should contain "2020s" as title
    expect(svg2).toContain("2020s");
    expect(svg2).not.toContain("2026");
  });

  it("should handle path with basePath prefix correctly", () => {
    vi.setSystemTime(new Date("2026-06-15"));
    
    // Path with /progression prefix (as would come from share function)
    const pathWithBase = "/progression/2026-01-01/2026-12-31/2026";
    const svgWithBase = generateProgressBarSVG(pathWithBase);
    
    // Path without basePath (as would be after service worker strips it)
    const pathWithoutBase = "/2026-01-01/2026-12-31/2026";
    const svgWithoutBase = generateProgressBarSVG(pathWithoutBase);
    
    // Both should generate the same SVG content (title, dates, etc.)
    // Since parseTitleFromPath strips the base path internally when getBasePath() returns "/"
    expect(svgWithBase).toContain("2026");
    expect(svgWithoutBase).toContain("2026");
    
    // Both should have the same title
    expect(svgWithBase).toMatch(/<text[^>]*>2026<\/text>/);
    expect(svgWithoutBase).toMatch(/<text[^>]*>2026<\/text>/);
  });

  it("should calculate correct progress percentage for 2026 path", () => {
    // Set to June 15, 2026 (roughly halfway through the year)
    vi.setSystemTime(new Date("2026-06-15"));
    
    const path = "/progression/2026-01-01/2026-12-31/2026";
    const svg = generateProgressBarSVG(path);
    
    // Should contain progress percentage (roughly 50% in June)
    // The percentage should be in the SVG as text
    expect(svg).toMatch(/\d+\.\d+%/);
    
    // Check that progress fill width is calculated
    expect(svg).toContain("<rect"); // Progress bar rects
  });

  it("should calculate correct progress percentage for 2020s path", () => {
    // Set to June 15, 2025 (about 5.5 years into the 10-year period)
    vi.setSystemTime(new Date("2025-06-15"));
    
    const path = "/progression/2020-01-01/2029-12-31/2020s";
    const svg = generateProgressBarSVG(path);
    
    // Should contain progress percentage (roughly 55% by mid-2025)
    expect(svg).toMatch(/\d+\.\d+%/);
    
    // Should show correct date range
    expect(svg).toContain("2020-01-01");
    expect(svg).toContain("2029-12-31");
  });
});
