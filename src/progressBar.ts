import {
  parseDateFromPath,
  calculateProgress,
  parseTitleFromPath,
} from "./utils/dateParser";

export interface ProgressBarData {
  start: Date;
  end: Date;
  current: Date;
  percentage: number | null;
  title: string;
}

export function getProgressBarData(path: string): ProgressBarData {
  const dateRange = parseDateFromPath(path);

  // If no valid date range, default to current year
  if (!dateRange) {
    const current = new Date();
    const currentYear = current.getFullYear();
    const start = new Date(currentYear, 0, 1); // January 1st
    const end = new Date(currentYear, 11, 31, 23, 59, 59, 999); // December 31st

    return {
      start,
      end,
      current,
      percentage: calculateProgress(start, end, current),
      title: currentYear.toString(),
    };
  }

  const current = new Date();
  const percentage = calculateProgress(dateRange.start, dateRange.end, current);
  const title = parseTitleFromPath(path);

  return {
    start: dateRange.start,
    end: dateRange.end,
    current,
    percentage,
    title,
  };
}
