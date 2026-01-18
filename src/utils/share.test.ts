import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { generateShareText, shareProgress } from "./share";
import type { ProgressBarData } from "../progressBar";

describe("generateShareText", () => {
  it("should generate share text with percentage", () => {
    const data: ProgressBarData = {
      title: "Test Progress",
      start: new Date("2024-01-01"),
      end: new Date("2024-12-31"),
      current: new Date("2024-06-15"),
      percentage: 50.0,
    };

    const text = generateShareText(data);
    expect(text).toContain("Test Progress");
    expect(text).toContain("50.00% complete");
    expect(text).toContain("2024");
  });

  it("should generate share text when current is before start", () => {
    const data: ProgressBarData = {
      title: "Future Project",
      start: new Date("2025-01-01"),
      end: new Date("2025-12-31"),
      current: new Date("2024-12-31"),
      percentage: null,
    };

    const text = generateShareText(data);
    expect(text).toContain("Future Project");
    expect(text).toContain("Starting");
    expect(text).toContain("ending");
  });

  it("should generate share text when current is after end", () => {
    const data: ProgressBarData = {
      title: "Completed Project",
      start: new Date("2024-01-01"),
      end: new Date("2024-12-31"),
      current: new Date("2025-01-01"),
      percentage: null,
    };

    const text = generateShareText(data);
    expect(text).toContain("Completed Project");
    expect(text).toContain("Completed");
    expect(text).toContain("started");
  });

  it("should format percentage with two decimal places", () => {
    const data: ProgressBarData = {
      title: "Test",
      start: new Date("2024-01-01"),
      end: new Date("2024-12-31"),
      current: new Date("2024-06-15"),
      percentage: 33.333333,
    };

    const text = generateShareText(data);
    expect(text).toContain("33.33% complete");
  });

  it("should include both start and end dates in share text with percentage", () => {
    const data: ProgressBarData = {
      title: "Test",
      start: new Date("2024-01-01"),
      end: new Date("2024-12-31"),
      current: new Date("2024-06-15"),
      percentage: 50.0,
    };

    const text = generateShareText(data);
    // Check for key date components (formatDateLong uses en-AU format)
    expect(text).toMatch(/Monday.*1.*January.*2024/);
    expect(text).toMatch(/Tuesday.*31.*December.*2024/);
  });
});

