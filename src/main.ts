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
import { generateStatusText } from "./utils/progressStatus";

function init(): void {
  const path = window.location.pathname;
  const basePath = getBasePath();

  // Don't handle routing for static assets
  const strippedPath = stripBasePath(path, basePath);
  if (
    strippedPath.startsWith("/assets/") ||
    strippedPath.startsWith("assets/")
  ) {
    return; // Let static assets be served directly
  }

  // Check if path has valid dates
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
    // Ensure basePath doesn't have trailing slash, and add dates
    const normalizedBasePath =
      basePath === "/" ? "" : basePath.replace(/\/$/, "");
    const newPath = `${normalizedBasePath}/${startDate}/${endDate}/${currentYear}`;

    // Update URL without page reload
    window.history.replaceState({}, "", newPath);

    // Re-initialize with new path (use newPath directly, not window.location.pathname
    // as replaceState doesn't synchronously update window.location.pathname)
    const newData = getProgressBarData(newPath);
    renderProgressBarToContainer(newData);
    return;
  }

  const data = getProgressBarData(path);
  renderProgressBarToContainer(data);
}

function updateOGTags(data: ProgressBarData, path: string): void {
  const basePath = getBasePath();
  const baseUrl = window.location.origin;
  const ogUrl = baseUrl + (path === "/" ? "" : path);

  // Try to use dynamic SVG via service worker, fallback to static image
  // Use PNG screenshot as OG image for better compatibility across platforms
  const normalizedBasePath =
    basePath === "/" ? "" : basePath.replace(/\/$/, "");
  const ogImagePath =
    normalizedBasePath === ""
      ? "/assets/screenshot.png"
      : `${normalizedBasePath}/assets/screenshot.png`;
  const ogImageUrl = `${baseUrl}${ogImagePath}`;

  const statusText = generateStatusText(data);

  document.title = `${data.title} | www.johnsy.com`;

  const ogTitleMeta = document.querySelector('meta[property="og:title"]');
  if (ogTitleMeta) {
    ogTitleMeta.setAttribute("content", `${data.title} | www.johnsy.com`);
  }

  const breadcrumbCurrent = document.getElementById("breadcrumb-current");
  if (breadcrumbCurrent) {
    breadcrumbCurrent.textContent = data.title;
  }
  const breadcrumbDataScript = document.getElementById("breadcrumb-data");
  if (breadcrumbDataScript) {
    const progressionFullUrl =
      baseUrl + (basePath === "/" ? "/" : basePath.replace(/\/$/, "") + "/");
    const breadcrumbData = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "johnsy.com",
          item: "https://www.johnsy.com/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Progression",
          item: progressionFullUrl,
        },
        { "@type": "ListItem", position: 3, name: data.title, item: ogUrl },
      ],
    };
    breadcrumbDataScript.textContent = JSON.stringify(breadcrumbData);
  }

  const ogUrlMeta = document.querySelector('meta[property="og:url"]');
  if (ogUrlMeta) {
    ogUrlMeta.setAttribute("content", ogUrl);
  }

  const ogImageMeta = document.querySelector('meta[property="og:image"]');
  if (ogImageMeta) {
    ogImageMeta.setAttribute("content", ogImageUrl);
  }

  const ogDescriptionMeta = document.querySelector(
    'meta[property="og:description"]'
  );
  if (ogDescriptionMeta) {
    ogDescriptionMeta.setAttribute("content", statusText);
  }

  const twitterImageMeta = document.querySelector('meta[name="twitter:image"]');
  if (twitterImageMeta) {
    twitterImageMeta.setAttribute("content", ogImageUrl);
  }

  // Update canonical URL
  const canonicalLink = document.querySelector('link[rel="canonical"]');
  if (canonicalLink) {
    canonicalLink.setAttribute("href", ogUrl);
  }

  // Update meta description
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute("content", statusText);
  }

  // Update JSON-LD structured data
  const structuredDataScript = document.getElementById("structured-data");
  if (structuredDataScript) {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: `${data.title} | www.johnsy.com`,
      url: ogUrl,
      description: statusText,
      author: {
        "@type": "Person",
        name: "Pete Johns",
        givenName: "Pete",
        familyName: "Johns",
        alternateName: "Pete Johns (/piːt ʤɒnz/)",
        pronouns: "he/him/his",
        jobTitle: "Head of Engineering",
        url: "https://www.johnsy.com/contact/",
        sameAs: [
          "https://github.com/johnsyweb",
          "https://www.flickr.com/people/johnsyweb/",
        ],
      },
      publisher: {
        "@type": "Organization",
        name: "johnsy.com",
        url: "https://www.johnsy.com",
      },
    };
    structuredDataScript.textContent = JSON.stringify(structuredData);
  }
}

