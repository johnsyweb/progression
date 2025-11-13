import { describe, it, expect, beforeEach, vi } from "vitest";
import { getProgressBarData, renderProgressBar } from "./progressBar";

describe("getProgressBarData", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("should return null for invalid path", () => {
    const result = getProgressBarData("/invalid");
    expect(result).toBeNull();
  });

  it("should return progress data for valid path", () => {
    vi.setSystemTime(new Date("2024-06-15"));
    const result = getProgressBarData("/2024-01-01/2024-12-31");
    expect(result).not.toBeNull();
    expect(result?.start.getFullYear()).toBe(2024);
    expect(result?.end.getFullYear()).toBe(2024);
    expect(result?.current.getFullYear()).toBe(2024);
    expect(result?.title).toBe("Progress");
  });

  it("should parse title from path", () => {
    vi.setSystemTime(new Date("2024-06-15"));
    const result = getProgressBarData(
      "/2024-01-01/2024-12-31/Pete's Career break"
    );
    expect(result).not.toBeNull();
    expect(result?.title).toBe("Pete's Career break");
  });

  it("should calculate percentage when current date is in range", () => {
    vi.setSystemTime(new Date("2024-06-30"));
    const result = getProgressBarData("/2024-01-01/2024-12-31");
    expect(result?.percentage).not.toBeNull();
    expect(result?.percentage).toBeGreaterThan(0);
    expect(result?.percentage).toBeLessThan(100);
  });

  it("should return null percentage when current date is before range", () => {
    vi.setSystemTime(new Date("2023-12-31"));
    const result = getProgressBarData("/2024-01-01/2024-12-31");
    expect(result?.percentage).toBeNull();
  });

  it("should return null percentage when current date is after range", () => {
    vi.setSystemTime(new Date("2025-01-01"));
    const result = getProgressBarData("/2024-01-01/2024-12-31");
    expect(result?.percentage).toBeNull();
  });
});

describe("renderProgressBar", () => {
  it("should render progress bar with percentage", () => {
    const data = {
      start: new Date("2024-01-01"),
      end: new Date("2024-12-31"),
      current: new Date("2024-06-15"),
      percentage: 50.0,
      title: "Test Progress",
    };

    const html = renderProgressBar(data);
    expect(html).toContain("progress-container");
    expect(html).toContain("progress-bar");
    expect(html).toContain("progress-fill");
    expect(html).toContain("progress-indicator");
    expect(html).toContain("progress-percentage");
    expect(html).toContain("50.00%");
    expect(html).toContain("width: 50%");
    expect(html).toContain("left: 50%");
    expect(html).toContain("progress-dates");
  });

  it("should render progress bar without percentage when outside range", () => {
    const data = {
      start: new Date("2024-01-01"),
      end: new Date("2024-12-31"),
      current: new Date("2025-01-01"),
      percentage: null,
      title: "Test Progress",
    };

    const html = renderProgressBar(data);
    expect(html).toContain("progress-container");
    expect(html).toContain("progress-bar");
    expect(html).not.toContain("progress-fill");
    expect(html).not.toContain("progress-indicator");
    expect(html).not.toContain("progress-percentage");
    expect(html).toContain("progress-dates");
  });

  it("should format dates correctly", () => {
    const data = {
      start: new Date("2024-01-01"),
      end: new Date("2024-12-31"),
      current: new Date("2024-06-15"),
      percentage: 50.0,
      title: "Test Progress",
    };

    const html = renderProgressBar(data);
    expect(html).toContain("progress-dates");
    expect(html).toContain("progress-date-start");
    expect(html).toContain("progress-date-current");
    expect(html).toContain("progress-date-end");
  });
});
