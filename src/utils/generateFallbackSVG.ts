export function generateFallbackSVG(title: string = "Progress"): string {
  const width = 1200;
  const height = 630;
  const padding = 60;
  const barHeight = 40;
  const barWidth = width - padding * 2;
  const barY = height / 2 - 40;
  const dateY = barY + barHeight + 50;
  const titleY = barY - 50;

  function escapeSvgText(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect width="${width}" height="${height}" fill="#fafafa"/>`;

  svg += `<text x="${width / 2}" y="${titleY}" text-anchor="middle" font-family="Atkinson Hyperlegible, Arial, sans-serif" font-size="36" font-weight="bold" fill="#1565C0">${escapeSvgText(title)}</text>`;

  svg += `<rect x="${padding}" y="${barY}" width="${barWidth}" height="${barHeight}" fill="#E0E0E0" stroke="#BBDEFB" stroke-width="2" rx="4"/>`;

  svg += `<text x="${width / 2}" y="${dateY + 30}" text-anchor="middle" font-family="Atkinson Hyperlegible, Arial, sans-serif" font-size="24" fill="#212121">johnsy.com</text>`;

  svg += `</svg>`;

  return svg;
}
