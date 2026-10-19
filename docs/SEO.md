# SEO operations

## Source of truth

| Concern | File |
| --- | --- |
| Hostname, routes, priorities, lastmod | `scripts/seo-config.ts` |
| Landing page copy and FAQs | `scripts/seo-content.ts` |
| HTML rendering | `scripts/generate-seo-pages.ts` |
| `public/sitemap.xml` | `scripts/generate-sitemap.ts` |
| Automated checks | `scripts/validate-seo.ts` |
| Homepage copy/metadata | `index.html` |
| Deployment rewrites/404 | `netlify.toml` |

Canonical production origin: `https://ribbon-typing-app.netlify.app`

`SITE_URL` can override the origin for local previews only. It is validated and rejects non-HTTPS, localhost, credentials, query strings and paths. Never set it to a preview host in a production deploy, or every canonical will point at the preview.

## Build pipeline

```bash
npm run seo-pages      # regenerate public/<slug>/index.html
npm run sitemap        # regenerate public/sitemap.xml
npm run seo-check      # validate public/ + source pages
npm test               # unit + SEO invariants
npm run build          # generation + checks + Vite build + dist checks
```

`npm run build` runs `seo-check` twice: once on source output, once with `--dist` to confirm the sitemap, robots.txt, SEO CSS and every landing page made it into `dist/`.

`seo-check` fails the build on:

- invalid XML or a missing/incorrect sitemap namespace
- non-HTTPS, wrong-host, localhost or duplicate URLs
- routes outside the canonical catalog, or `/app`, `/api`, 404 routes in the sitemap
- missing page files, duplicate titles/descriptions/canonicals
- invalid JSON-LD or FAQ questions that are not visible on the page
- internal links that do not resolve
- robots.txt blocking assets, or missing the sitemap line
- Netlify rules missing for a generated page
- stale or missing files in `dist/`

## lastmod policy

- Static pages use the real UTC modification date of their source HTML.
- Programmatic pages use the reviewed date in `seo-config.ts` (`lastmod`).
- If a date is unavailable, `<lastmod>` is omitted rather than invented.

When you materially edit a landing page, update its `lastmod` in `seo-config.ts`.

## Adding a page

1. Add a `ProgrammaticPage` entry in `scripts/seo-config.ts` (slug, label, group, `startMode`).
2. Add the matching content object in `scripts/seo-content.ts`.
3. Add a Netlify 200 rewrite in `netlify.toml`.
4. Run `npm run build`. The generator and validator fail if any of the three are out of sync.
5. Only create a page when the app genuinely supports the topic and the page has distinct, useful content. Do not create city/keyword doorway variants.

`startMode` values must match the deep-link switch in `src/App.tsx` (`test`, `beginner`, `hindi`, `code`, `medical`, `passages`, `race`, `arcade`).

## Google Search Console

These are different states; do not treat one as the next:

1. **Generated** — a URL exists in `scripts/seo-config.ts` and `public/sitemap.xml`.
2. **Served** — the URL returns HTTP 200 with the intended HTML (verified locally and by `seo-check`; verify live after deploy).
3. **Discovered** — Google has seen the URL (Search Console > Pages > "Discovered – currently not indexed" or "Crawled").
4. **Indexed** — Google has chosen to index it (Search Console > Pages > "Indexed").

Manual steps after deploying:

1. Open Search Console for the verified property.
2. Confirm the property is the `https://ribbon-typing-app.netlify.app` origin, not a preview domain.
3. Go to **Sitemaps**, submit `sitemap.xml`, and confirm the status is Success.
4. Use **URL Inspection** on the homepage and one new guide, then click **Request indexing** for the homepage.
5. Re-check **Pages** after a few days. A sitemap entry does not guarantee indexing; thin or duplicate pages are ignored.

Do not buy links, generate artificial traffic, or submit external account changes automatically.

## Known limitations

- No browser-based Lighthouse/Core Web Vitals run is part of this repository. Performance work here is limited to static and build-time checks (no client JavaScript on SEO guides, system fonts, no images beyond the OG card).
- FAQ structured data is present only where the questions and answers are visible. Google may choose not to display FAQ rich results.
- The React coach at `/app` is `noindex`; the public landing page is the indexable entry point.
