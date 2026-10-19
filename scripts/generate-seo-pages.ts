/**
 * generate-seo-pages.ts
 * ---------------------------------------------------------------------------
 * Renders the static SEO landing pages from scripts/seo-content.ts.
 *
 * Design rules:
 *   - Content and URLs live in data modules (seo-content.ts / seo-config.ts).
 *   - Every interpolated value is HTML-escaped.
 *   - JSON-LD is serialised safely (no `</script>` breakout).
 *   - Output is deterministic, so repeated builds produce identical files.
 *   - The generator refuses to run if slugs, metadata or internal links are
 *     invalid, instead of emitting broken pages.
 *
 * Run: npx tsx scripts/generate-seo-pages.ts
 * Wired into `npm run build` before Vite copies `public/` into `dist/`.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  ALL_INDEXABLE_PATHS,
  GUIDE_GROUPS,
  PROGRAMMATIC_PAGES,
  SITE_URL,
  assertSlugParity,
  canonicalUrl,
  normalizePath,
  type ProgrammaticPage,
  type SeoPage,
  type Section,
} from './seo-config.ts';
import { PAGES } from './seo-content.ts';

const OUTPUT_ROOT = resolve(process.cwd(), 'public');
const OG_IMAGE = `${SITE_URL}/og-image.png`;

const PAGE_REFS = new Map<string, ProgrammaticPage>(
  PROGRAMMATIC_PAGES.map((page) => [page.slug, page]),
);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Serialise JSON-LD without allowing a literal closing script tag. */
function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value, null, 2).replace(/</g, '\\u003c');
}

function validateContent(pages: SeoPage[]): void {
  assertSlugParity(pages.map((page) => page.slug));

  const titles = new Map<string, string>();
  const descriptions = new Map<string, string>();
  const errors: string[] = [];

  for (const page of pages) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(page.slug)) {
      errors.push(`${page.slug}: slug must be lowercase kebab-case`);
    }
    if (!page.title || page.title.length > 75) {
      errors.push(`${page.slug}: title must be 1-75 characters`);
    }
    if (!page.description || page.description.length < 50 || page.description.length > 180) {
      errors.push(`${page.slug}: description must be 50-180 characters`);
    }
    if (titles.has(page.title)) errors.push(`${page.slug}: duplicate title (also ${titles.get(page.title)})`);
    if (descriptions.has(page.description)) {
      errors.push(`${page.slug}: duplicate description (also ${descriptions.get(page.description)})`);
    }
    titles.set(page.title, page.slug);
    descriptions.set(page.description, page.slug);

    if (!page.eyebrow || !page.h1Lead || !page.h1Accent || !page.lede) {
      errors.push(`${page.slug}: missing hero copy`);
    }
    if (page.sections.length < 2) errors.push(`${page.slug}: needs at least two sections`);
    if (page.faq.length < 2) errors.push(`${page.slug}: needs at least two FAQs`);
    if (page.related.length < 2) errors.push(`${page.slug}: needs at least two related links`);

    for (const section of page.sections) {
      if (!section.h2) errors.push(`${page.slug}: section missing h2`);
      const body = [
        ...(section.paragraphs ?? []),
        ...(section.list ?? []),
        ...(section.steps ?? []),
        ...(section.cards ?? []).flatMap((card) => [card.h3, card.p]),
        ...(section.note ? [section.note] : []),
      ];
      if (body.length === 0) errors.push(`${page.slug}: empty section "${section.h2}"`);
    }

    for (const faq of page.faq) {
      if (!faq.q || !faq.a) errors.push(`${page.slug}: FAQ with empty question or answer`);
    }

    for (const link of page.related) {
      const target = link.href.split('#')[0].split('?')[0];
      if (!target.startsWith('/') || target.startsWith('//')) {
        errors.push(`${page.slug}: related link must be internal: ${link.href}`);
      } else if (normalizePath(target) !== '/' && !ALL_INDEXABLE_PATHS.has(normalizePath(target))) {
        errors.push(`${page.slug}: related link points to unknown page: ${link.href}`);
      }
      if (!link.label.trim()) errors.push(`${page.slug}: related link without anchor text`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`[seo-pages] Content validation failed:\n  - ${errors.join('\n  - ')}`);
  }
}

