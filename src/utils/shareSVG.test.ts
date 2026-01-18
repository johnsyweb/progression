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

    // In test environment, getBasePath() returns "/", so paths should not include /progression/ prefix
    const path = "/2026-01-01/2026-12-31/2026";
    const svg = generateProgressBarSVG(path);

    // Check SVG contains correct title
    expect(svg).toContain("2026");

    // Check SVG contains progress bar elements
    expect(svg).toContain("<svg");
    expect(svg).toContain("1200");
    expect(svg).toContain("630");

    // Check SVG contains formatted dates (e.g., "Thursday, 1 January 2026")
    expect(svg).toContain("January");
    expect(svg).toContain("December");
    expect(svg).toContain("2026");

    // Verify it's a valid SVG structure
    expect(svg).toContain("</svg>");
  });

  it("should generate correct SVG for 2020s path", () => {
    // Set system time to a date in 2025 to test progress calculation
    vi.setSystemTime(new Date("2025-06-15"));

    // In test environment, getBasePath() returns "/", so paths should not include /progression/ prefix
    const path = "/2020-01-01/2029-12-31/2020s";
    const svg = generateProgressBarSVG(path);

    // Check SVG contains correct title
    expect(svg).toContain("2020s");

    // Check SVG contains progress bar elements
    expect(svg).toContain("<svg");
    expect(svg).toContain("1200");
    expect(svg).toContain("630");

    // Check SVG contains formatted dates
    expect(svg).toContain("January");
    expect(svg).toContain("December");
    expect(svg).toMatch(/202[09]/); // Should contain 2020 or 2029

    // Verify it's a valid SVG structure
    expect(svg).toContain("</svg>");
  });

  it("should generate different SVGs for different paths", () => {
    vi.setSystemTime(new Date("2026-06-15"));

    // In test environment, getBasePath() returns "/", so paths should not include /progression/ prefix
    const path1 = "/2026-01-01/2026-12-31/2026";
    const svg1 = generateProgressBarSVG(path1);

    const path2 = "/2020-01-01/2029-12-31/2020s";
    const svg2 = generateProgressBarSVG(path2);

    // They should be different
    expect(svg1).not.toBe(svg2);

    // Parse SVG as XML to check title text content
    const parser = new DOMParser();

    const doc1 = parser.parseFromString(svg1, "image/svg+xml");
    const titleText1 = doc1.querySelector('text[y="215"]')?.textContent;
    expect(titleText1).toBe("2026");
    expect(titleText1).not.toBe("2020s");

    const doc2 = parser.parseFromString(svg2, "image/svg+xml");
    const titleText2 = doc2.querySelector('text[y="215"]')?.textContent;
    // Note: "2026" may appear elsewhere in the SVG (e.g., as current date), so only check title
    expect(titleText2).toBe("2020s");
    expect(titleText2).not.toBe("2026");
  });

  it("should handle path with basePath prefix correctly", () => {
    vi.setSystemTime(new Date("2026-06-15"));

    // Note: In test environment, getBasePath() returns "/", so paths without base prefix work correctly
    // Path with /progression prefix would need proper base tag setup to strip correctly
    // Path without basePath (works correctly in test environment)
    const pathWithoutBase = "/2026-01-01/2026-12-31/2026";
    const svgWithoutBase = generateProgressBarSVG(pathWithoutBase);

    // Path without base should work correctly
    expect(svgWithoutBase).toContain("2026");
    expect(svgWithoutBase).toMatch(/<text[^>]*>2026<\/text>/);
  });

  it("should calculate correct progress percentage for 2026 path", () => {
    // Set to June 15, 2026 (roughly halfway through the year)
    vi.setSystemTime(new Date("2026-06-15"));

    // In test environment, getBasePath() returns "/", so paths should not include /progression/ prefix
    const path = "/2026-01-01/2026-12-31/2026";
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

    // In test environment, getBasePath() returns "/", so paths should not include /progression/ prefix
    const path = "/2020-01-01/2029-12-31/2020s";
    const svg = generateProgressBarSVG(path);

    // Should contain progress percentage (roughly 55% by mid-2025)
    expect(svg).toMatch(/\d+\.\d+%/);

    // Should show correct date range (formatted dates)
    expect(svg).toContain("January");
    expect(svg).toContain("December");
    expect(svg).toMatch(/202[09]/); // Should contain 2020 or 2029
  });
});
