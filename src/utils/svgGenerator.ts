import { getProgressBarData } from "../progressBar";
import { formatDateLong } from "./dateParser";

function escapeSvgText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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

export function generateProgressBarSVG(path: string): string {
  const data = getProgressBarData(path);

  if (!data) {
    return generateErrorSVG();
  }

  const width = 1200;
  const height = 630;
  const padding = 60;
  const barHeight = 40;
  const barWidth = width - padding * 2;
  const barY = height / 2 - 20;
  const dateY = barY + barHeight + 50;
  const titleY = barY - 80;
  const statusY = barY - 30;

  const startFormatted = formatDateLong(data.start);
  const endFormatted = formatDateLong(data.end);
  const currentFormatted = formatDateLong(data.current);

  const fillWidth =
    data.percentage !== null ? (barWidth * data.percentage) / 100 : 0;
  const indicatorX =
    data.percentage !== null
      ? padding + (barWidth * data.percentage) / 100
      : padding;
  const percentageText =
    data.percentage !== null ? `${data.percentage.toFixed(2)}%` : "";

  const statusText = generateStatusText(data);

  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect width="${width}" height="${height}" fill="#fafafa"/>`;

  svg += `<text x="${width / 2}" y="${titleY}" text-anchor="middle" font-family="Atkinson Hyperlegible, Arial, sans-serif" font-size="36" font-weight="bold" fill="#1565C0">${escapeSvgText(data.title)}</text>`;
  svg += `<text x="${width / 2}" y="${statusY}" text-anchor="middle" font-family="Atkinson Hyperlegible, Arial, sans-serif" font-size="22" fill="#757575">${escapeSvgText(statusText)}</text>`;

  svg += `<rect x="${padding}" y="${barY}" width="${barWidth}" height="${barHeight}" fill="#E0E0E0" stroke="#BBDEFB" stroke-width="2" rx="4"/>`;

  if (data.percentage !== null) {
    svg += `<rect x="${padding}" y="${barY}" width="${fillWidth}" height="${barHeight}" fill="#1565C0" rx="4"/>`;
    svg += `<line x1="${indicatorX}" y1="${barY}" x2="${indicatorX}" y2="${barY + barHeight}" stroke="#1565C0" stroke-width="4"/>`;

    svg += `<text x="${indicatorX}" y="${barY + barHeight / 2}" text-anchor="middle" dominant-baseline="middle" font-family="Atkinson Hyperlegible, Arial, sans-serif" font-size="18" font-weight="bold" fill="#212121">`;
    svg += `<tspan x="${indicatorX}" dy="0">${percentageText}</tspan>`;
    svg += `</text>`;
  }

  svg += `<text x="${padding}" y="${dateY}" font-family="Atkinson Hyperlegible, Arial, sans-serif" font-size="24" fill="#212121">${startFormatted}</text>`;

  if (data.percentage !== null) {
    svg += `<text x="${width / 2}" y="${dateY}" text-anchor="middle" font-family="Atkinson Hyperlegible, Arial, sans-serif" font-size="24" font-weight="bold" fill="#212121">${currentFormatted}</text>`;
  }

  svg += `<text x="${width - padding}" y="${dateY}" text-anchor="end" font-family="Atkinson Hyperlegible, Arial, sans-serif" font-size="24" fill="#212121">${endFormatted}</text>`;

  svg += `</svg>`;

  return svg;
}

function generateErrorSVG(): string {
  const width = 1200;
  const height = 630;

  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect width="${width}" height="${height}" fill="#fafafa"/>`;
  svg += `<text x="${width / 2}" y="${height / 2}" text-anchor="middle" dominant-baseline="middle" font-family="Atkinson Hyperlegible, Arial, sans-serif" font-size="32" fill="#BF360C">Invalid date range</text>`;
  svg += `</svg>`;

  return svg;
}
