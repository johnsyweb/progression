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
  const barY = height / 2 - 40;
  const dateY = barY + barHeight + 50;
  const titleY = barY - 50;

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

  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect width="${width}" height="${height}" fill="#fafafa"/>`;

  svg += `<text x="${width / 2}" y="${titleY}" text-anchor="middle" font-family="Atkinson Hyperlegible, Arial, sans-serif" font-size="36" font-weight="bold" fill="#1565C0">${escapeSvgText(data.title)}</text>`;

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
