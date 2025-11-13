import { ProgressBarData } from "../progressBar";
import { formatDateLong } from "./dateParser";

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

  console.log("Sharing:", shareData);

  // Try to include the image if Web Share API supports files
  if (typeof navigator.share !== "undefined" && navigator.canShare) {
    try {
      const basePath =
        document.querySelector("base")?.href || window.location.origin;
      const imageUrl = `${basePath}og-image.svg?path=${encodeURIComponent(
        window.location.pathname
      )}`;

      console.log("Fetching image from:", imageUrl);

      // Fetch the SVG and convert to File
      const response = await fetch(imageUrl);
      if (response.ok) {
        const svgBlob = await response.blob();
        const file = new File([svgBlob], "progress.svg", {
          type: "image/svg+xml",
        });

        const shareDataWithFile = { ...shareData, files: [file] };

        // Check if we can share with files
        if (navigator.canShare(shareDataWithFile)) {
          console.log("Sharing with image");
          await navigator.share(shareDataWithFile);
          return;
        } else {
          console.log("Cannot share with files, falling back to text only");
        }
      } else {
        console.warn("Failed to fetch image:", response.status);
      }
    } catch (error) {
      console.warn(
        "Could not share with image, falling back to text only:",
        error
      );
    }
  }

  // Fallback: share without image or copy to clipboard
  if (typeof navigator.share !== "undefined") {
    try {
      console.log("Sharing without image");
      await navigator.share(shareData);
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Error sharing:", error);
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
    console.log("Web Share API not available, using clipboard");
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
