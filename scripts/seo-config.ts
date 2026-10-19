/**
 * seo-config.ts
 * ---------------------------------------------------------------------------
 * Single source of truth for every indexable URL on Ribbon Typing Coach.
 *
 * Used by:
 *   - scripts/generate-seo-pages.ts  (static HTML generation)
 *   - scripts/generate-sitemap.ts    (sitemap.xml)
 *   - scripts/validate-seo.ts        (automated checks)
 *   - server.ts                      (route list)
 *   - tests/seo.test.mjs             (invariants)
 *
 * Keep this module free of filesystem access so it stays cheap to import.
 */

export const DEFAULT_SITE_URL = 'https://ribbon-typing-app.netlify.app';
export const SITEMAP_NAMESPACE = 'http://www.sitemaps.org/schemas/sitemap/0.9';

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]']);

/**
 * Validate and normalise the public origin. Throws instead of silently
 * emitting a malformed canonical host into the sitemap or page metadata.
 */
export function normalizeSiteUrl(raw: string = DEFAULT_SITE_URL): string {
  const value = raw.trim();
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`[seo] SITE_URL is not a valid URL: "${value}"`);
  }
  if (url.protocol !== 'https:') {
    throw new Error(`[seo] SITE_URL must use https, received "${value}"`);
  }
  if (LOOPBACK_HOSTS.has(url.hostname)) {
    throw new Error(`[seo] SITE_URL must not be a localhost address: "${value}"`);
  }
  if (url.username || url.password) {
    throw new Error('[seo] SITE_URL must not contain credentials');
  }
  if (url.search || url.hash) {
    throw new Error('[seo] SITE_URL must not contain a query string or fragment');
  }
  if (url.pathname !== '/' && url.pathname !== '') {
    throw new Error(`[seo] SITE_URL must be an origin without a path: "${value}"`);
  }
  return url.origin;
}

/** Canonical production origin (override with SITE_URL for previews only). */
export const SITE_URL = normalizeSiteUrl(process.env.SITE_URL ?? DEFAULT_SITE_URL);
export const SITE_HOST = new URL(SITE_URL).host;

export type ChangeFreq = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
export type PageGroup = 'basics' | 'exam' | 'programming' | 'reading';

export const PAGE_GROUP_LABELS: Record<PageGroup, string> = {
  basics: 'Typing basics',
  exam: 'Exams & Hindi',
  programming: 'Programming',
  reading: 'Reading & drills',
};

/** Normalise a route to exactly one leading slash and no trailing slash. */
export function normalizePath(raw: string): string {
  const withSlash = '/' + raw.trim().replace(/^\/+/, '');
  return withSlash === '/' ? '/' : withSlash.replace(/\/+$/, '');
}

/** Absolute canonical URL for a route. Root keeps its trailing slash. */
export function canonicalUrl(routePath: string, siteUrl: string = SITE_URL): string {
  const path = normalizePath(routePath);
  return `${siteUrl}${path === '/' ? '/' : path}`;
}

/** True when a URL is already absolute (used for the small /app links). */
export function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

export interface StaticRoute {
  path: string;
  /** Source file whose real modification time supplies <lastmod>. */
  file: string;
  priority: number;
  changefreq: ChangeFreq;
}

/**
 * Public, indexable static pages. `file` is relative to the project root and
 * is stat()ed by the sitemap generator so lastmod reflects the content, not
 * the build time.
 */
export const STATIC_ROUTES: StaticRoute[] = [
  { path: '/', file: 'index.html', priority: 1.0, changefreq: 'weekly' },
  { path: '/ad-free-typing-test', file: 'public/ad-free-typing-test/index.html', priority: 0.8, changefreq: 'monthly' },
  { path: '/typing-practice-for-beginners', file: 'public/typing-practice-for-beginners/index.html', priority: 0.8, changefreq: 'monthly' },
  { path: '/offline-typing-test', file: 'public/offline-typing-test/index.html', priority: 0.8, changefreq: 'monthly' },
  { path: '/typing-games', file: 'public/typing-games/index.html', priority: 0.8, changefreq: 'monthly' },
  { path: '/privacy.html', file: 'public/privacy.html', priority: 0.3, changefreq: 'yearly' },
];

