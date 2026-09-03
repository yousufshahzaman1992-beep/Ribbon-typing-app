import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeName,
  clampScore,
  insertScore,
  filterByWeek,
  topScores,
  toLeaderboardResponse,
  sortEntries,
  seedLeaderboard,
} from '../src/lib/leaderboard.ts';

const entry = (name, wpm, accuracy, weekId = '2026-08-31', timestamp = 0) => ({
  name,
  wpm,
  accuracy,
  weekId,
  timestamp,
});

test('sanitizeName trims, defaults, and caps length', () => {
  assert.equal(sanitizeName(''), 'Anonymous');
  assert.equal(sanitizeName('abcdefghijklmnopqrstuvwxyz'), 'abcdefghijklmno');
  assert.equal(sanitizeName('  Bob  '), '  Bob  ');
});

test('clampScore bounds and rounds', () => {
  assert.deepEqual(clampScore(72.4, 93.6), { wpm: 72, accuracy: 94 });
  assert.deepEqual(clampScore(-5, 150), { wpm: 0, accuracy: 100 });
  assert.deepEqual(clampScore(9999, -1), { wpm: 999, accuracy: 0 });
});

test('sortEntries sorts by wpm, then accuracy, then timestamp', () => {
  const sorted = sortEntries([
    entry('a', 50, 90, 'w', 1),
    entry('b', 80, 95, 'w', 2),
    entry('c', 80, 90, 'w', 3),
  ]);
  assert.deepEqual(sorted.map((e) => e.name), ['b', 'c', 'a']);
});

test('insertScore replaces the same name within a week and trims to limit', () => {
  const entries = [
    entry('alice', 100, 95, 'w', 1),
    entry('bob', 90, 90, 'w', 2),
    entry('carol', 80, 80, 'w', 3),
  ];
  const next = insertScore(entries, entry('alice', 110, 97, 'w', 4), 3);
  assert.equal(next.length, 3);
  const alice = next.find((e) => e.name === 'alice');
  assert.equal(alice?.wpm, 110);
  assert.equal(next[0].name, 'alice');
});

test('insertScore keeps different weeks separate', () => {
  const entries = [entry('alice', 100, 95, 'w1', 1)];
  const next = insertScore(entries, entry('alice', 50, 50, 'w2', 2), 10);
  assert.equal(next.length, 2);
});

test('filterByWeek returns only matching week', () => {
  const entries = [entry('a', 1, 1, 'w1'), entry('b', 2, 2, 'w2')];
  assert.equal(filterByWeek(entries, 'w2').length, 1);
});

test('topScores returns top n rows without extra fields', () => {
  const rows = topScores([entry('a', 10, 50), entry('b', 90, 90), entry('c', 50, 80)], 2);
  assert.deepEqual(rows, [
    { name: 'b', wpm: 90, accuracy: 90 },
    { name: 'c', wpm: 50, accuracy: 80 },
  ]);
});

test('toLeaderboardResponse returns entries, total per week', () => {
  const entries = [
    entry('a', 10, 50, 'w1'),
    entry('b', 90, 90, 'w1'),
    entry('c', 50, 80, 'w2'),
  ];
  const res = toLeaderboardResponse(entries, 'w1', 1);
  assert.deepEqual(res, { weekId: 'w1', entries: [{ name: 'b', wpm: 90, accuracy: 90 }], total: 2 });
});

test('seedLeaderboard produces believable, week-scoped, sorted rows', () => {
  const seeds = seedLeaderboard('2026-09-07');
  assert.equal(seeds.length, 12);
  assert.ok(seeds.every((e) => e.weekId === '2026-09-07'));
  assert.ok(seeds.every((e) => e.name && e.wpm > 0 && e.wpm <= 120 && e.accuracy >= 0 && e.accuracy <= 100));
  assert.ok(seeds.every((e, i) => i === 0 || seeds[i - 1].wpm >= e.wpm));
  assert.equal(filterByWeek(seeds, '2026-09-14').length, 0);
});
