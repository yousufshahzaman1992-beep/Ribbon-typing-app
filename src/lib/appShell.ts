// Shared landing/app shell SEO helpers.
//
// Both the bundled Express server (server.ts) and the Netlify serverless
// functions import these so that "/" and "/app" expose identical <head> tags no
// matter which host serves them.

export const SITE_BASE = "https://ribbon-typing-app.netlify.app";

export interface HeadOverrides {
  title?: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
  ogTitle?: string;
  ogDescription?: string;
  ogUrl?: string;
}

export function applyHeadOverrides(html: string, overrides: HeadOverrides): string {
  if (typeof overrides.title === "string") {
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${overrides.title}</title>`);
  }
  if (typeof overrides.description === "string") {
    html = html.replace(
      /<meta name="description" content="[^"]*" \/>/,
      `<meta name="description" content="${overrides.description}" />`,
    );
  }
  if (typeof overrides.canonical === "string") {
    html = html.replace(
      /<link rel="canonical" href="[^"]*" \/>/,
      `<link rel="canonical" href="${SITE_BASE}${overrides.canonical}" />`,
    );
  }
  if (overrides.noindex === true) {
    html = html.replace(
      /<meta name="robots" content="index, follow" \/>/,
      '<meta name="robots" content="noindex, follow" />',
    );
  }

  const ogProps: Array<[string, keyof HeadOverrides]> = [
    ["og:title", "ogTitle"],
    ["og:description", "ogDescription"],
    ["og:url", "ogUrl"],
  ];
  for (const [prop, key] of ogProps) {
    const value = overrides[key];
    if (typeof value === "string") {
      const resolved = prop === "og:url" ? `${SITE_BASE}${value}` : value;
      html = html.replace(
        new RegExp(`<meta property="${prop}" content="[^"]*" \\/>`),
        `<meta property="${prop}" content="${resolved}" />`,
      );
    }
  }

  const twitterProps: Array<[string, keyof HeadOverrides]> = [
    ["twitter:title", "ogTitle"],
    ["twitter:description", "ogDescription"],
  ];
  for (const [prop, key] of twitterProps) {
    const value = overrides[key];
    if (typeof value === "string") {
      html = html.replace(
        new RegExp(`<meta name="${prop}" content="[^"]*" \\/>`),
        `<meta name="${prop}" content="${value}" />`,
      );
    }
  }
  return html;
}

// Head overrides for the client-rendered typing coach at "/app". The page is a
// thin JS shell, so it is noindex and canonicalises to its own URL.
export const APP_HEAD_OVERRIDES: HeadOverrides = {
  title: "Typing Coach — Practice & Beat Your WPM | Ribbon",
  description:
    "Open the Ribbon typing coach: timed WPM and accuracy tests, English and Hindi lessons, JavaScript code practice, bot races, arcade games and the weekly leaderboard — all free and with no sign-up.",
  canonical: "/app",
  ogTitle: "Ribbon Typing Coach — Free WPM & Accuracy Practice",
  ogDescription:
    "Free timed WPM tests, English & Hindi lessons, JavaScript code practice, bot races, arcade games and a weekly leaderboard. No sign-up.",
  ogUrl: "/app",
  noindex: true,
};

// The coach hydrates into #root and React replaces the markup on first render,
// so the body content does not matter for SEO. Head-level differences do:
// unique short meta, canonical "/app", noindex, and no duplicated structured data.
export function renderAppShell(landingHtml: string): string {
  const withoutStructuredData = landingHtml.replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/g,
    "",
  );
  return applyHeadOverrides(withoutStructuredData, APP_HEAD_OVERRIDES);
}
