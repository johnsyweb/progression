import { ProgressBarData } from "../progressBar";
import { formatDateLong, formatDate } from "./dateParser";

export function generateShareText(data: ProgressBarData): string {
  const startFormatted = formatDateLong(data.start);
  const endFormatted = formatDateLong(data.end);

  if (data.percentage !== null) {
    return `${data.title}: ${data.percentage.toFixed(2)}% complete (${startFormatted} to ${endFormatted})`;
  } else {
    if (data.current < data.start) {
      return `${data.title}: Starting ${startFormatted}, ending ${endFormatted}`;
    } else {
      return `${data.title}: Completed ${endFormatted} (started ${startFormatted})`;
    }
  }
}

export async function shareProgress(
  data: ProgressBarData,
  url: string
): Promise<void> {
  const text = generateShareText(data);
  const shareData: ShareData = {
    title: data.title,
    text,
    url,
  };

  // Try to include the image if Web Share API supports files
  if (typeof navigator.share !== "undefined" && navigator.canShare) {
    try {
      const basePath =
        document.querySelector("base")?.href || window.location.origin;
      const imageUrl = `${basePath}og-image.svg?path=${encodeURIComponent(
        window.location.pathname
      )}`;

      // Generate unique filename based on dates and title from data
      const startDate = formatDate(data.start);
      const endDate = formatDate(data.end);
      let filename = `progress-${startDate}-${endDate}`;

      // Add title if present and not default
      if (data.title && data.title !== "Progress") {
        // Sanitize title for filename: replace spaces/special chars with dashes
        const sanitizedTitle = data.title
          .replace(/[^a-zA-Z0-9-]/g, "-") // Replace non-alphanumeric (except dashes) with dashes
          .replace(/-+/g, "-") // Collapse multiple dashes
          .replace(/^-|-$/g, ""); // Remove leading/trailing dashes
        if (sanitizedTitle) {
          filename += `-${sanitizedTitle}`;
        }
      }
      filename += ".svg";

      // Fetch the SVG and convert to File
      const response = await fetch(imageUrl);
      if (response.ok) {
        const svgBlob = await response.blob();
        const file = new File([svgBlob], filename, {
          type: "image/svg+xml",
        });

        const shareDataWithFile = { ...shareData, files: [file] };

        // Check if we can share with files
        if (navigator.canShare(shareDataWithFile)) {
          await navigator.share(shareDataWithFile);
          return;
        }
      }
    } catch {
      // Fall through to share without image
    }
  }

  // Fallback: share without image or copy to clipboard
  if (typeof navigator.share !== "undefined") {
    try {
      await navigator.share(shareData);
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        // Fallback to clipboard
        if (
          navigator.clipboard &&
          typeof navigator.clipboard.writeText === "function"
        ) {
          await navigator.clipboard.writeText(`${text}\n${url}`);
          alert("Link copied to clipboard!");
        }
      }
    }
  } else {
    // No Web Share API, use clipboard
    if (
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    ) {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      alert("Link copied to clipboard!");
    } else {
      alert("Sharing not available in this browser");
    }
  }
}