function renderSection(section: Section): string {
  const parts: string[] = [
    '        <section>',
    `          <h2>${escapeHtml(section.h2)}</h2>`,
  ];

  if (section.intro) parts.push(`          <p>${escapeHtml(section.intro)}</p>`);
  for (const paragraph of section.paragraphs ?? []) {
    parts.push(`          <p>${escapeHtml(paragraph)}</p>`);
  }

  if (section.cards && section.cards.length > 0) {
    parts.push('          <div class="grid two">');
    for (const card of section.cards) {
      parts.push(
        `            <div class="card"><h3>${escapeHtml(card.h3)}</h3><p>${escapeHtml(card.p)}</p></div>`,
      );
    }
    parts.push('          </div>');
  }

  if (section.list && section.list.length > 0) {
    parts.push('          <ul>');
    for (const item of section.list) parts.push(`            <li>${escapeHtml(item)}</li>`);
    parts.push('          </ul>');
  }

  if (section.steps && section.steps.length > 0) {
    parts.push('          <ol class="steps">');
    for (const step of section.steps) parts.push(`            <li>${escapeHtml(step)}</li>`);
    parts.push('          </ol>');
  }

  if (section.note) {
    parts.push(`          <div class="note"><p>${escapeHtml(section.note)}</p></div>`);
  }

  parts.push('        </section>');
  return parts.join('\n');
}

function renderFaq(page: SeoPage): string {
  const items = page.faq
    .map(
      (item) =>
        `            <details>\n              <summary>${escapeHtml(item.q)}</summary>\n              <p>${escapeHtml(item.a)}</p>\n            </details>`,
    )
    .join('\n');
  return `        <section>\n          <h2>Frequently asked questions</h2>\n          <div class="faq">\n${items}\n          </div>\n        </section>`;
}

function renderRelated(page: SeoPage): string {
  const links = page.related
    .map((link) => `            <a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`)
    .join('\n');
  return `        <section>\n          <h2>Keep reading</h2>\n          <div class="related">\n${links}\n          </div>\n        </section>`;
}

function renderFooter(): string {
  const groups = GUIDE_GROUPS.map((group) => {
    const links = group.links
      .map((link) => `            <a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`)
      .join('\n');
    return `          <div class="footer-group">\n            <h2 class="footer-heading">${escapeHtml(group.label)}</h2>\n            <nav aria-label="${escapeHtml(group.label)}">\n${links}\n            </nav>\n          </div>`;
  }).join('\n');

  return `    <footer class="site-footer">
      <div class="wrap">
        <p>Ribbon Typing Coach is a free, ad-free typing practice app for improving your words-per-minute speed and accuracy. It is not affiliated with any typing certification body.</p>
        <div class="footer-groups">
${groups}
        </div>
        <nav class="footer-meta" aria-label="Legal">
          <a href="/privacy.html" rel="nofollow">Privacy Policy</a>
          <a href="/sitemap.xml">Sitemap</a>
        </nav>
      </div>
    </footer>`;
}

