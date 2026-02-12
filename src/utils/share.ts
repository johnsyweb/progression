import { ProgressBarData } from "../progressBar";
import { formatDateLong, formatDate } from "./dateParser";
import html2canvas from "html2canvas";

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

function captureProgressContainerAsPNG(
  container: HTMLElement,
  filename: string
): Promise<File | null> {
  const progressContainer = container.querySelector(".progress-container");
  const elementToCapture =
    progressContainer instanceof HTMLElement ? progressContainer : container;

  return html2canvas(elementToCapture, {
    useCORS: true,
    scale: 2,
    backgroundColor: null,
    logging: false,
  }).then((canvas) => {
    return new Promise<File | null>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], filename, { type: "image/png" }));
          } else {
            resolve(null);
          }
        },
        "image/png",
        0.95
      );
    });
  });
}

function buildShareImageFilename(data: ProgressBarData): string {
  const startDate = formatDate(data.start);
  const endDate = formatDate(data.end);
  let filename = `progress-${startDate}-${endDate}`;
  if (data.title && data.title !== "Progress") {
    const sanitized = data.title
      .replace(/[^a-zA-Z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    if (sanitized) {
      filename += `-${sanitized}`;
    }
  }
  return `${filename}.png`;
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

  if (typeof navigator.share !== "undefined" && navigator.canShare) {
    try {
      const container = document.getElementById("progress-container");
      if (container instanceof HTMLElement) {
        const filename = buildShareImageFilename(data);
        const file = await captureProgressContainerAsPNG(container, filename);
        if (file) {
          const shareDataWithFile = { ...shareData, files: [file] };
          if (navigator.canShare(shareDataWithFile)) {
            await navigator.share(shareDataWithFile);
            return;
          }
        }
      }
    } catch {
      // Fall through to share without image
    }
  }

  if (typeof navigator.share !== "undefined") {
    try {
      await navigator.share(shareData);
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
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
