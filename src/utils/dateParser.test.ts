import { describe, it, expect } from "vitest";
import {
  parseDateFromPath,
  parseDate,
  calculateProgress,
  formatDate,
  formatDateLong,
  parseTitleFromPath,
} from "./dateParser";

describe("parseDate", () => {
  it("should parse a valid ISO date string", () => {
    const date = parseDate("2024-01-01");
    expect(date).not.toBeNull();
    expect(date?.getFullYear()).toBe(2024);
    expect(date?.getMonth()).toBe(0);
    expect(date?.getDate()).toBe(1);
  });

  it("should return null for invalid date string", () => {
    const date = parseDate("invalid");
    expect(date).toBeNull();
  });

  it("should parse dates with time component", () => {
    const date = parseDate("2024-01-01T12:00:00Z");
    expect(date).not.toBeNull();
  });
});

describe("parseDateFromPath", () => {
  it("should parse two dates from path", () => {
    const result = parseDateFromPath("/2024-01-01/2024-12-31");
    expect(result).not.toBeNull();
    expect(result?.start.getFullYear()).toBe(2024);
    expect(result?.start.getMonth()).toBe(0);
    expect(result?.end.getFullYear()).toBe(2024);
    expect(result?.end.getMonth()).toBe(11);
  });

  it("should order dates correctly (earlier first)", () => {
    const result = parseDateFromPath("/2024-12-31/2024-01-01");
    expect(result).not.toBeNull();
    expect(result?.start.getMonth()).toBe(0);
    expect(result?.end.getMonth()).toBe(11);
  });

  it("should return null for invalid path", () => {
    const result = parseDateFromPath("/invalid");
    expect(result).toBeNull();
  });

  it("should return null for path with invalid dates", () => {
    const result = parseDateFromPath("/invalid/also-invalid");
    expect(result).toBeNull();
  });

  it("should handle empty path", () => {
    const result = parseDateFromPath("");
    expect(result).toBeNull();
  });
});

describe("calculateProgress", () => {
  it("should calculate progress correctly", () => {
    const start = new Date("2024-01-01");
    const end = new Date("2024-12-31");
    const current = new Date("2024-06-30");

    const progress = calculateProgress(start, end, current);
    expect(progress).toBeCloseTo(50, 0);
  });

  it("should return 0% when current equals start", () => {
    const start = new Date("2024-01-01");
    const end = new Date("2024-12-31");
    const current = new Date("2024-01-01");

    const progress = calculateProgress(start, end, current);
    expect(progress).toBe(0);
  });

  it("should return 100% when current equals end", () => {
    const start = new Date("2024-01-01");
    const end = new Date("2024-12-31");
    const current = new Date("2024-12-31");

    const progress = calculateProgress(start, end, current);
    expect(progress).toBe(100);
  });

  it("should return null when current is before start", () => {
    const start = new Date("2024-01-01");
    const end = new Date("2024-12-31");
    const current = new Date("2023-12-31");

    const progress = calculateProgress(start, end, current);
    expect(progress).toBeNull();
  });

  it("should return null when current is after end", () => {
    const start = new Date("2024-01-01");
    const end = new Date("2024-12-31");
    const current = new Date("2025-01-01");

    const progress = calculateProgress(start, end, current);
    expect(progress).toBeNull();
  });

  it("should clamp to 0% minimum", () => {
    const start = new Date("2024-01-01");
    const end = new Date("2024-12-31");
    const current = new Date("2024-01-01T00:00:00.001Z");

    const progress = calculateProgress(start, end, current);
    expect(progress).toBeGreaterThanOrEqual(0);
  });

  it("should clamp to 100% maximum", () => {
    const start = new Date("2024-01-01");
    const end = new Date("2024-12-31T23:59:59.999Z");
    const current = new Date("2024-12-31T23:59:59.999Z");

    const progress = calculateProgress(start, end, current);
    expect(progress).toBeLessThanOrEqual(100);
  });
});

describe("formatDate", () => {
  it("should format date as YYYY-MM-DD", () => {
    const date = new Date("2024-01-01");
    const formatted = formatDate(date);
    expect(formatted).toBe("2024-01-01");
  });
});

describe("formatDateLong", () => {
  it("should format date in Australian English long format", () => {
    const date = new Date("2025-11-13");
    const formatted = formatDateLong(date);
    expect(formatted).toMatch(/Thursday.*13.*November.*2025/);
  });
});

describe("parseTitleFromPath", () => {
  it("should return default title when no title in path", () => {
    const title = parseTitleFromPath("/2024-01-01/2024-12-31");
    expect(title).toBe("Progress");
  });

  it("should parse title from path", () => {
    const title = parseTitleFromPath(
      "/2024-01-01/2024-12-31/Pete's Career break"
    );
    expect(title).toBe("Pete's Career break");
  });

  it("should decode URL-encoded title", () => {
    const title = parseTitleFromPath(
      "/2024-01-01/2024-12-31/Pete%27s%20Career%20break"
    );
    expect(title).toBe("Pete's Career break");
  });

  it("should handle title with multiple path segments", () => {
    const title = parseTitleFromPath("/2024-01-01/2024-12-31/My/Title/Here");
    expect(title).toBe("My/Title/Here");
  });
});