export type StartMode =
  | 'test'
  | 'beginner'
  | 'hindi'
  | 'code'
  | 'medical'
  | 'passages'
  | 'race'
  | 'arcade';

export interface ProgrammaticPage {
  slug: string;
  label: string;
  group: PageGroup;
  /** Deep link into the existing coach. Modes come from src/App.tsx. */
  startMode: StartMode;
  /** Content review date (YYYY-MM-DD). Omit to leave lastmod out entirely. */
  lastmod?: string;
}

/**
 * All programmatic landing pages. The generator fails if this list and the
 * content module (seo-content.ts) disagree.
 */
export const PROGRAMMATIC_PAGES: ProgrammaticPage[] = [
  {
    slug: 'ssc-chsl-hindi-typing-test',
    label: 'SSC CHSL Hindi typing test',
    group: 'exam',
    startMode: 'hindi',
    lastmod: '2026-10-18',
  },
  {
    slug: 'clerical-civil-exam-practice',
    label: 'Clerical & civil exam practice',
    group: 'exam',
    startMode: 'test',
    lastmod: '2026-10-18',
  },
  {
    slug: 'hindi-typing-lessons',
    label: 'Hindi typing lessons',
    group: 'exam',
    startMode: 'hindi',
    lastmod: '2026-10-18',
  },
  {
    slug: 'javascript-syntax-practice',
    label: 'JavaScript typing practice',
    group: 'programming',
    startMode: 'code',
    lastmod: '2026-10-18',
  },
  {
    slug: 'python-speed-test',
    label: 'Python speed test',
    group: 'programming',
    startMode: 'code',
    lastmod: '2026-10-18',
  },
  {
    slug: 'html-css-tag-drills',
    label: 'HTML & CSS tag drills',
    group: 'programming',
    startMode: 'code',
    lastmod: '2026-10-18',
  },
  {
    slug: 'alice-in-wonderland',
    label: 'Alice in Wonderland practice',
    group: 'reading',
    startMode: 'passages',
    lastmod: '2026-10-18',
  },
  {
    slug: 'sherlock-holmes-paragraphs',
    label: 'Sherlock Holmes paragraphs',
    group: 'reading',
    startMode: 'passages',
    lastmod: '2026-10-18',
  },
  {
    slug: 'moby-dick-excerpts',
    label: 'Moby Dick excerpts',
    group: 'reading',
    startMode: 'passages',
    lastmod: '2026-10-18',
  },
  {
    slug: 'medical-terminology-drills',
    label: 'Medical terminology drills',
    group: 'reading',
    startMode: 'medical',
    lastmod: '2026-10-18',
  },
];

export const PROGRAMMATIC_PRIORITY = 0.7;
export const PROGRAMMATIC_CHANGEFREQ: ChangeFreq = 'monthly';
export const PROGRAMMATIC_LAST_MODIFIED = '2026-10-18';

/** Slugs served as static HTML files, in the order routes are registered. */
export const GUIDE_SLUGS = [
  'ad-free-typing-test',
  'typing-practice-for-beginners',
  'offline-typing-test',
  'typing-games',
  ...PROGRAMMATIC_PAGES.map((page) => page.slug),
];

