import { type ProgressBarData } from "../progressBar";
import { formatDateLong, formatDate } from "./dateParser";
import { escapeXml } from "./escapeXml";
import { generateStatusText } from "./progressStatus";

function renderTitleSection(title: string, interactive: boolean): string {
  const safeTitle = escapeXml(title);
  if (interactive) {
    return `<div class="progress-title-wrapper"><h2 class="progress-title" contenteditable="true" role="textbox" aria-label="Progress title (Alt+T to edit)" tabindex="0" accesskey="t" title="Alt+T to edit">${safeTitle}</h2></div>`;
  }
  return `<div class="progress-title-wrapper"><h2 class="progress-title">${safeTitle}</h2></div>`;
}

function renderStatusSection(data: ProgressBarData): string {
  const text = escapeXml(generateStatusText(data));
  return `<div class="progress-status"><p class="progress-status-text">${text}</p></div>`;
}

function renderBarSection(percentage: number | null): string {
  let html = `<div class="progress-bar-wrapper"><div class="progress-bar">`;
  if (percentage !== null) {
    html += `<div class="progress-fill" style="width: ${percentage}%"></div>`;
    html += `<div class="progress-percentage" style="left: ${percentage}%">${percentage.toFixed(2)}%</div>`;
    html += `<div class="progress-indicator" style="left: ${percentage}%"></div>`;
  }
  html += `</div></div>`;
  return html;
}

function renderDatesSection(
  data: ProgressBarData,
  interactive: boolean
): string {
  const startFormatted = formatDateLong(data.start);
  const endFormatted = formatDateLong(data.end);
  const currentFormatted = formatDateLong(data.current);
  const startIso = formatDate(data.start);
  const endIso = formatDate(data.end);
  const currentIso = formatDate(data.current);

  if (interactive) {
    return `<div class="progress-dates"><div class="progress-date-start"><label for="start-date-input" class="visually-hidden">Start date</label><input type="date" id="start-date-input" class="date-input" value="${startIso}" max="${currentIso}" aria-label="Start date (Alt+S to edit, must be in the past)" data-date-type="start" accesskey="s" /><span class="date-display" tabindex="0" role="button" aria-label="Start date (Alt+S to edit)" title="Alt+S to edit">${startFormatted}</span></div><div class="progress-date-current">${currentFormatted}</div><div class="progress-date-end"><label for="end-date-input" class="visually-hidden">End date</label><input type="date" id="end-date-input" class="date-input" value="${endIso}" min="${currentIso}" aria-label="End date (Alt+E to edit, must be from today)" data-date-type="end" accesskey="e" /><span class="date-display" tabindex="0" role="button" aria-label="End date (Alt+E to edit)" title="Alt+E to edit">${endFormatted}</span></div></div>`;
  }

  return `<div class="progress-dates"><div class="progress-date-start"><span class="date-display">${startFormatted}</span></div><div class="progress-date-current">${currentFormatted}</div><div class="progress-date-end"><span class="date-display">${endFormatted}</span></div></div>`;
}

function renderShareSection(): string {
  return `<div class="progress-share"><button class="share-button" data-share="true" aria-label="Share progress (Alt+H)" accesskey="h" title="Alt+H to share">Share</button></div>`;
}

export function renderProgressBar(data: ProgressBarData): string {
  const inner = [
    renderTitleSection(data.title, true),
    renderStatusSection(data),
    renderBarSection(data.percentage),
    renderDatesSection(data, true),
  ].join("");
  return `<div class="progress-container">${inner}</div>${renderShareSection()}`;
}

export function renderProgressBarForImage(data: ProgressBarData): string {
  const inner = [
    renderTitleSection(data.title, false),
    renderBarSection(data.percentage),
    renderDatesSection(data, false),
  ].join("");
  return `<div class="progress-container">${inner}</div>`;
}

// Export CSS content placeholder for service worker (will be inlined at build time)
export const CSS_CONTENT_PLACEHOLDER = "__CSS_CONTENT_PLACEHOLDER__";
