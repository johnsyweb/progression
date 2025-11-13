import {
  getProgressBarData,
  renderProgressBar,
  ProgressBarData,
} from "./progressBar";
import { getBasePath, stripBasePath, parseDate } from "./utils/dateParser";
import { shareProgress } from "./utils/share";

if ("serviceWorker" in navigator) {
  const basePath = getBasePath();
  const swPath = basePath === "/" ? "/sw.js" : `${basePath}/sw.js`;
  navigator.serviceWorker.register(swPath).catch(() => {
    // Service worker registration failed, continue without it
  });
}

function init(): void {
  const path = window.location.pathname;
  const basePath = getBasePath();

  // Check if path has valid dates
  const strippedPath = stripBasePath(path, basePath);
  const parts = strippedPath.split("/").filter((part) => part.length > 0);
  const hasValidDates =
    parts.length >= 2 &&
    parseDate(parts[0]) !== null &&
    parseDate(parts[1]) !== null;

  // If no valid dates, redirect to current year
  if (!hasValidDates) {
    const current = new Date();
    const currentYear = current.getFullYear();
    const startDate = `${currentYear}-01-01`;
    const endDate = `${currentYear}-12-31`;
    const newPath = `${basePath}/${startDate}/${endDate}/${currentYear}`;

    // Update URL without page reload
    window.history.replaceState({}, "", newPath);

    // Re-initialize with new path
    const newData = getProgressBarData(newPath);
    renderProgressBarToContainer(newData);
    return;
  }

  const data = getProgressBarData(path);
  renderProgressBarToContainer(data);
}

function renderProgressBarToContainer(data: ProgressBarData): void {
  const container = document.getElementById("progress-container");
  if (!container) {
    console.error("Progress container not found");
    return;
  }

  document.title = `${data.title} | johnsy.com`;

  const ogTitleMeta = document.querySelector('meta[property="og:title"]');
  if (ogTitleMeta) {
    ogTitleMeta.setAttribute("content", `${data.title} | johnsy.com`);
  }

  container.innerHTML = renderProgressBar(data);

  // Set up share button (only show if sharing is available)
  const shareButton = container.querySelector(
    'button[data-share="true"]'
  ) as HTMLButtonElement;
  if (shareButton) {
    // Hide button if neither Web Share API nor clipboard is available
    if (
      typeof navigator.share === "undefined" &&
      (!navigator.clipboard ||
        typeof navigator.clipboard.writeText !== "function")
    ) {
      shareButton.style.display = "none";
    } else {
      shareButton.addEventListener("click", async () => {
        await shareProgress(data, window.location.href);
      });
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
