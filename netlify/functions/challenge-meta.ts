import { parseChallengeQuery } from '../../src/lib/challenge';

// Renders the SPA index.html with dynamic social meta tags injected so shared
// "beat me" challenge links show a rich scorecard preview to crawlers.
const buildMeta = (parsed: { name: string; wpm: number; acc: number; minutes: number }, origin: string) => {
  const cardUrl = `${origin}/api/og-card?name=${encodeURIComponent(parsed.name)}&wpm=${parsed.wpm}&acc=${parsed.acc}&minutes=${parsed.minutes}`;
  const title = `Can you beat ${parsed.name}'s ${parsed.wpm} WPM?`;
  const description = `${parsed.name} scored ${parsed.wpm} WPM with ${parsed.acc}% accuracy on Ribbon Typing Coach. Take the ${parsed.minutes}-minute test and take the crown!`;
  return [
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:image" content="${cardUrl}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${cardUrl}" />`,
  ].join('\n    ');
};

export const handler = async (event: any) => {
  const q = event.queryStringParameters || {};
  const parsed = parseChallengeQuery(typeof q.challenge === 'string' ? q.challenge : null);
  const headers = event.headers || {};
  const scheme = headers['x-forwarded-proto'] === 'http' ? 'http' : 'https';
  const origin = `${scheme}://${headers.host || 'ribbon-typing-app.netlify.app'}`;

  try {
    const res = await fetch(`${origin}/`);
    const html = await res.text();
    if (!parsed) {
      return { statusCode: 200, headers: { 'Content-Type': 'text/html' }, body: html };
    }
    const meta = buildMeta(parsed, origin);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html' },
      body: html.replace('<head>', `<head>\n    ${meta}`),
    };
  } catch (e: any) {
    return { statusCode: 502, body: JSON.stringify({ error: e?.message || 'Failed to render page' }) };
  }
};
