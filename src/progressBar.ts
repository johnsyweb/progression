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

function isSameCalendarDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function finalizeSameDayPercentage(
  percentage: number | null,
  start: Date,
  end: Date,
  current: Date
): number | null {
  if (percentage === null) {
    return null;
  }

  if (current >= start && current <= end && isSameCalendarDay(current, end)) {
    return 100;
  }

  return percentage;
}

export function getProgressBarData(path: string): ProgressBarData {
  const dateRange = parseDateFromPath(path);

  // If no valid date range, default to current year
  if (!dateRange) {
    const current = new Date();
    const currentYear = current.getFullYear();
    const start = new Date(currentYear, 0, 1); // January 1st
    const end = new Date(currentYear, 11, 31, 23, 59, 59, 999); // December 31st
    const percentage = finalizeSameDayPercentage(
      calculateProgress(start, end, current),
      start,
      end,
      current
    );

    return {
      start,
      end,
      current,
      percentage,
      title: currentYear.toString(),
    };
  }

  const current = new Date();
  const percentage = finalizeSameDayPercentage(
    calculateProgress(dateRange.start, dateRange.end, current),
    dateRange.start,
    dateRange.end,
    current
  );
  const title = parseTitleFromPath(path);

  return {
    start: dateRange.start,
    end: dateRange.end,
    current,
    percentage,
    title,
  };
}