function renderProgressBarToContainer(data: ProgressBarData): void {
  const container = document.getElementById("progress-container");
  if (!container) {
    console.error("Progress container not found - DOM may not be ready");
    return;
  }

  const path = window.location.pathname;
  updateOGTags(data, path);

  // Preserve the current title if it exists and has been edited
  const currentTitleElement = container.querySelector(
    ".progress-title"
  ) as HTMLElement;
  const currentTitle = currentTitleElement?.textContent?.trim() || "";
  const shouldPreserveTitle = currentTitle && currentTitle !== data.title;

  container.innerHTML = renderProgressBar(data);

  // Restore the preserved title if it was different from the data title
  if (shouldPreserveTitle && currentTitle) {
    const newTitleElement = container.querySelector(
      ".progress-title"
    ) as HTMLElement;
    if (newTitleElement) {
      newTitleElement.textContent = currentTitle;
    }
  }

  // Set up date picker helper function
  interface DateInputWithExtras extends HTMLInputElement {
    __showPicker?: () => void;
    __accessKey?: string;
  }

  const debounce = (
    func: (newDate: string) => void,
    wait: number
  ): {
    call: (newDate: string) => void;
    cancel: () => void;
  } => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    return {
      call: (newDate: string) => {
        if (timeout !== null) {
          clearTimeout(timeout);
        }
        timeout = setTimeout(() => {
          func(newDate);
          timeout = null;
        }, wait);
      },
      cancel: () => {
        if (timeout !== null) {
          clearTimeout(timeout);
          timeout = null;
        }
      },
    };
  };

  const setupDatePicker = (
    inputId: string,
    displaySelector: string,
    accessKey: string,
    updateDate: (newDateStr: string) => void
  ): void => {
    const dateInput = container.querySelector(inputId) as DateInputWithExtras;
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

    // Debounce the input and change events to avoid updating while typing
    const debouncedUpdate = debounce((newDate: string) => {
      if (newDate) {
        updateDate(newDate);
      }
    }, 500);

    // Handle input events (fires while typing)
    dateInput.addEventListener("input", () => {
      // Only update if the value is a complete, valid date (YYYY-MM-DD format)
      const value = dateInput.value;
      if (value && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
        debouncedUpdate.call(value);
      }
    });

    // Handle change events (fires when date is committed)
    dateInput.addEventListener("change", () => {
      debouncedUpdate.call(dateInput.value);
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
      // Cancel any pending debounced update
      debouncedUpdate.cancel();
      // On blur, update immediately (user is done editing)
      const newDate = dateInput.value;
      if (newDate) {
        updateDate(newDate);
      }
      dateInput.style.display = "none";
      dateDisplay.style.display = "inline";
    });

    // Store showPicker function and accesskey on the input element for accesskey handler
    dateInput.__showPicker = showPicker;
    dateInput.__accessKey = accessKey.toLowerCase();
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
      const updatedData = getProgressBarData(newPath);
      updateOGTags(updatedData, newPath);
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
    const finalStartDate = newStartDate;
    let finalEndDate = data.end;
    if (newStartDate > data.end) {
      finalEndDate = newStartDate;
    }

    // Get the current title from the UI (may have unsaved edits)
    const currentTitleElement = container.querySelector(
      ".progress-title"
    ) as HTMLElement;
    const currentTitle = currentTitleElement?.textContent?.trim() || data.title;

    const basePath = getBasePath();
    const startDateStr = formatDate(finalStartDate);
    const endDateStr = formatDate(finalEndDate);
    const encodedTitle = encodeURIComponent(currentTitle);
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
    const finalEndDate = newEndDate;
    if (newEndDate < data.start) {
      finalStartDate = newEndDate;
    }

    // Get the current title from the UI (may have unsaved edits)
    const currentTitleElement = container.querySelector(
      ".progress-title"
    ) as HTMLElement;
    const currentTitle = currentTitleElement?.textContent?.trim() || data.title;

    const basePath = getBasePath();
    const startDateStr = formatDate(finalStartDate);
    const endDateStr = formatDate(finalEndDate);
    const encodedTitle = encodeURIComponent(currentTitle);
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
  ) as DateInputWithExtras;
  const endDateInput = container.querySelector(
    "#end-date-input"
  ) as DateInputWithExtras;

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
    interface DocumentWithHandler extends Document {
      __datePickerAccessKeyHandler?: (e: KeyboardEvent) => void;
    }
    const doc = document as DocumentWithHandler;
    const oldHandler = doc.__datePickerAccessKeyHandler;
    if (oldHandler) {
      document.removeEventListener("keydown", oldHandler);
    }
    doc.__datePickerAccessKeyHandler = handleDatePickerAccessKey;
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
      const handleShare = async (): Promise<void> => {
        await shareProgress(data, window.location.href);
      };

      shareButton.addEventListener("click", handleShare);

      // Handle accesskey (Alt+H or Cmd+H depending on platform)
      document.addEventListener("keydown", (e: KeyboardEvent) => {
        if (
          (e.altKey || e.metaKey) &&
          !e.ctrlKey &&
          !e.shiftKey &&
          (e.key === "h" || e.key === "H")
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
          // Only trigger if share button is visible
          if (shareButton.style.display !== "none") {
            e.preventDefault();
            handleShare();
          }
        }
      });
    }
  }
}

function updateAccessKeysDisplay(): void {
  const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
  const modifierKey = isMac ? "⌘" : "Alt";
  const modifierKeyElements = document.querySelectorAll(".modifier-key");

  modifierKeyElements.forEach((el) => {
    el.textContent = modifierKey;
  });

  // Hide share shortcut if share button is not available
  const shareButton = document.querySelector(
    'button[data-share="true"]'
  ) as HTMLButtonElement;
  const shareAccessKey = document.getElementById("accesskey-share");
  if (shareButton && shareAccessKey) {
    const shareListItem = shareAccessKey.closest("li");
    if (
      shareButton.style.display === "none" ||
      (typeof navigator.share === "undefined" &&
        (!navigator.clipboard ||
          typeof navigator.clipboard.writeText !== "function"))
    ) {
      shareListItem?.setAttribute("style", "display: none;");
    } else {
      shareListItem?.removeAttribute("style");
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    init();
    updateAccessKeysDisplay();
  });
} else {
  init();
  updateAccessKeysDisplay();
}
