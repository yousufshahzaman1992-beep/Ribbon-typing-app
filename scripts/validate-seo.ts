/**
 * validate-seo.ts
 * ---------------------------------------------------------------------------
 * Automated SEO checks for generated output. Fails the build on structural
 * errors instead of letting broken canonicals, duplicate URLs, invalid JSON-LD
 * or missing pages reach production.
 *
 * Run:
 *   tsx scripts/validate-seo.ts          # validates public/ + source pages
 *   tsx scripts/validate-seo.ts --dist   # additionally validates dist/
 */

import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  ALL_INDEXABLE_PATHS,
  EXCLUDED_ROUTES,
  PROGRAMMATIC_PAGES,
  SITE_HOST,
  SITE_URL,
  SITEMAP_NAMESPACE,
  STATIC_ROUTES,
  canonicalUrl,
  isValidLastmod,
  normalizePath,
} from './seo-config.ts';

const ROOT = process.cwd();
const errors: string[] = [];
const warnings: string[] = [];

function fail(message: string): void {
  errors.push(message);
}

function warn(message: string): void {
  warnings.push(message);
}

async function exists(file: string): Promise<boolean> {
  try {
    await access(resolve(ROOT, file));
    return true;
  } catch {
    return false;
  }
}

function decodeEntities(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function allMatches(haystack: string, regex: RegExp): RegExpMatchArray[] {
  return [...haystack.matchAll(regex)];
}

function stripTags(value: string): string {
  return decodeEntities(value.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

/** Source/output file for a public route. */
function fileForPath(routePath: string, base: 'public' | 'dist'): string {
  const path = normalizePath(routePath);
  if (path === '/') return base === 'dist' ? 'dist/index.html' : 'index.html';
  if (path.endsWith('.html')) return `${base}${path}`;
  return `${base}${path}/index.html`;
}

interface UrlEntry {
  loc: string;
  lastmod?: string;
}

function parseSitemap(xml: string): UrlEntry[] {
  if (!xml.startsWith('<?xml')) fail('sitemap.xml: missing XML declaration');
  if (!xml.includes(`xmlns="${SITEMAP_NAMESPACE}"`)) {
    fail(`sitemap.xml: missing canonical namespace ${SITEMAP_NAMESPACE}`);
  }
  if (xml.indexOf(SITEMAP_NAMESPACE) !== xml.lastIndexOf(SITEMAP_NAMESPACE)) {
    fail('sitemap.xml: duplicate xmlns declarations');
  }
  const open = allMatches(xml, /<url>/g).length;
  const close = allMatches(xml, /<\/url>/g).length;
  if (open !== close) fail(`sitemap.xml: unbalanced <url> tags (${open} open, ${close} close)`);
  if (!xml.trimEnd().endsWith('</urlset>')) fail('sitemap.xml: does not end with </urlset>');

  const entries: UrlEntry[] = [];
  for (const match of allMatches(xml, /<url>([\s\S]*?)<\/url>/g)) {
    const block = match[1];
    const loc = block.match(/<loc>([\s\S]*?)<\/loc>/)?.[1];
    const lastmod = block.match(/<lastmod>([\s\S]*?)<\/lastmod>/)?.[1];
    if (!loc) {
      fail('sitemap.xml: <url> without <loc>');
      continue;
    }
    entries.push({ loc: decodeEntities(loc.trim()), lastmod: lastmod?.trim() });
  }
  return entries;
}

async function validateSitemap(): Promise<void> {
  const sitemapPath = 'public/sitemap.xml';
  if (!(await exists(sitemapPath))) {
    fail('sitemap.xml: public/sitemap.xml is missing (run npm run sitemap)');
    return;
  }
  const xml = await readFile(resolve(ROOT, sitemapPath), 'utf8');
  const entries = parseSitemap(xml);

  const expectedPaths = new Set(ALL_INDEXABLE_PATHS);
  const seen = new Set<string>();
  const seenPaths = new Set<string>();

  for (const entry of entries) {
    let url: URL;
    try {
      url = new URL(entry.loc);
    } catch {
      fail(`sitemap.xml: invalid URL "${entry.loc}"`);
      continue;
    }
    if (url.protocol !== 'https:') fail(`sitemap.xml: non-https URL ${entry.loc}`);
    if (url.host !== SITE_HOST) fail(`sitemap.xml: wrong host in ${entry.loc} (expected ${SITE_HOST})`);
    if (/localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(entry.loc)) {
      fail(`sitemap.xml: localhost URL present: ${entry.loc}`);
    }
    if (url.search || url.hash) fail(`sitemap.xml: query or fragment in ${entry.loc}`);
    if (seen.has(entry.loc)) fail(`sitemap.xml: duplicate URL ${entry.loc}`);
    seen.add(entry.loc);

    const path = normalizePath(url.pathname);
    if (seenPaths.has(path)) fail(`sitemap.xml: duplicate path ${path}`);
    seenPaths.add(path);

    if (EXCLUDED_ROUTES.some((excluded) => path === excluded || path.startsWith(`${excluded}/`))) {
      fail(`sitemap.xml: excluded route present: ${path}`);
    }
    if (!expectedPaths.has(path)) {
      fail(`sitemap.xml: route is not in the canonical catalog: ${path}`);
    }
    if (entry.lastmod && !isValidLastmod(entry.lastmod)) {
      fail(`sitemap.xml: invalid lastmod "${entry.lastmod}" for ${path}`);
    }
    if (!(await exists(fileForPath(path, 'public')))) {
      fail(`sitemap.xml: ${path} has no generated/source file (${fileForPath(path, 'public')})`);
    }
  }

  for (const path of expectedPaths) {
    if (!seenPaths.has(path)) fail(`sitemap.xml: missing expected route ${path}`);
  }
}

interface PageReport {
  file: string;
  title: string;
  description: string;
  canonical: string;
}

async function validateHtmlPage(file: string, expectedPath?: string): Promise<PageReport | undefined> {
  if (!(await exists(file))) {
    fail(`${file}: file missing`);
    return undefined;
  }
  const html = await readFile(resolve(ROOT, file), 'utf8');

  const titles = allMatches(html, /<title>([\s\S]*?)<\/title>/g);
  if (titles.length !== 1) fail(`${file}: expected exactly one <title>, found ${titles.length}`);
  const title = stripTags(titles[0]?.[1] ?? '');

  const descriptions = allMatches(html, /<meta\s+name="description"\s+content="([\s\S]*?)"/g);
  if (descriptions.length !== 1) fail(`${file}: expected exactly one meta description, found ${descriptions.length}`);
  const description = decodeEntities(descriptions[0]?.[1] ?? '');

  const canonicals = allMatches(html, /<link\s+rel="canonical"\s+href="([^"]+)"/g);
  if (canonicals.length !== 1) fail(`${file}: expected exactly one canonical, found ${canonicals.length}`);
  const canonical = decodeEntities(canonicals[0]?.[1] ?? '');

  if (expectedPath && canonical !== canonicalUrl(expectedPath)) {
    fail(`${file}: canonical "${canonical}" should be "${canonicalUrl(expectedPath)}"`);
  }
  if (/localhost|127\.0\.0\.1/i.test(canonical)) fail(`${file}: localhost canonical`);

  const robots = html.match(/<meta\s+name="robots"\s+content="([^"]*)"/i)?.[1] ?? '';
  if (!/index/i.test(robots) || /noindex/i.test(robots)) {
    fail(`${file}: robots meta must allow indexing (found "${robots}")`);
  }

  const h1s = allMatches(html, /<h1[\s>]/g);
  if (h1s.length !== 1) fail(`${file}: expected exactly one <h1>, found ${h1s.length}`);

  if (!/<html lang="en"/.test(html)) fail(`${file}: missing <html lang="en">`);
  if (!/<meta charset="utf-8"/i.test(html)) fail(`${file}: missing UTF-8 charset`);
  if (!/name="viewport"/.test(html)) fail(`${file}: missing viewport meta`);

  for (const match of allMatches(html, /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(match[1]);
    } catch (err) {
      fail(`${file}: invalid JSON-LD (${(err as Error).message})`);
    }
  }

  const faqBlocks = allMatches(html, /"@type"\s*:\s*"FAQPage"[\s\S]*?"mainEntity"\s*:\s*(\[[\s\S]*?\])\s*[,}]/g);
  if (faqBlocks.length > 1) fail(`${file}: duplicate FAQPage structured data`);
  if (faqBlocks.length === 1) {
    const plain = stripTags(html);
    for (const question of allMatches(faqBlocks[0][1], /"name"\s*:\s*"((?:[^"\\]|\\.)*)"/g)) {
      const raw = JSON.parse(`"${question[1]}"`) as string;
      if (!plain.includes(raw)) {
        fail(`${file}: FAQ question is not visible on the page: "${raw}"`);
      }
    }
  }

  for (const match of allMatches(html, /<a\s[^>]*href="([^"]+)"/g)) {
    const href = decodeEntities(match[1]);
    if (!href.startsWith('/') || href.startsWith('//')) continue;
    const target = href.split('#')[0].split('?')[0];
    if (!target) continue;
    if (target === '/app' || target.startsWith('/app/')) continue;
    const path = normalizePath(target);
    if (ALL_INDEXABLE_PATHS.has(path)) continue;
    if (/\.[a-z0-9]+$/i.test(path) && (await exists(`public${path}`))) continue;
    fail(`${file}: internal link does not resolve: ${href}`);
  }

  return { file, title, description, canonical };
}