describe("shareProgress", () => {
  const mockData: ProgressBarData = {
    title: "Test Progress",
    start: new Date("2024-01-01"),
    end: new Date("2024-12-31"),
    current: new Date("2024-06-15"),
    percentage: 50.0,
  };

  const mockUrl = "https://example.com/test";

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    vi.restoreAllMocks();

    // Mock console methods to prevent test pollution
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    // Mock alert
    global.alert = vi.fn();

    // Mock window.location
    Object.defineProperty(window, "location", {
      value: {
        origin: "https://example.com",
        pathname: "/test",
      },
      writable: true,
    });

    // Mock document.querySelector for base tag
    document.querySelector = vi.fn(() => null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should share with image when Web Share API supports files", async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined);
    const mockCanShare = vi.fn().mockReturnValue(true);
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: vi
        .fn()
        .mockResolvedValue(new Blob([""], { type: "image/svg+xml" })),
    });

    Object.defineProperty(navigator, "share", {
      value: mockShare,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, "canShare", {
      value: mockCanShare,
      writable: true,
      configurable: true,
    });
    global.fetch = mockFetch;

    await shareProgress(mockData, mockUrl);

    expect(mockFetch).toHaveBeenCalled();
    expect(mockCanShare).toHaveBeenCalled();
    expect(mockShare).toHaveBeenCalledWith(
      expect.objectContaining({
        title: mockData.title,
        text: expect.stringContaining(mockData.title),
        url: mockUrl,
        files: expect.arrayContaining([expect.any(File)]),
      })
    );
  });

  it("should fallback to sharing without image when file sharing is not supported", async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined);
    const mockCanShare = vi.fn().mockReturnValue(false);
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: vi
        .fn()
        .mockResolvedValue(new Blob([""], { type: "image/svg+xml" })),
    });

    Object.defineProperty(navigator, "share", {
      value: mockShare,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, "canShare", {
      value: mockCanShare,
      writable: true,
      configurable: true,
    });
    global.fetch = mockFetch;

    await shareProgress(mockData, mockUrl);

    expect(mockFetch).toHaveBeenCalled();
    expect(mockCanShare).toHaveBeenCalled();
    expect(mockShare).toHaveBeenCalledWith(
      expect.objectContaining({
        title: mockData.title,
        text: expect.stringContaining(mockData.title),
        url: mockUrl,
      })
    );
    expect(mockShare).toHaveBeenCalledTimes(1);
  });

  it("should fallback to sharing without image when image fetch fails", async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined);
    const mockCanShare = vi.fn().mockReturnValue(true);
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });

    Object.defineProperty(navigator, "share", {
      value: mockShare,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, "canShare", {
      value: mockCanShare,
      writable: true,
      configurable: true,
    });
    global.fetch = mockFetch;

    await shareProgress(mockData, mockUrl);

    expect(mockFetch).toHaveBeenCalled();
    expect(mockShare).toHaveBeenCalledWith(
      expect.objectContaining({
        title: mockData.title,
        text: expect.stringContaining(mockData.title),
        url: mockUrl,
      })
    );
  });

  it("should fallback to sharing without image when image fetch throws error", async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined);
    const mockCanShare = vi.fn().mockReturnValue(true);
    const mockFetch = vi.fn().mockRejectedValue(new Error("Network error"));

    Object.defineProperty(navigator, "share", {
      value: mockShare,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, "canShare", {
      value: mockCanShare,
      writable: true,
      configurable: true,
    });
    global.fetch = mockFetch;

    await shareProgress(mockData, mockUrl);

    expect(mockFetch).toHaveBeenCalled();
    expect(mockShare).toHaveBeenCalledWith(
      expect.objectContaining({
        title: mockData.title,
        text: expect.stringContaining(mockData.title),
        url: mockUrl,
      })
    );
  });

  it("should fallback to clipboard when Web Share API throws non-AbortError", async () => {
    const mockShare = vi.fn().mockRejectedValue(new Error("Share failed"));
    const mockClipboardWriteText = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(navigator, "share", {
      value: mockShare,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: mockClipboardWriteText,
      },
      writable: true,
      configurable: true,
    });

    await shareProgress(mockData, mockUrl);

    expect(mockShare).toHaveBeenCalled();
    expect(mockClipboardWriteText).toHaveBeenCalledWith(
      expect.stringContaining(mockData.title)
    );
    expect(mockClipboardWriteText).toHaveBeenCalledWith(
      expect.stringContaining(mockUrl)
    );
    expect(global.alert).toHaveBeenCalledWith("Link copied to clipboard!");
  });

  it("should not fallback to clipboard when Web Share API throws AbortError", async () => {
    const abortError = new Error("Share aborted");
    abortError.name = "AbortError";
    const mockShare = vi.fn().mockRejectedValue(abortError);
    const mockClipboardWriteText = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(navigator, "share", {
      value: mockShare,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: mockClipboardWriteText,
      },
      writable: true,
      configurable: true,
    });

    await shareProgress(mockData, mockUrl);

    expect(mockShare).toHaveBeenCalled();
    expect(mockClipboardWriteText).not.toHaveBeenCalled();
    expect(global.alert).not.toHaveBeenCalled();
  });

  it("should use clipboard when Web Share API is not available", async () => {
    const mockClipboardWriteText = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(navigator, "share", {
      value: undefined,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: mockClipboardWriteText,
      },
      writable: true,
      configurable: true,
    });

    await shareProgress(mockData, mockUrl);

    expect(mockClipboardWriteText).toHaveBeenCalledWith(
      expect.stringContaining(mockData.title)
    );
    expect(mockClipboardWriteText).toHaveBeenCalledWith(
      expect.stringContaining(mockUrl)
    );
    expect(global.alert).toHaveBeenCalledWith("Link copied to clipboard!");
  });

  it("should alert when neither Web Share API nor clipboard is available", async () => {
    Object.defineProperty(navigator, "share", {
      value: undefined,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    await shareProgress(mockData, mockUrl);

    expect(global.alert).toHaveBeenCalledWith(
      "Sharing not available in this browser"
    );
  });

  it("should handle clipboard writeText not being a function", async () => {
    Object.defineProperty(navigator, "share", {
      value: undefined,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, "clipboard", {
      value: {},
      writable: true,
      configurable: true,
    });

    await shareProgress(mockData, mockUrl);

    expect(global.alert).toHaveBeenCalledWith(
      "Sharing not available in this browser"
    );
  });

  it("should use base tag href when available for image URL", async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined);
    const mockCanShare = vi.fn().mockReturnValue(true);
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: vi
        .fn()
        .mockResolvedValue(new Blob([""], { type: "image/svg+xml" })),
    });
    const mockBaseElement = {
      href: "https://example.com/base/",
    };

    document.querySelector = vi.fn((selector: string) => {
      if (selector === "base") {
        return mockBaseElement as HTMLBaseElement;
      }
      return null;
    });

    Object.defineProperty(navigator, "share", {
      value: mockShare,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, "canShare", {
      value: mockCanShare,
      writable: true,
      configurable: true,
    });
    global.fetch = mockFetch;

    await shareProgress(mockData, mockUrl);

    expect(mockFetch).toHaveBeenCalled();
    expect(mockFetch.mock.calls[0][0]).toContain("og-image.svg");
    expect(mockFetch.mock.calls[0][0]).toContain("path=");
  });

  it("should encode pathname correctly in image URL", async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined);
    const mockCanShare = vi.fn().mockReturnValue(true);
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: vi
        .fn()
        .mockResolvedValue(new Blob([""], { type: "image/svg+xml" })),
    });

    window.location.pathname = "/2024-01-01/2024-12-31/My Project";

    Object.defineProperty(navigator, "share", {
      value: mockShare,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, "canShare", {
      value: mockCanShare,
      writable: true,
      configurable: true,
    });
    global.fetch = mockFetch;

    await shareProgress(mockData, mockUrl);

    expect(mockFetch).toHaveBeenCalled();
    const fetchUrl = mockFetch.mock.calls[0][0] as string;
    expect(fetchUrl).toContain(encodeURIComponent(window.location.pathname));
  });
});
