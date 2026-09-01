// Pure helpers for building and parsing "beat my score" challenge links.
// No browser globals and no JSX so this module can be imported both by the
// browser app (App.tsx) and by node:test.

export interface ChallengeData {
  name: string;
  wpm: number;
  acc: number;
  minutes: number;
}

// Build the inner query string: u=NAME&w=WPM&a=ACC&t=MIN
export const buildChallengeQuery = (
  name: string,
  wpm: number,
  acc: number,
  durationSec: number
): string => {
  const safeName = (name || 'You').slice(0, 15);
  const minutes = Math.max(1, Math.round(durationSec / 60));
  return `u=${encodeURIComponent(safeName)}&w=${Math.round(wpm)}&a=${Math.round(acc)}&t=${minutes}`;
};

// Build a full shareable URL given a base (origin + pathname).
export const buildChallengeUrl = (
  base: string,
  name: string,
  wpm: number,
  acc: number,
  durationSec: number
): string => {
  const query = buildChallengeQuery(name, wpm, acc, durationSec);
  return `${base}?challenge=${encodeURIComponent(query)}`;
};

// Parse an incoming ?challenge= query string back into structured data.
// Returns null for malformed input or when the WPM value is not positive.
export const parseChallengeQuery = (encoded: string | null): ChallengeData | null => {
  if (!encoded) return null;
  try {
    const parts = new URLSearchParams(encoded);
    const name = (parts.get('u') || 'A friend').slice(0, 15);
    const wpm = parseInt(parts.get('w') || '', 10);
    const acc = parseInt(parts.get('a') || '', 10);
    const minutes = parseInt(parts.get('t') || '', 10);
    if (Number.isNaN(wpm) || wpm <= 0) return null;
    return {
      name,
      wpm: Number.isNaN(wpm) ? 0 : wpm,
      acc: Number.isNaN(acc) ? 0 : acc,
      minutes: Number.isNaN(minutes) ? 1 : Math.max(1, minutes),
    };
  } catch (e) {
    return null;
  }
};

// Round-trip guarantee: parse(buildChallengeQuery(...)) returns the same data.
// Note: minutes are computed from seconds, so the caller must pass the same
// durationSec value (or an equivalent minute count) for exact equality.
export const roundTrip = (
  name: string,
  wpm: number,
  acc: number,
  durationSec: number
): ChallengeData | null =>
  parseChallengeQuery(buildChallengeQuery(name, wpm, acc, durationSec));