/** Internal links used by the homepage and generated page footers. */
export const GUIDE_GROUPS: { label: string; links: { href: string; label: string }[] }[] = [
  {
    label: PAGE_GROUP_LABELS.basics,
    links: [
      { href: '/ad-free-typing-test', label: 'Ad-free typing test' },
      { href: '/typing-practice-for-beginners', label: 'Typing practice for beginners' },
      { href: '/offline-typing-test', label: 'Offline typing test' },
      { href: '/typing-games', label: 'Free typing games' },
    ],
  },
  {
    label: PAGE_GROUP_LABELS.exam,
    links: PROGRAMMATIC_PAGES.filter((page) => page.group === 'exam').map((page) => ({
      href: `/${page.slug}`,
      label: page.label,
    })),
  },
  {
    label: PAGE_GROUP_LABELS.programming,
    links: PROGRAMMATIC_PAGES.filter((page) => page.group === 'programming').map((page) => ({
      href: `/${page.slug}`,
      label: page.label,
    })),
  },
  {
    label: PAGE_GROUP_LABELS.reading,
    links: PROGRAMMATIC_PAGES.filter((page) => page.group === 'reading').map((page) => ({
      href: `/${page.slug}`,
      label: page.label,
    })),
  },
];

/** Routes that must never appear in the sitemap or be treated as public. */
export const EXCLUDED_ROUTES = ['/app', '/api', '/404', '/404.html'];

export const ALL_INDEXABLE_PATHS = new Set<string>([
  ...STATIC_ROUTES.map((route) => normalizePath(route.path)),
  ...PROGRAMMATIC_PAGES.map((page) => normalizePath(`/${page.slug}`)),
]);

export interface SitemapRoute {
  path: string;
  priority: number;
  changefreq: ChangeFreq;
  /** Absolute ISO date, or undefined to omit <lastmod> (never invented). */
  lastmod?: string;
}

/** Merge static + programmatic routes, de-duplicating by path (static wins). */
export function buildSitemapRoutes(
  staticLastmods: Map<string, string> = new Map(),
  programmaticLastmods: Map<string, string | undefined> = new Map(),
): SitemapRoute[] {
  const routes = new Map<string, SitemapRoute>();

  for (const route of STATIC_ROUTES) {
    const path = normalizePath(route.path);
    routes.set(path, {
      path,
      priority: route.priority,
      changefreq: route.changefreq,
      lastmod: staticLastmods.get(path),
    });
  }

  for (const page of PROGRAMMATIC_PAGES) {
    const path = normalizePath(`/${page.slug}`);
    if (routes.has(path)) continue;
    const lastmod =
      programmaticLastmods.has(page.slug)
        ? programmaticLastmods.get(page.slug)
        : page.lastmod ?? PROGRAMMATIC_LAST_MODIFIED;
    routes.set(path, {
      path,
      priority: PROGRAMMATIC_PRIORITY,
      changefreq: PROGRAMMATIC_CHANGEFREQ,
      lastmod,
    });
  }

  return [...routes.values()];
}

/** Reject duplicate content definitions and slugs that are not in the config. */
export function assertSlugParity(contentSlugs: string[]): void {
  const seen = new Set<string>();
  for (const slug of contentSlugs) {
    if (seen.has(slug)) throw new Error(`[seo] Duplicate SEO content slug: ${slug}`);
    seen.add(slug);
  }
  const configured = new Set(PROGRAMMATIC_PAGES.map((page) => page.slug));
  for (const slug of configured) {
    if (!seen.has(slug)) throw new Error(`[seo] Missing content for configured slug: ${slug}`);
  }
  for (const slug of seen) {
    if (!configured.has(slug)) throw new Error(`[seo] Content slug not in seo-config: ${slug}`);
  }
}

export function isValidLastmod(value: string | undefined): boolean {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export interface Card {
  h3: string;
  p: string;
}

export interface Section {
  h2: string;
  intro?: string;
  paragraphs?: string[];
  list?: string[];
  cards?: Card[];
  steps?: string[];
  note?: string;
}

export interface Faq {
  q: string;
  a: string;
}

export interface SeoPage {
  slug: string;
  title: string;
  description: string;
  eyebrow: string;
  h1Lead: string;
  h1Accent: string;
  lede: string;
  sections: Section[];
  faq: Faq[];
  related: { href: string; label: string }[];
}
