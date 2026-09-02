import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeXml, buildScorecardSvg } from '../src/lib/ogCard.ts';

test('escapeXml escapes special characters', () => {
  assert.equal(escapeXml(`<b>&"'`), '&lt;b&gt;&amp;&quot;&apos;');
});

test('buildScorecardSvg renders required elements', () => {
  const svg = buildScorecardSvg({ name: 'Bob', wpm: 72, acc: 94, minutes: 2 });
  assert.match(svg, /width="1200" height="630"/);
  assert.match(svg, />72</);
  assert.match(svg, /94% accuracy/);
  assert.match(svg, /Bob scored this/);
  assert.match(svg, /2-minute test/);
  assert.match(svg, /76 WPM/);
});

test('buildScorecardSvg escapes the name', () => {
  const svg = buildScorecardSvg({ name: '<script>alert(1)</script>', wpm: 50, acc: 90, minutes: 1 });
  assert.match(svg, /&lt;script&gt;/);
  assert.doesNotMatch(svg, /<script>/);
});

test('buildScorecardSvg clamps values', () => {
  const svg = buildScorecardSvg({ name: 'X', wpm: -10, acc: 150, minutes: 0 });
  assert.match(svg, />0</);
  assert.match(svg, /100% accuracy/);
  assert.match(svg, /1-minute test/);
});

test('buildScorecardSvg defaults missing name', () => {
  const svg = buildScorecardSvg({ name: '', wpm: 30, acc: 80, minutes: 1 });
  assert.match(svg, /A friend scored this/);
});
