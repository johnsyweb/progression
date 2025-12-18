import {
  getProgressBarData,
  renderProgressBar,
  ProgressBarData,
} from "./progressBar";
import {
  getBasePath,
  stripBasePath,
  parseDate,
  formatDate,
} from "./utils/dateParser";
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

  // Set up date picker helper function
  const setupDatePicker = (
    inputId: string,
    displaySelector: string,
    accessKey: string,
    updateDate: (newDateStr: string) => void
  ): void => {
    const dateInput = container.querySelector(inputId) as HTMLInputElement;
    const dateDisplay = container.querySelector(displaySelector) as HTMLElement;
    if (!dateInput || !dateDisplay) {
      return;
    }

    const showPicker = (): void => {
      dateInput.style.display = "inline-block";
      dateDisplay.style.display = "none";
      dateInput.focus();
      dateInput.showPicker?.();
    };

    dateInput.addEventListener("change", () => {
      const newDate = dateInput.value;
      if (newDate) {
        updateDate(newDate);
      }
    });

    dateDisplay.addEventListener("click", () => {
      showPicker();
    });

    dateDisplay.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        showPicker();
      }
    });

    dateInput.addEventListener("blur", () => {
      dateInput.style.display = "none";
      dateDisplay.style.display = "inline";
    });

    // Store showPicker function and accesskey on the input element for accesskey handler
    (dateInput as any).__showPicker = showPicker;
    (dateInput as any).__accessKey = accessKey.toLowerCase();
  };

  // Set up title editing
  const titleElement = container.querySelector(
    ".progress-title"
  ) as HTMLElement;
  if (titleElement) {
    let originalTitle = data.title;

    const updateTitle = (newTitle: string): void => {
      const trimmedTitle = newTitle.trim();
      if (trimmedTitle === "" || trimmedTitle === originalTitle) {
        titleElement.textContent = originalTitle;
        return;
      }

      const basePath = getBasePath();
      const startDateStr = formatDate(data.start);
      const endDateStr = formatDate(data.end);
      const encodedTitle = encodeURIComponent(trimmedTitle);
      const newPath = `${basePath}/${startDateStr}/${endDateStr}/${encodedTitle}`;

      window.history.pushState({}, "", newPath);

      originalTitle = trimmedTitle;
      document.title = `${trimmedTitle} | johnsy.com`;

      const ogTitleMeta = document.querySelector('meta[property="og:title"]');
      if (ogTitleMeta) {
        ogTitleMeta.setAttribute("content", `${trimmedTitle} | johnsy.com`);
      }
    };

    const focusTitle = (): void => {
      titleElement.focus();
      const range = document.createRange();
      range.selectNodeContents(titleElement);
      range.collapse(false);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    };

    titleElement.addEventListener("blur", () => {
      const newTitle = titleElement.textContent || "";
      updateTitle(newTitle);
    });

    titleElement.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        titleElement.blur();
      } else if (e.key === "Escape") {
        e.preventDefault();
        titleElement.textContent = originalTitle;
        titleElement.blur();
      }
    });

    // Handle accesskey (Alt+T or Cmd+T depending on platform)
    document.addEventListener("keydown", (e: KeyboardEvent) => {
      if (
        (e.altKey || e.metaKey) &&
        !e.ctrlKey &&
        !e.shiftKey &&
        (e.key === "t" || e.key === "T")
      ) {
        // Check if we're not already in an input/textarea/contenteditable
        const activeElement = document.activeElement;
        if (
          activeElement &&
          (activeElement.tagName === "INPUT" ||
            activeElement.tagName === "TEXTAREA" ||
            (activeElement instanceof HTMLElement &&
              activeElement.isContentEditable))
        ) {
          return;
        }
        e.preventDefault();
        focusTitle();
      }
    });
  }

  // Set up start date editing
  const updateStartDate = (newStartDateStr: string): void => {
    const newStartDate = parseDate(newStartDateStr);
    if (!newStartDate) {
      return;
    }

    // Ensure start date is not after end date
    let finalStartDate = newStartDate;
    let finalEndDate = data.end;
    if (newStartDate > data.end) {
      finalEndDate = newStartDate;
    }

    const basePath = getBasePath();
    const startDateStr = formatDate(finalStartDate);
    const endDateStr = formatDate(finalEndDate);
    const encodedTitle = encodeURIComponent(data.title);
    const newPath = `${basePath}/${startDateStr}/${endDateStr}/${encodedTitle}`;

    window.history.pushState({}, "", newPath);

    // Re-render the progress bar with new dates
    const newData = getProgressBarData(newPath);
    renderProgressBarToContainer(newData);
  };

  setupDatePicker(
    "#start-date-input",
    ".progress-date-start .date-display",
    "s",
    updateStartDate
  );

  // Set up end date editing
  const updateEndDate = (newEndDateStr: string): void => {
    const newEndDate = parseDate(newEndDateStr);
    if (!newEndDate) {
      return;
    }

    // Ensure end date is not before start date
    let finalStartDate = data.start;
    let finalEndDate = newEndDate;
    if (newEndDate < data.start) {
      finalStartDate = newEndDate;
    }

    const basePath = getBasePath();
    const startDateStr = formatDate(finalStartDate);
    const endDateStr = formatDate(finalEndDate);
    const encodedTitle = encodeURIComponent(data.title);
    const newPath = `${basePath}/${startDateStr}/${endDateStr}/${encodedTitle}`;

    window.history.pushState({}, "", newPath);

    // Re-render the progress bar with new dates
    const newData = getProgressBarData(newPath);
    renderProgressBarToContainer(newData);
  };

  setupDatePicker(
    "#end-date-input",
    ".progress-date-end .date-display",
    "e",
    updateEndDate
  );

  // Set up accesskey handlers for date pickers (single handler for both)
  const startDateInput = container.querySelector(
    "#start-date-input"
  ) as HTMLInputElement & { __showPicker?: () => void; __accessKey?: string };
  const endDateInput = container.querySelector(
    "#end-date-input"
  ) as HTMLInputElement & { __showPicker?: () => void; __accessKey?: string };

  if (startDateInput && endDateInput) {
    const handleDatePickerAccessKey = (e: KeyboardEvent): void => {
      if ((e.altKey || e.metaKey) && !e.ctrlKey && !e.shiftKey) {
        const activeElement = document.activeElement;
        if (
          activeElement &&
          (activeElement.tagName === "INPUT" ||
            activeElement.tagName === "TEXTAREA" ||
            (activeElement instanceof HTMLElement &&
              activeElement.isContentEditable))
        ) {
          return;
        }

        const key = e.key.toLowerCase();
        if (startDateInput.__accessKey === key && startDateInput.__showPicker) {
          e.preventDefault();
          startDateInput.__showPicker();
        } else if (
          endDateInput.__accessKey === key &&
          endDateInput.__showPicker
        ) {
          e.preventDefault();
          endDateInput.__showPicker();
        }
      }
    };

    // Remove old handler if it exists and add new one
    const oldHandler = (document as any).__datePickerAccessKeyHandler;
    if (oldHandler) {
      document.removeEventListener("keydown", oldHandler);
    }
    (document as any).__datePickerAccessKeyHandler = handleDatePickerAccessKey;
    document.addEventListener("keydown", handleDatePickerAccessKey);
  }

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
