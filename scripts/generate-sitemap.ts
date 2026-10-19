/**
 * generate-sitemap.ts
 * ---------------------------------------------------------------------------
 * Builds `public/sitemap.xml` from the centralized route catalog in
 * scripts/seo-config.ts.
 *
 * lastmod policy:
 *   - Static pages use the real file modification time (UTC date) of the
 *     source HTML, so running the generator does not invent a new date.
 *   - Programmatic pages use the reviewed date recorded in seo-config.ts,
 *     because their files are regenerated on every build.
 *   - If neither is available, <lastmod> is omitted instead of fabricated.
 *
 * No external sitemap libraries; native `node:fs` only.
 * Run: npx tsx scripts/generate-sitemap.ts
 */

import { mkdir, stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  PROGRAMMATIC_PAGES,
  SITEMAP_NAMESPACE,
  SITE_URL,
  STATIC_ROUTES,
  buildSitemapRoutes,
  canonicalUrl,
  isValidLastmod,
  normalizePath,
  type SitemapRoute,
} from './seo-config.ts';

const OUTPUT_FILE = resolve(process.cwd(), 'public', 'sitemap.xml');

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function collectStaticLastmods(): Promise<Map<string, string>> {
  const lastmods = new Map<string, string>();

  for (const route of STATIC_ROUTES) {
    try {
      const info = await stat(resolve(process.cwd(), route.file));
      lastmods.set(normalizePath(route.path), toIsoDate(info.mtime));
    } catch {
      console.warn(`[sitemap] No readable source file for ${route.path} (${route.file}); omitting lastmod`);
    }
  }

  return lastmods;
}

function renderSitemap(routes: SitemapRoute[]): string {
  const urls = routes
    .map((route) => {
      const loc = escapeXml(canonicalUrl(route.path, SITE_URL));
      const lines = ['  <url>', `    <loc>${loc}</loc>`];
      if (route.lastmod && isValidLastmod(route.lastmod)) {
        lines.push(`    <lastmod>${route.lastmod}</lastmod>`);
      }
      lines.push(`    <changefreq>${route.changefreq}</changefreq>`);
      lines.push(`    <priority>${route.priority.toFixed(1)}</priority>`);
      lines.push('  </url>');
      return lines.join('\n');
    })
    .join('\n');

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    `<urlset xmlns="${SITEMAP_NAMESPACE}">\n` +
    `${urls}\n` +
    '</urlset>\n'
  );
}

async function main(): Promise<void> {
  const staticLastmods = await collectStaticLastmods();
  const routes = buildSitemapRoutes(staticLastmods);
  const xml = renderSitemap(routes);

  await mkdir(resolve(process.cwd(), 'public'), { recursive: true });
  await writeFile(OUTPUT_FILE, xml, 'utf8');

  const withLastmod = routes.filter((route) => route.lastmod).length;
  console.log(
    `[sitemap] Generated ${routes.length} canonical URLs (${withLastmod} with lastmod, ${routes.length - withLastmod} without)`,
  );
  console.log(`[sitemap] Static pages: ${STATIC_ROUTES.length}, programmatic pages: ${PROGRAMMATIC_PAGES.length}`);
  console.log(`[sitemap] Host: ${SITE_URL}`);
  console.log(`[sitemap] Wrote ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error('[sitemap] Failed to generate sitemap:', err);
  process.exitCode = 1;
});
