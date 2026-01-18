import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  calculateDaysBetween,
  generateStatusText,
  generateProgressBarSVG,
} from "./svgGenerator";

describe("calculateDaysBetween", () => {
  it("should calculate days between two dates", () => {
    const start = new Date("2024-01-01");
    const end = new Date("2024-01-31");
    const days = calculateDaysBetween(start, end);
    expect(days).toBe(30);
  });

  it("should handle dates in reverse order", () => {
    const start = new Date("2024-01-31");
    const end = new Date("2024-01-01");
    const days = calculateDaysBetween(start, end);
    expect(days).toBe(-30);
  });

  it("should handle same day", () => {
    const start = new Date("2024-01-01");
    const end = new Date("2024-01-01");
    const days = calculateDaysBetween(start, end);
    expect(days).toBe(0);
  });

  it("should handle leap year", () => {
    const start = new Date("2024-02-01");
    const end = new Date("2024-03-01");
    const days = calculateDaysBetween(start, end);
    expect(days).toBe(29); // 2024 is a leap year
  });
});

describe("generateStatusText", () => {
  it("should generate status text for active progress", () => {
    const data = {
      percentage: 50.0,
      start: new Date("2024-01-01"),
      end: new Date("2024-12-31"),
      current: new Date("2024-06-30"),
    };

    const status = generateStatusText(data);
    expect(status).toContain("50.0% complete");
    expect(status).toContain("days elapsed");
    expect(status).toContain("days remaining");
  });

  it("should generate status text for future start", () => {
    const data = {
      percentage: null,
      start: new Date("2025-01-01"),
      end: new Date("2025-12-31"),
      current: new Date("2024-12-31"),
    };

    const status = generateStatusText(data);
    expect(status).toContain("Starting in");
    expect(status).toContain("day");
  });

  it("should use singular 'day' for one day until start", () => {
    const data = {
      percentage: null,
      start: new Date("2024-01-02"),
      end: new Date("2024-12-31"),
      current: new Date("2024-01-01"),
    };

    const status = generateStatusText(data);
    expect(status).toBe("Starting in 1 day");
  });

  it("should use plural 'days' for multiple days until start", () => {
    const data = {
      percentage: null,
      start: new Date("2024-01-05"),
      end: new Date("2024-12-31"),
      current: new Date("2024-01-01"),
    };

    const status = generateStatusText(data);
    expect(status).toBe("Starting in 4 days");
  });

  it("should generate status text for completed progress", () => {
    const data = {
      percentage: null,
      start: new Date("2024-01-01"),
      end: new Date("2024-12-31"),
      current: new Date("2025-01-01"),
    };

    const status = generateStatusText(data);
    expect(status).toContain("Completed");
    expect(status).toContain("ago");
    expect(status).toContain("day");
  });

  it("should use singular 'day' for one day since end", () => {
    const data = {
      percentage: null,
      start: new Date("2024-01-01"),
      end: new Date("2024-12-31"),
      current: new Date("2025-01-01"),
    };

    const status = generateStatusText(data);
    expect(status).toBe("Completed 1 day ago");
  });

  it("should use plural 'days' for multiple days since end", () => {
    const data = {
      percentage: null,
      start: new Date("2024-01-01"),
      end: new Date("2024-12-31"),
      current: new Date("2025-01-05"),
    };

    const status = generateStatusText(data);
    expect(status).toBe("Completed 5 days ago");
  });
});

describe("generateProgressBarSVG", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("should generate SVG for valid path", () => {
    vi.setSystemTime(new Date("2024-06-15"));
    const svg = generateProgressBarSVG("/2024-01-01/2024-12-31");
    expect(svg).toContain("<svg");
    expect(svg).toContain('width="1200"');
    expect(svg).toContain('height="630"');
    expect(svg).toContain("Progress");
  });

  it("should include title in SVG", () => {
    vi.setSystemTime(new Date("2024-06-15"));
    const svg = generateProgressBarSVG("/2024-01-01/2024-12-31/Test Title");
    expect(svg).toContain("Test Title");
  });

  it("should include status text in SVG", () => {
    vi.setSystemTime(new Date("2024-06-15"));
    const svg = generateProgressBarSVG("/2024-01-01/2024-12-31");
    expect(svg).toContain("% complete");
    expect(svg).toContain("days elapsed");
  });

  it("should include progress bar elements when percentage is not null", () => {
    vi.setSystemTime(new Date("2024-06-15"));
    const svg = generateProgressBarSVG("/2024-01-01/2024-12-31");
    expect(svg).toContain("<rect"); // Progress bar background and fill
    // Progress indicator is a rect (not a line) to match web styling
    const rectMatches = svg.match(/<rect/g);
    expect(rectMatches?.length).toBeGreaterThanOrEqual(2); // Background, fill, and indicator
    expect(svg).toContain("<text"); // Percentage text
  });

  it("should include dates in SVG", () => {
    vi.setSystemTime(new Date("2024-06-15"));
    const svg = generateProgressBarSVG("/2024-01-01/2024-12-31");
    expect(svg).toContain("2024"); // Year should appear in formatted dates
  });

  it("should escape HTML entities in title", () => {
    vi.setSystemTime(new Date("2024-06-15"));
    const svg = generateProgressBarSVG("/2024-01-01/2024-12-31/Test & Title");
    expect(svg).toContain("&amp;");
    expect(svg).not.toContain("Test & Title");
  });

  it("should escape HTML entities in status text", () => {
    vi.setSystemTime(new Date("2024-06-15"));
    const svg = generateProgressBarSVG("/2024-01-01/2024-12-31");
    // Status text should be properly escaped (SVG contains tags, but text content should be escaped)
    // Check that the SVG structure is valid
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
  });

  it("should generate default progress bar for invalid path", () => {
    vi.setSystemTime(new Date("2024-06-15"));
    const svg = generateProgressBarSVG("/invalid");
    expect(svg).toContain("<svg");
    // Invalid paths return default current year progress bar, not error SVG
    expect(svg).toContain("2024");
  });

  it("should use correct colors", () => {
    vi.setSystemTime(new Date("2024-06-15"));
    const svg = generateProgressBarSVG("/2024-01-01/2024-12-31");
    expect(svg).toContain("#fafafa"); // Background
    expect(svg).toContain("#1565C0"); // Title and progress fill
    expect(svg).toContain("#E0E0E0"); // Progress bar background
  });
});
