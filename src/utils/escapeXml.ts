/**
 * Escapes XML/HTML/SVG text content to prevent injection and ensure valid markup.
 * Escapes the five XML entities: & < > " '
 */
export function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
