import { describe, it, expect } from "vitest";
import { calculateDaysBetween, generateStatusText } from "./progressStatus";

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
