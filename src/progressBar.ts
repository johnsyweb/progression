import {
  parseDateFromPath,
  calculateProgress,
  formatDateLong,
  parseTitleFromPath,
} from "./utils/dateParser";

export interface ProgressBarData {
  start: Date;
  end: Date;
  current: Date;
  percentage: number | null;
  title: string;
}

export function getProgressBarData(path: string): ProgressBarData | null {
  const dateRange = parseDateFromPath(path);
  if (!dateRange) {
    return null;
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

export function renderProgressBar(data: ProgressBarData): string {
  const startFormatted = formatDateLong(data.start);
  const endFormatted = formatDateLong(data.end);
  const currentFormatted = formatDateLong(data.current);

  let html = `<div class="progress-container">`;

  html += `<h2 class="progress-title">${escapeHtml(data.title)}</h2>`;

  html += `<div class="progress-bar-wrapper">`;
  html += `<div class="progress-bar">`;

  if (data.percentage !== null) {
    html += `<div class="progress-fill" style="width: ${data.percentage}%"></div>`;
    html += `<div class="progress-percentage" style="left: ${data.percentage}%">${data.percentage.toFixed(2)}%</div>`;
    html += `<div class="progress-indicator" style="left: ${data.percentage}%"></div>`;
  }

  html += `</div>`;
  html += `</div>`;

  html += `<div class="progress-dates">`;
  html += `<div class="progress-date-start">${startFormatted}</div>`;
  html += `<div class="progress-date-current">${currentFormatted}</div>`;
  html += `<div class="progress-date-end">${endFormatted}</div>`;
  html += `</div>`;

  html += `</div>`;

  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
