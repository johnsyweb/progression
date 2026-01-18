export function generateSitemap(baseUrl: string, basePath: string): string {
  const normalizedBasePath = basePath === "/" ? "" : basePath.replace(/\/$/, "");
  const fullUrl = normalizedBasePath ? `${baseUrl}${normalizedBasePath}/` : `${baseUrl}/`;

  const currentDate = new Date().toISOString().split("T")[0];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${fullUrl}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
}