function renderPage(page: SeoPage, ref: ProgrammaticPage): string {
  const canonical = canonicalUrl(`/${page.slug}`);
  const appHref = `/app?start=${ref.startMode}`;
  const shortName = page.title.split('—')[0].trim();

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${canonical}#webpage`,
        url: canonical,
        name: page.title,
        description: page.description,
        inLanguage: 'en',
        isPartOf: {
          '@type': 'WebSite',
          '@id': `${SITE_URL}/#website`,
          url: `${SITE_URL}/`,
          name: 'Ribbon Typing Coach',
        },
        breadcrumb: { '@id': `${canonical}#breadcrumb` },
        ...(ref.lastmod ? { dateModified: ref.lastmod } : {}),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonical}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: shortName, item: canonical },
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': `${canonical}#faq`,
        mainEntity: page.faq.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      },
    ],
  };

  const dateMeta = ref.lastmod
    ? `\n    <meta property="article:modified_time" content="${escapeHtml(ref.lastmod)}" />`
    : '';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(page.title)}</title>
    <meta name="description" content="${escapeHtml(page.description)}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <link rel="sitemap" href="/sitemap.xml" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <meta name="theme-color" content="#0B0C10" />
    <link rel="stylesheet" href="/seo.css" />

    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="Ribbon Typing Coach" />
    <meta property="og:title" content="${escapeHtml(page.title)}" />
    <meta property="og:description" content="${escapeHtml(page.description)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:image" content="${escapeHtml(OG_IMAGE)}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Ribbon Typing Coach — free typing speed test" />
    <meta property="og:locale" content="en_US" />${dateMeta}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(page.title)}" />
    <meta name="twitter:description" content="${escapeHtml(page.description)}" />
    <meta name="twitter:image" content="${escapeHtml(OG_IMAGE)}" />

    <script type="application/ld+json">
${serializeJsonLd(graph)}
    </script>
  </head>
  <body>
    <a class="skip-link" href="#main">Skip to content</a>
    <header class="site-header">
      <div class="wrap">
        <a class="brand" href="/" aria-label="Ribbon Typing Coach home">
          <span class="logo">Ribbon</span>
          <span class="tag">Free Typing Test</span>
        </a>
        <nav class="site-nav" aria-label="Typing guides">
          <a href="/">Home</a>
          <a href="/typing-practice-for-beginners">Beginners</a>
          <a href="/offline-typing-test">Offline</a>
          <a href="/typing-games">Typing games</a>
          <a href="/ad-free-typing-test">Ad-free</a>
        </nav>
        <a class="cta" href="${escapeHtml(appHref)}">Open the App</a>
      </div>
    </header>

    <main id="main">
      <section class="hero">
        <div class="wrap inner">
          <p class="eyebrow">${escapeHtml(page.eyebrow)}</p>
          <h1>${escapeHtml(page.h1Lead)} <span class="accent">${escapeHtml(page.h1Accent)}</span></h1>
          <p class="lede">${escapeHtml(page.lede)}</p>
          <div class="hero-actions">
            <a class="cta" href="${escapeHtml(appHref)}">Start practising now</a>
            <a class="ghost" href="/">Take the free WPM test</a>
          </div>
        </div>
      </section>

      <div class="wrap">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <ol>
            <li><a href="/">Home</a></li>
            <li aria-current="page">${escapeHtml(shortName)}</li>
          </ol>
        </nav>

${page.sections.map(renderSection).join('\n\n')}

${renderFaq(page)}

${renderRelated(page)}

        <section>
          <h2>Start your next session</h2>
          <p>Open the free typing coach and apply what you just read. Nothing to install and no account required.</p>
          <div class="hero-actions" style="justify-content: flex-start">
            <a class="cta" href="${escapeHtml(appHref)}">Open the typing coach</a>
          </div>
        </section>
      </div>
    </main>

${renderFooter()}
  </body>
</html>
`;
}

async function main(): Promise<void> {
  validateContent(PAGES);

  let count = 0;
  for (const page of PAGES) {
    const ref = PAGE_REFS.get(page.slug);
    if (!ref) throw new Error(`[seo-pages] No config entry for slug: ${page.slug}`);
    const dir = resolve(OUTPUT_ROOT, page.slug);
    await mkdir(dir, { recursive: true });
    await writeFile(resolve(dir, 'index.html'), renderPage(page, ref), 'utf8');
    count += 1;
  }
  console.log(`[seo-pages] Generated ${count} static SEO landing pages`);
}

main().catch((err) => {
  console.error('[seo-pages] Failed to generate pages:', err);
  process.exitCode = 1;
});
