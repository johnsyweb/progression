import {
  parseDateFromPath,
  calculateProgress,
  formatDateLong,
  parseTitleFromPath,
  formatDate,
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

export function renderProgressBar(data: ProgressBarData): string {
  const startFormatted = formatDateLong(data.start);
  const endFormatted = formatDateLong(data.end);
  const currentFormatted = formatDateLong(data.current);

  let html = `<div class="progress-container">`;

  html += `<div class="progress-title-wrapper">`;
  html += `<h2 class="progress-title" contenteditable="true" role="textbox" aria-label="Progress title (Alt+E to edit)" tabindex="0" accesskey="e" title="Alt+E to edit">${escapeHtml(data.title)}</h2>`;
  html += `</div>`;

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
  html += `<div class="progress-date-start">`;
  html += `<label for="start-date-input" class="visually-hidden">Start date</label>`;
  html += `<input type="date" id="start-date-input" class="date-input" value="${formatDate(data.start)}" max="${formatDate(data.current)}" aria-label="Start date (Alt+S to edit, must be in the past)" data-date-type="start" accesskey="s" />`;
  html += `<span class="date-display" tabindex="0" role="button" aria-label="Start date (Alt+S to edit)" title="Alt+S to edit">${startFormatted}</span>`;
  html += `</div>`;
  html += `<div class="progress-date-current">${currentFormatted}</div>`;
  html += `<div class="progress-date-end">${endFormatted}</div>`;
  html += `</div>`;

  // Always include share button - availability will be checked in JavaScript
  html += `<div class="progress-share">`;
  html += `<button class="share-button" data-share="true" aria-label="Share progress">Share</button>`;
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
