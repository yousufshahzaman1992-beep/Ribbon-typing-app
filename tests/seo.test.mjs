import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  ALL_INDEXABLE_PATHS,
  DEFAULT_SITE_URL,
  EXCLUDED_ROUTES,
  PROGRAMMATIC_PAGES,
  SITE_HOST,
  SITE_URL,
  SITEMAP_NAMESPACE,
  STATIC_ROUTES,
  assertSlugParity,
  buildSitemapRoutes,
  canonicalUrl,
  isValidLastmod,
  normalizePath,
  normalizeSiteUrl,
} from '../scripts/seo-config.ts';
import { PAGES } from '../scripts/seo-content.ts';

test('normalizeSiteUrl accepts the production origin', () => {
  assert.equal(normalizeSiteUrl(DEFAULT_SITE_URL), DEFAULT_SITE_URL);
});

test('normalizeSiteUrl rejects unsafe or malformed origins', () => {
  assert.throws(() => normalizeSiteUrl('http://ribbon-typing-app.netlify.app'));
  assert.throws(() => normalizeSiteUrl('https://localhost:3000'));
  assert.throws(() => normalizeSiteUrl('https://127.0.0.1'));
  assert.throws(() => normalizeSiteUrl('https://example.com/path'));
  assert.throws(() => normalizeSiteUrl('not a url'));
});

test('canonicalUrl keeps root slash and avoids double slashes', () => {
  assert.equal(canonicalUrl('/'), `${SITE_URL}/`);
  assert.equal(canonicalUrl('typing-games'), `${SITE_URL}/typing-games`);
  assert.equal(canonicalUrl('//typing-games//'), `${SITE_URL}/typing-games`);
  assert.equal(canonicalUrl('/privacy.html'), `${SITE_URL}/privacy.html`);
});

test('normalizePath produces a single leading slash', () => {
  assert.equal(normalizePath('/'), '/');
  assert.equal(normalizePath('foo/'), '/foo');
  assert.equal(normalizePath('///foo//'), '/foo');
});

test('content covers every configured programmatic slug exactly once', () => {
  assert.doesNotThrow(() => assertSlugParity(PAGES.map((page) => page.slug)));
  assert.equal(PAGES.length, PROGRAMMATIC_PAGES.length);
});

test('titles and descriptions are unique', () => {
  const titles = new Set(PAGES.map((page) => page.title));
  const descriptions = new Set(PAGES.map((page) => page.description));
  assert.equal(titles.size, PAGES.length);
  assert.equal(descriptions.size, PAGES.length);
});

test('related links stay inside the public route catalog', () => {
  for (const page of PAGES) {
    for (const link of page.related) {
      const path = normalizePath(link.href.split('?')[0].split('#')[0]);
      assert.ok(
        path === '/' || ALL_INDEXABLE_PATHS.has(path),
        `${page.slug} links to unknown page ${link.href}`,
      );
    }
  }
});

test('route catalog has no duplicates and excludes private routes', () => {
  const routes = buildSitemapRoutes();
  const paths = routes.map((route) => route.path);
  assert.equal(new Set(paths).size, paths.length);
  assert.equal(routes.length, STATIC_ROUTES.length + PROGRAMMATIC_PAGES.length);
  for (const excluded of EXCLUDED_ROUTES) {
    assert.ok(!paths.includes(excluded), `${excluded} must not be indexable`);
  }
});

test('every lastmod is a real ISO date when present', () => {
  assert.ok(isValidLastmod('2026-10-18'));
  assert.ok(isValidLastmod(undefined));
  assert.ok(!isValidLastmod('2026-13-40'));
  assert.ok(!isValidLastmod('18-10-2026'));
});

test('generated sitemap uses the canonical namespace and host', () => {
  const xml = readFileSync(resolve(process.cwd(), 'public/sitemap.xml'), 'utf8');
  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.ok(xml.includes(`xmlns="${SITEMAP_NAMESPACE}"`));
  assert.ok(!/localhost|127\.0\.0\.1/i.test(xml));

  const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  assert.equal(locs.length, STATIC_ROUTES.length + PROGRAMMATIC_PAGES.length);
  assert.equal(new Set(locs).size, locs.length);
  for (const loc of locs) {
    assert.equal(new URL(loc).host, SITE_HOST);
  }
});

test('robots.txt points at the canonical sitemap', () => {
  const robots = readFileSync(resolve(process.cwd(), 'public/robots.txt'), 'utf8');
  assert.ok(robots.includes(`Sitemap: ${SITE_URL}/sitemap.xml`));
  assert.match(robots, /Disallow:\s*\/api\//);
});

test('netlify.toml rewrites every programmatic slug', () => {
  const toml = readFileSync(resolve(process.cwd(), 'netlify.toml'), 'utf8');
  for (const page of PROGRAMMATIC_PAGES) {
    assert.ok(toml.includes(`from = "/${page.slug}"`), `missing rewrite for /${page.slug}`);
  }
});
