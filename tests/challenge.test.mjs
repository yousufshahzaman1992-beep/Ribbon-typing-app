import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildChallengeQuery,
  buildChallengeUrl,
  parseChallengeQuery,
  roundTrip,
} from '../src/lib/challenge';

test('buildChallengeQuery encodes name, wpm, acc, minutes', () => {
  const q = buildChallengeQuery('Bob', 72, 94, 60);
  assert.equal(q, 'u=Bob&w=72&a=94&t=1');
});

test('buildChallengeQuery encodes special characters in name', () => {
  const q = buildChallengeQuery('A & B', 10, 90, 60);
  assert.equal(q, 'u=A%20%26%20B&w=10&a=90&t=1');
});

test('buildChallengeQuery trims long names to 15 chars', () => {
  const q = buildChallengeQuery('abcdefghijklmnopqrstuvwxyz', 10, 90, 60);
  assert.match(q, /^u=abcdefghijklmno&/);
});

test('buildChallengeQuery defaults empty name to You', () => {
  const q = buildChallengeQuery('', 10, 90, 60);
  assert.equal(q, 'u=You&w=10&a=90&t=1');
});

test('buildChallengeQuery clamps sub-minute durations to 1 minute', () => {
  assert.equal(buildChallengeQuery('X', 10, 90, 30), 'u=X&w=10&a=90&t=1');
});

test('buildChallengeQuery rounds fractional values', () => {
  const q = buildChallengeQuery('X', 72.4, 93.6, 90);
  assert.equal(q, 'u=X&w=72&a=94&t=2');
});

test('buildChallengeUrl produces full shareable URL', () => {
  const url = buildChallengeUrl('https://example.com/', 'Bob', 72, 94, 60);
  assert.equal(
    url,
    'https://example.com/?challenge=u%3DBob%26w%3D72%26a%3D94%26t%3D1'
  );
});

test('parseChallengeQuery decodes a valid query', () => {
  const parsed = parseChallengeQuery('u=Bob&w=72&a=94&t=1');
  assert.deepEqual(parsed, { name: 'Bob', wpm: 72, acc: 94, minutes: 1 });
});

test('parseChallengeQuery returns null for null or empty input', () => {
  assert.equal(parseChallengeQuery(null), null);
  assert.equal(parseChallengeQuery(''), null);
});

test('parseChallengeQuery returns null for zero/NaN wpm', () => {
  assert.equal(parseChallengeQuery('u=Bob&w=0&a=94&t=1'), null);
  assert.equal(parseChallengeQuery('u=Bob&w=abc&a=94&t=1'), null);
  assert.equal(parseChallengeQuery('u=Bob&a=94&t=1'), null);
});

test('parseChallengeQuery defaults missing fields gracefully', () => {
  const parsed = parseChallengeQuery('u=Bob&w=50');
  assert.deepEqual(parsed, { name: 'Bob', wpm: 50, acc: 0, minutes: 1 });
});

test('parseChallengeQuery defaults missing name to "A friend"', () => {
  const parsed = parseChallengeQuery('w=50&a=90&t=1');
  assert.deepEqual(parsed, { name: 'A friend', wpm: 50, acc: 90, minutes: 1 });
});

test('roundTrip preserves values through encode/decode', () => {
  const round = roundTrip('Bob', 72, 94, 60);
  assert.deepEqual(round, { name: 'Bob', wpm: 72, acc: 94, minutes: 1 });
});

test('full URL round-trip works via ?challenge=', () => {
  const url = buildChallengeUrl('https://example.com/', 'Bob', 72, 94, 120);
  const challenge = new URL(url).searchParams.get('challenge');
  const parsed = parseChallengeQuery(challenge);
  assert.deepEqual(parsed, { name: 'Bob', wpm: 72, acc: 94, minutes: 2 });
});

test('parseChallengeQuery tolerates malformed input without throwing', () => {
  assert.equal(parseChallengeQuery('%'), null);
  assert.equal(parseChallengeQuery('u='), null);
  assert.equal(parseChallengeQuery('=garbage=='), null);
});
