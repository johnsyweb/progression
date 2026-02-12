export function calculateDaysBetween(start: Date, end: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((end.getTime() - start.getTime()) / msPerDay);
}

export function generateStatusText(data: {
  percentage: number | null;
  start: Date;
  end: Date;
  current: Date;
}): string {
  if (data.percentage !== null) {
    const totalDays = calculateDaysBetween(data.start, data.end);
    const elapsedDays = calculateDaysBetween(data.start, data.current);
    const remainingDays = totalDays - elapsedDays;
    return `${data.percentage.toFixed(1)}% complete • ${elapsedDays} days elapsed • ${remainingDays} days remaining`;
  } else {
    if (data.current < data.start) {
      const daysUntilStart = calculateDaysBetween(data.current, data.start);
      return `Starting in ${daysUntilStart} day${daysUntilStart !== 1 ? "s" : ""}`;
    } else {
      const daysSinceEnd = calculateDaysBetween(data.end, data.current);
      return `Completed ${daysSinceEnd} day${daysSinceEnd !== 1 ? "s" : ""} ago`;
    }
  }
}