async function validatePages(): Promise<void> {
  const reports: PageReport[] = [];

  for (const route of STATIC_ROUTES) {
    if (route.path === '/' || route.path === '/privacy.html') continue;
    const report = await validateHtmlPage(fileForPath(route.path, 'public'), route.path);
    if (report) reports.push(report);
  }

  for (const page of PROGRAMMATIC_PAGES) {
    const file = `public/${page.slug}/index.html`;
    const report = await validateHtmlPage(file, `/${page.slug}`);
    if (report) reports.push(report);
  }

  const home = await validateHtmlPage('index.html', '/');
  if (home) reports.push(home);

  const privacy = await validateHtmlPage('public/privacy.html', '/privacy.html');
  if (privacy) reports.push(privacy);

  const titleCounts = new Map<string, string[]>();
  const descCounts = new Map<string, string[]>();
  for (const report of reports) {
    titleCounts.set(report.title, [...(titleCounts.get(report.title) ?? []), report.file]);
    descCounts.set(report.description, [...(descCounts.get(report.description) ?? []), report.file]);
  }
  for (const [title, files] of titleCounts) {
    if (files.length > 1) fail(`Duplicate <title> "${title}" in: ${files.join(', ')}`);
  }
  for (const [description, files] of descCounts) {
    if (files.length > 1) fail(`Duplicate meta description in: ${files.join(', ')}`);
  }
}

