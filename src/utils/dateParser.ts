export interface DateRange {
  start: Date;
  end: Date;
}

export function parseDateFromPath(path: string): DateRange | null {
  const parts = path.split("/").filter((part) => part.length > 0);

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

  const start = date1 < date2 ? date1 : date2;
  const end = date1 < date2 ? date2 : date1;

  return { start, end };
}

export function parseTitleFromPath(path: string): string {
  const parts = path.split("/").filter((part) => part.length > 0);

  if (parts.length >= 3) {
    return decodeURIComponent(parts.slice(2).join("/"));
  }

  return "Progress";
}

export function parseDate(dateStr: string): Date | null {
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
