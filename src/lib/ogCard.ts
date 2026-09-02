// Pure SVG builder for the dynamic OG scorecard image (1200x630).
// No browser globals and no JSX so this can be imported by the Express server,
// Netlify Functions, and node:test. Rendering to PNG happens in the caller
// with sharp, which uses fontconfig to rasterize the SVG text.

export interface ScorecardData {
  name: string;
  wpm: number;
  acc: number;
  minutes: number;
}

export const escapeXml = (s: string): string =>
  s.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });

export const buildScorecardSvg = (data: ScorecardData): string => {
  const name = escapeXml((data.name || 'A friend').slice(0, 15));
  const wpm = Math.max(0, Math.round(data.wpm));
  const acc = Math.max(0, Math.min(100, Math.round(data.acc)));
  const minutes = Math.max(1, Math.round(data.minutes || 1));
  const challengeWpm = Math.max(1, Math.round(wpm * 1.05));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0B0C10"/>
      <stop offset="1" stop-color="#1C1520"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#F59E0B"/>
      <stop offset="1" stop-color="#FFB800"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="40" y="40" width="1120" height="550" rx="28" fill="none" stroke="#F59E0B" stroke-opacity="0.35" stroke-width="2"/>
  <rect x="420" y="0" width="360" height="8" fill="url(#gold)"/>
  <text x="600" y="120" font-family="DejaVu Sans, sans-serif" font-size="34" font-weight="bold" fill="#F59E0B" text-anchor="middle" letter-spacing="6">RIBBON TYPING COACH</text>
  <text x="600" y="330" font-family="DejaVu Sans, sans-serif" font-size="150" font-weight="bold" fill="#FFFFFF" text-anchor="middle">${wpm}</text>
  <text x="600" y="392" font-family="DejaVu Sans, sans-serif" font-size="40" font-weight="bold" fill="url(#gold)" text-anchor="middle" letter-spacing="6">WPM</text>
  <text x="600" y="450" font-family="DejaVu Sans, sans-serif" font-size="30" fill="#C5C6C7" text-anchor="middle">${acc}% accuracy &#183; ${minutes}-minute test</text>
  <text x="600" y="508" font-family="DejaVu Sans, sans-serif" font-size="26" fill="#9BA1B0" text-anchor="middle">&#8220;${name} scored this &#8212; can you beat it?&#8221;</text>
  <text x="600" y="556" font-family="DejaVu Sans, sans-serif" font-size="20" fill="#5C6070" text-anchor="middle">Type at ${challengeWpm} WPM to take the crown</text>
</svg>`;
};