async function validateRobots(): Promise<void> {
  const file = 'public/robots.txt';
  if (!(await exists(file))) {
    fail('robots.txt: missing');
    return;
  }
  const text = await readFile(resolve(ROOT, file), 'utf8');
  if (!text.includes(`Sitemap: ${SITE_URL}/sitemap.xml`)) {
    fail(`robots.txt: Sitemap line must be "Sitemap: ${SITE_URL}/sitemap.xml"`);
  }
  if (/Disallow:\s*\/(src|assets|@vite|node_modules)/i.test(text)) {
    fail('robots.txt: blocks build assets required for rendering');
  }
  if (!/Disallow:\s*\/api\//i.test(text)) {
    warn('robots.txt: /api/ is not disallowed (JSON endpoints should not be indexed)');
  }
}

async function validateNetlify(): Promise<void> {
  const file = 'netlify.toml';
  if (!(await exists(file))) {
    fail('netlify.toml: missing');
    return;
  }
  const text = await readFile(resolve(ROOT, file), 'utf8');
  for (const page of PROGRAMMATIC_PAGES) {
    if (!text.includes(`from = "/${page.slug}"`)) {
      fail(`netlify.toml: no rewrite for /${page.slug}; the page would 404 on Netlify`);
    }
  }
  if (!/from = "\/\*"[\s\S]*?status = 404/.test(text)) {
    warn('netlify.toml: no explicit 404 fallback found');
  }
}

async function validateAssets(): Promise<void> {
  for (const asset of ['public/og-image.png', 'public/seo.css', 'public/favicon.svg']) {
    if (!(await exists(asset))) fail(`${asset}: missing`);
  }
}

async function validateDist(): Promise<void> {
  if (!(await exists('dist'))) {
    fail('dist/: build output missing');
    return;
  }
  for (const page of PROGRAMMATIC_PAGES) {
    if (!(await exists(`dist/${page.slug}/index.html`))) {
      fail(`dist/${page.slug}/index.html: missing from production build`);
    }
  }
  for (const asset of ['dist/sitemap.xml', 'dist/robots.txt', 'dist/seo.css', 'dist/index.html', 'dist/404.html']) {
    if (!(await exists(asset))) fail(`${asset}: missing from production build`);
  }
  if (await exists('dist/sitemap.xml')) {
    const built = await readFile(resolve(ROOT, 'dist/sitemap.xml'), 'utf8');
    const source = await readFile(resolve(ROOT, 'public/sitemap.xml'), 'utf8');
    const builtLocs = parseSitemap(built).map((entry) => entry.loc).sort();
    const sourceLocs = parseSitemap(source).map((entry) => entry.loc).sort();
    if (builtLocs.join('\n') !== sourceLocs.join('\n')) {
      fail('dist/sitemap.xml: does not match public/sitemap.xml (stale build)');
    }
  }
}

async function main(): Promise<void> {
  const distMode = process.argv.includes('--dist');

  await validateSitemap();
  await validatePages();
  await validateRobots();
  await validateNetlify();
  await validateAssets();
  if (distMode) await validateDist();

  for (const message of warnings) console.warn(`[seo-check] warn: ${message}`);
  if (errors.length > 0) {
    for (const message of errors) console.error(`[seo-check] error: ${message}`);
    console.error(`[seo-check] Failed with ${errors.length} error(s).`);
    process.exitCode = 1;
    return;
  }
  console.log(`[seo-check] Passed${distMode ? ' (including dist/)' : ''} with ${warnings.length} warning(s).`);
}

main().catch((err) => {
  console.error('[seo-check] Crashed:', err);
  process.exitCode = 1;
});
