import { type ProgressBarData } from "../progressBar";
import { formatDateLong, formatDate } from "./dateParser";
import { escapeXml } from "./escapeXml";
import { generateStatusText } from "./progressStatus";

import titleInteractive from "../templates/progress-title-interactive.html?raw";
import titleDisplay from "../templates/progress-title-display.html?raw";
import statusTemplate from "../templates/progress-status.html?raw";
import barOuterTemplate from "../templates/progress-bar-outer.html?raw";
import barInnerTemplate from "../templates/progress-bar-inner.html?raw";
import datesInteractiveTemplate from "../templates/progress-dates-interactive.html?raw";
import datesDisplayTemplate from "../templates/progress-dates-display.html?raw";
import shareTemplate from "../templates/progress-share.html?raw";

function substitute(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (acc, [key, value]) =>
      acc.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value),
    template
  );
}

function renderTitleSection(title: string, interactive: boolean): string {
  const safeTitle = escapeXml(title);
  const template = interactive ? titleInteractive : titleDisplay;
  return substitute(template, { title: safeTitle });
}

function renderStatusSection(data: ProgressBarData): string {
  const text = escapeXml(generateStatusText(data));
  return substitute(statusTemplate, { text });
}

function renderBarSection(percentage: number | null): string {
  const inner =
    percentage !== null
      ? substitute(barInnerTemplate, {
          percentage: String(percentage),
          percentageText: percentage.toFixed(2) + "%",
        })
      : "";
  return substitute(barOuterTemplate, { inner });
}

function renderDatesSection(
  data: ProgressBarData,
  interactive: boolean
): string {
  const values = {
    startFormatted: formatDateLong(data.start),
    endFormatted: formatDateLong(data.end),
    currentFormatted: formatDateLong(data.current),
    startIso: formatDate(data.start),
    endIso: formatDate(data.end),
    currentIso: formatDate(data.current),
  };
  const template = interactive
    ? datesInteractiveTemplate
    : datesDisplayTemplate;
  return substitute(template, values);
}

function renderShareSection(): string {
  return shareTemplate.trim();
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
