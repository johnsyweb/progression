export interface DateRange {
  start: Date;
  end: Date;
}

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isDateOnlyString(value: string): boolean {
  return DATE_ONLY_PATTERN.test(value);
}

function toLocalEndOfDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999
  );
}

export function getBasePath(): string {
  // Get base path from <base> tag or default to "/"
  // In Node.js/test environment, document might not exist
  if (typeof document === "undefined") {
    return "/";
  }
  const baseTag = document.querySelector("base");
  if (baseTag && baseTag.href) {
    try {
      const baseUrl = new URL(baseTag.href);
      return baseUrl.pathname.endsWith("/")
        ? baseUrl.pathname.slice(0, -1)
        : baseUrl.pathname;
    } catch {
      return "/";
    }
  }
  return "/";
}

export function stripBasePath(path: string, basePath: string): string {
  if (basePath === "/") {
    return path;
  }
  if (path.startsWith(basePath)) {
    return path.slice(basePath.length) || "/";
  }
  return path;
}

export function parseDateFromPath(path: string): DateRange | null {
  const basePath = getBasePath();
  const strippedPath = stripBasePath(path, basePath);
  const parts = strippedPath.split("/").filter((part) => part.length > 0);

  if (parts.length < 2) {
    return null;
  }

  const date1Str = parts[0];
  const date2Str = parts[1];

  const date1 = parseDate(date1Str);
  const date2 = parseDate(date2Str);

  if (!date1 || !date2) {
    return null;
  }

  const firstDateIsEarlier = date1 < date2;
  const start = firstDateIsEarlier ? date1 : date2;
  const end = firstDateIsEarlier ? date2 : date1;
  const endInput = firstDateIsEarlier ? date2Str : date1Str;

  return {
    start,
    end: isDateOnlyString(endInput) ? toLocalEndOfDay(end) : end,
  };
}

export function parseTitleFromPath(path: string): string {
  const basePath = getBasePath();
  const strippedPath = stripBasePath(path, basePath);
  const parts = strippedPath.split("/").filter((part) => part.length > 0);

  if (parts.length >= 3) {
    return decodeURIComponent(parts.slice(2).join("/"));
  }

  return "Progress";
}

export function parseDate(dateStr: string): Date | null {
  if (isDateOnlyString(dateStr)) {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    return isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return null;
  }
  return date;
}

export function calculateProgress(
  start: Date,
  end: Date,
  current: Date
): number | null {
  if (current < start || current > end) {
    return null;
  }

  const total = end.getTime() - start.getTime();
  const elapsed = current.getTime() - start.getTime();

  const percentage = (elapsed / total) * 100;

  return Math.max(0, Math.min(100, percentage));
}

export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function formatDateLong(date: Date): string {
  const weekday = date.toLocaleDateString("en-AU", { weekday: "long" });
  const rest = date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `${weekday}, ${rest}`;
}
