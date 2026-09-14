import { renderAppShell } from '../../src/lib/appShell';

// Serves the client-rendered typing coach at /app with the same unique <head>
// the Express server produces: unique title/description, canonical "/app",
// noindex, and the landing page's JSON-LD stripped. Fetching the built
// index.html keeps the React entry scripts so the SPA still hydrates normally.
export const handler = async (event: any) => {
  const headers = event.headers || {};
  const scheme = headers['x-forwarded-proto'] === 'http' ? 'http' : 'https';
  const origin = `${scheme}://${headers.host || 'ribbon-typing-app.netlify.app'}`;

  try {
    const res = await fetch(`${origin}/index.html`);
    if (!res.ok) {
      return { statusCode: 502, body: JSON.stringify({ error: `Failed to load shell: ${res.status}` }) };
    }
    const html = await res.text();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html; charset=UTF-8' },
      body: renderAppShell(html),
    };
  } catch (e: any) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: e?.message || 'Failed to render app shell' }),
    };
  }
};
