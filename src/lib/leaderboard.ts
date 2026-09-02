// Pure helpers for the shared weekly leaderboard.
// No browser globals and no JSX so this module can be imported by the browser
// app (App.tsx), the Express server (server.ts), Netlify Functions, and node:test.

export interface LeaderboardEntry {
  name: string;
  wpm: number;
  accuracy: number;
  weekId: string;
  timestamp: number;
}

export interface LeaderboardRow {
  name: string;
  wpm: number;
  accuracy: number;
}

export interface LeaderboardResponse {
  weekId: string;
  entries: LeaderboardRow[];
  total: number;
}

export const sanitizeName = (name: string): string => (name || 'Anonymous').slice(0, 15);

export const clampScore = (wpm: number, accuracy: number): { wpm: number; accuracy: number } => ({
  wpm: Math.max(0, Math.min(999, Math.round(wpm))),
  accuracy: Math.max(0, Math.min(100, Math.round(accuracy))),
});

export const sortEntries = (entries: LeaderboardEntry[]): LeaderboardEntry[] =>
  [...entries].sort(
    (a, b) => b.wpm - a.wpm || b.accuracy - a.accuracy || a.timestamp - b.timestamp
  );

// Insert a score for a week, replacing any previous entry from the same name,
// then trim to the top `limit` entries overall. Returns a new array.
export const insertScore = (
  entries: LeaderboardEntry[],
  score: LeaderboardEntry,
  limit: number
): LeaderboardEntry[] => {
  const clamped = clampScore(score.wpm, score.accuracy);
  const clean: LeaderboardEntry = {
    name: sanitizeName(score.name),
    wpm: clamped.wpm,
    accuracy: clamped.accuracy,
    weekId: score.weekId,
    timestamp: score.timestamp || Date.now(),
  };
  const next = entries.filter(
    (e) =>
      !(e.weekId === clean.weekId && e.name.toLowerCase() === clean.name.toLowerCase())
  );
  next.push(clean);
  return sortEntries(next).slice(0, limit);
};

export const filterByWeek = (entries: LeaderboardEntry[], weekId: string): LeaderboardEntry[] =>
  entries.filter((e) => e.weekId === weekId);

export const topScores = (entries: LeaderboardEntry[], n: number): LeaderboardRow[] =>
  sortEntries(entries)
    .slice(0, n)
    .map(({ name, wpm, accuracy }) => ({ name, wpm, accuracy }));

export const toLeaderboardResponse = (
  entries: LeaderboardEntry[],
  weekId: string,
  limit: number
): LeaderboardResponse => {
  const weekEntries = filterByWeek(entries, weekId);
  return { weekId, entries: topScores(weekEntries, limit), total: weekEntries.length };
};
