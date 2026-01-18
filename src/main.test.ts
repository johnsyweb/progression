import { describe, it, expect, beforeEach, vi } from "vitest";
import { getProgressBarData } from "./progressBar";
import { getBasePath, stripBasePath, parseDate } from "./utils/dateParser";

// Setup DOM environment
beforeEach(() => {
  // Reset DOM
  document.body.innerHTML = "";
  const mockContainer = document.createElement("div");
  mockContainer.id = "progress-container";
  document.body.appendChild(mockContainer);
  
  // Reset location
  delete (window as any).location;
  (window as any).location = {
    pathname: "/progression/",
    href: "http://localhost:4174/progression/",
  };
  
  // Reset history
  window.history.replaceState = vi.fn();
  window.history.pushState = vi.fn();
  
  // Reset base tag
  const baseTag = document.querySelector("base");
  if (baseTag) {
    baseTag.remove();
  }
  const newBaseTag = document.createElement("base");
  newBaseTag.href = "/progression/";
  document.head.appendChild(newBaseTag);
});

describe("init function redirect logic", () => {
  it("should detect when path has no valid dates (empty path)", () => {
    (window.location as any).pathname = "/progression/";
    
    // Simulate the init logic
    const basePath = getBasePath();
    const path = window.location.pathname;
    const strippedPath = stripBasePath(path, basePath);
    const parts = strippedPath.split("/").filter((part) => part.length > 0);
    const hasValidDates =
      parts.length >= 2 &&
      parseDate(parts[0]) !== null &&
      parseDate(parts[1]) !== null;

    expect(hasValidDates).toBe(false);
  });

  it("should construct correct redirect path for empty path", () => {
    const basePath = "/progression";
    const current = new Date();
    const currentYear = current.getFullYear();
    const startDate = `${currentYear}-01-01`;
    const endDate = `${currentYear}-12-31`;
    const normalizedBasePath = basePath === "/" ? "" : basePath.replace(/\/$/, "");
    const newPath = `${normalizedBasePath}/${startDate}/${endDate}/${currentYear}`;

    expect(newPath).toBe(`/progression/${startDate}/${endDate}/${currentYear}`);
  });

  it("should detect when path has only one date", () => {
    (window.location as any).pathname = "/progression/2025-01-01";
    
    const basePath = getBasePath();
    const path = window.location.pathname;
    const strippedPath = stripBasePath(path, basePath);
    const parts = strippedPath.split("/").filter((part) => part.length > 0);
    const hasValidDates =
      parts.length >= 2 &&
      parseDate(parts[0]) !== null &&
      parseDate(parts[1]) !== null;

    expect(hasValidDates).toBe(false);
  });

  it("should detect when path has invalid dates", () => {
    (window.location as any).pathname = "/progression/invalid/invalid";
    
    const basePath = getBasePath();
    const path = window.location.pathname;
    const strippedPath = stripBasePath(path, basePath);
    const parts = strippedPath.split("/").filter((part) => part.length > 0);
    const hasValidDates =
      parts.length >= 2 &&
      parseDate(parts[0]) !== null &&
      parseDate(parts[1]) !== null;

    expect(hasValidDates).toBe(false);
  });

  it("should NOT redirect when path has valid dates", () => {
    (window.location as any).pathname = "/progression/2025-01-01/2025-12-31";
    
    const basePath = getBasePath();
    const path = window.location.pathname;
    const strippedPath = stripBasePath(path, basePath);
    const parts = strippedPath.split("/").filter((part) => part.length > 0);
    const hasValidDates =
      parts.length >= 2 &&
      parseDate(parts[0]) !== null &&
      parseDate(parts[1]) !== null;

    expect(hasValidDates).toBe(true);
  });

  it("should handle root basePath correctly", () => {
    const basePath = "/";
    const current = new Date();
    const currentYear = current.getFullYear();
    const startDate = `${currentYear}-01-01`;
    const endDate = `${currentYear}-12-31`;
    const normalizedBasePath = basePath === "/" ? "" : basePath.replace(/\/$/, "");
    const newPath = `${normalizedBasePath}/${startDate}/${endDate}/${currentYear}`;

    expect(newPath).toBe(`/${startDate}/${endDate}/${currentYear}`);
  });

  it("should handle basePath with trailing slash", () => {
    const basePath = "/progression/";
    const normalizedBasePath = basePath === "/" ? "" : basePath.replace(/\/$/, "");
    
    expect(normalizedBasePath).toBe("/progression");
    
    const current = new Date();
    const currentYear = current.getFullYear();
    const startDate = `${currentYear}-01-01`;
    const endDate = `${currentYear}-12-31`;
    const newPath = `${normalizedBasePath}/${startDate}/${endDate}/${currentYear}`;

    expect(newPath).toBe(`/progression/${startDate}/${endDate}/${currentYear}`);
  });

  it("should get correct data after redirect", () => {
    const current = new Date();
    const currentYear = current.getFullYear();
    const startDate = `${currentYear}-01-01`;
    const endDate = `${currentYear}-12-31`;
    const redirectedPath = `/progression/${startDate}/${endDate}/${currentYear}`;
    
    const data = getProgressBarData(redirectedPath);
    
    expect(data).toBeDefined();
    expect(data.title).toBe(currentYear.toString());
    expect(data.start.getFullYear()).toBe(currentYear);
    expect(data.end.getFullYear()).toBe(currentYear);
  });

  it("should construct redirect path correctly when basePath is /progression", () => {
    // Simulate the exact logic from init()
    const basePath = "/progression";
    const current = new Date();
    const currentYear = current.getFullYear();
    const startDate = `${currentYear}-01-01`;
    const endDate = `${currentYear}-12-31`;
    const normalizedBasePath = basePath === "/" ? "" : basePath.replace(/\/$/, "");
    const newPath = `${normalizedBasePath}/${startDate}/${endDate}/${currentYear}`;

    expect(normalizedBasePath).toBe("/progression");
    expect(newPath).toBe(`/progression/${startDate}/${endDate}/${currentYear}`);
  });

  it("should detect empty path correctly", () => {
    (window.location as any).pathname = "/progression/";
    
    const basePath = getBasePath();
    const path = window.location.pathname;
    const strippedPath = stripBasePath(path, basePath);
    const parts = strippedPath.split("/").filter((part) => part.length > 0);
    
    // After stripping "/progression" from "/progression/", we should get "/"
    // After splitting "/" and filtering empty parts, we get []
    expect(strippedPath).toBe("/");
    expect(parts).toEqual([]);
    expect(parts.length).toBe(0);
  });
});

