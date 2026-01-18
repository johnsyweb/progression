import { type ProgressBarData } from "../progressBar";
import { formatDateLong } from "./dateParser";
import { escapeXml } from "./escapeXml";

export function renderProgressBarForImage(data: ProgressBarData): string {
  const startFormatted = formatDateLong(data.start);
  const endFormatted = formatDateLong(data.end);
  const currentFormatted = formatDateLong(data.current);

  let html = `<div class="progress-container">`;

  html += `<div class="progress-title-wrapper">`;
  html += `<h2 class="progress-title">${escapeXml(data.title)}</h2>`;
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
  html += `<span class="date-display">${startFormatted}</span>`;
  html += `</div>`;
  html += `<div class="progress-date-current">${currentFormatted}</div>`;
  html += `<div class="progress-date-end">`;
  html += `<span class="date-display">${endFormatted}</span>`;
  html += `</div>`;
  html += `</div>`;

  // Note: progress-share is excluded as requested

  html += `</div>`;

  return html;
}

// Export CSS content placeholder for service worker (will be inlined at build time)
export const CSS_CONTENT_PLACEHOLDER = "__CSS_CONTENT_PLACEHOLDER__";


