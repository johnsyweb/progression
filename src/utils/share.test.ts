import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { generateShareText, shareProgress } from "./share";
import type { ProgressBarData } from "../progressBar";

vi.mock("html2canvas", () => ({
  default: vi.fn().mockResolvedValue({
    toBlob: (cb: (b: Blob | null) => void) => {
      cb(new Blob(["png"], { type: "image/png" }));
    },
  }),
}));

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

  let progressContainer: HTMLElement | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();

    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    global.alert = vi.fn();

    Object.defineProperty(window, "location", {
      value: {
        origin: "https://example.com",
        pathname: "/test",
      },
      writable: true,
    });

    document.querySelector = vi.fn(() => null);

    progressContainer = document.createElement("div");
    progressContainer.id = "progress-container";
    document.body.appendChild(progressContainer);
    vi.spyOn(document, "getElementById").mockImplementation((id: string) => {
      if (id === "progress-container") {
        return progressContainer;
      }
      return document.createElement("div"); // fallback for other IDs
    });
  });

  afterEach(() => {
    if (progressContainer && progressContainer.parentNode) {
      progressContainer.parentNode.removeChild(progressContainer);
    }
    vi.restoreAllMocks();
    delete (navigator as { share?: unknown }).share;
    delete (navigator as { canShare?: unknown }).canShare;
  });

  it("should share with PNG image when Web Share API supports files", async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined);
    const mockCanShare = vi.fn().mockReturnValue(true);

    const nav = global.navigator as Navigator & {
      share?: (data: ShareData) => Promise<void>;
      canShare?: (data?: ShareData) => boolean;
    };
    nav.share = mockShare;
    nav.canShare = mockCanShare;

    await shareProgress(mockData, mockUrl);

    expect(mockShare).toHaveBeenCalledWith(
      expect.objectContaining({
        title: mockData.title,
        text: expect.stringContaining(mockData.title),
        url: mockUrl,
      })
    );
    const shareArg = mockShare.mock.calls[0][0];
    if (shareArg.files && shareArg.files.length > 0) {
      expect(shareArg.files[0].type).toBe("image/png");
      expect(shareArg.files[0].name).toMatch(
        /^progress-2024-01-01-2024-12-31.*\.png$/
      );
    }
  });

  it("should fallback to sharing without image when file sharing is not supported", async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined);
    const mockCanShare = vi.fn().mockReturnValue(false);

    const nav = global.navigator as Navigator & {
      share?: (data: ShareData) => Promise<void>;
      canShare?: (data?: ShareData) => boolean;
    };
    nav.share = mockShare;
    nav.canShare = mockCanShare;

    await shareProgress(mockData, mockUrl);

    expect(mockShare).toHaveBeenCalledWith(
      expect.objectContaining({
        title: mockData.title,
        text: expect.stringContaining(mockData.title),
        url: mockUrl,
      })
    );
    expect(mockShare.mock.calls[0][0]).not.toHaveProperty("files");
    expect(mockShare).toHaveBeenCalledTimes(1);
  });

  it("should fallback to sharing without image when progress-container is missing", async () => {
    if (progressContainer?.parentNode) {
      progressContainer.parentNode.removeChild(progressContainer);
    }
    progressContainer = null;

    const mockShare = vi.fn().mockResolvedValue(undefined);
    const mockCanShare = vi.fn().mockReturnValue(true);

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

    await shareProgress(mockData, mockUrl);

    expect(mockShare).toHaveBeenCalledWith(
      expect.objectContaining({
        title: mockData.title,
        text: expect.stringContaining(mockData.title),
        url: mockUrl,
      })
    );
    expect(mockShare.mock.calls[0][0]).not.toHaveProperty("files");
  });

  it("should fallback to sharing without image when html2canvas fails", async () => {
    const html2canvas = (await import("html2canvas")).default;
    vi.mocked(html2canvas).mockRejectedValueOnce(new Error("canvas failed"));

    const mockShare = vi.fn().mockResolvedValue(undefined);
    const mockCanShare = vi.fn().mockReturnValue(true);

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

    await shareProgress(mockData, mockUrl);

    expect(mockShare).toHaveBeenCalledWith(
      expect.objectContaining({
        title: mockData.title,
        text: expect.stringContaining(mockData.title),
        url: mockUrl,
      })
    );
    expect(mockShare.mock.calls[0][0]).not.toHaveProperty("files");
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
});
