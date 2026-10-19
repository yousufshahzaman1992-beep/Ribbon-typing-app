// Shared Smart Drill logic for the multi-part "smart drill" queue (Task 2d).
//
// A smart drill is an ordered list of 3 parts that progressively increase in
// difficulty:
//   1. Isolated keys        – raw runs of the target characters.
//   2. Weak bigrams in words – real words containing the slow bigrams.
//   3. Full sentence        – a coherent sentence reusing the weak material.
//
// This module is intentionally pure (no network / no LLM import) so both the
// Netlify function (netlify/functions/generate-smart-drill.ts) and the local
// dev server (server.ts) share exactly one implementation.

export type DrillScript = 'english' | 'hindi';

export interface SmartDrillInput {
  fumbles: string[];
  bigrams: string[];
  weakestFinger: string | null;
  script: DrillScript;
}

export interface SmartDrillPart {
  label: string;
  text: string;
}

export const SMART_DRILL_LABELS = {
  isolated: 'Isolated keys',
  bigrams: 'Weak bigrams in words',
  full: 'Full sentence',
} as const;

const MAX_FUMBLES = 6;
const MAX_BIGRAMS = 5;
const MAX_BIGRAM_LEN = 4;

const DEFAULT_FUMBLES: Record<DrillScript, string[]> = {
  english: ['z', 'q', 'b'],
  hindi: ['क', 'र', 'त'],
};

const DEFAULT_BIGRAMS: Record<DrillScript, string[]> = {
  english: ['th', 'er', 'ou'],
  hindi: ['कर', 'तर'],
};

const FALLBACK_FULL_SENTENCE: Record<DrillScript, string> = {
  english:
    'The quick brown fox jumps over the lazy dog while a brave explorer zips quietly through deep forests and rocky valleys.',
  hindi:
    'एक छोटा चूहा जंगल में दौड़ रहा था और उसने पेड़ के नीचे एक चमकता हुआ पत्थर देखा, फिर खुश होकर आगे बढ़ गया।',
};

function isUsableToken(value: string): boolean {
  return typeof value === 'string' && value.length > 0 && !/[\r\n\t]/.test(value);
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// Accepts both the new object payload shape ({ char, rate } / { bigram, delay })
// and the legacy plain-string arrays, sanitising and de-duplicating the input.
export function normalizeSmartDrillInput(body: any): SmartDrillInput {
  const script: DrillScript = body?.script === 'hindi' ? 'hindi' : 'english';

  const rawFumbles: any[] = Array.isArray(body?.fumbles) ? body.fumbles : [];
  const fumbles: string[] = [];
  for (const item of rawFumbles) {
    const raw = typeof item === 'string' ? item : item && typeof item.char === 'string' ? item.char : '';
    const token = raw.trim();
    if (!isUsableToken(token) || fumbles.includes(token)) continue;
    fumbles.push(token);
    if (fumbles.length >= MAX_FUMBLES) break;
  }

  const rawBigrams: any[] = Array.isArray(body?.bigrams) ? body.bigrams : [];
  const bigrams: string[] = [];
  for (const item of rawBigrams) {
    const raw = typeof item === 'string' ? item : item && typeof item.bigram === 'string' ? item.bigram : '';
    const token = raw.trim();
    if (!isUsableToken(token) || token.length > MAX_BIGRAM_LEN || bigrams.includes(token)) continue;
    bigrams.push(token);
    if (bigrams.length >= MAX_BIGRAMS) break;
  }

  const wf = body?.weakestFinger;
  let weakestFinger: string | null = null;
  if (typeof wf === 'string' && wf.trim()) weakestFinger = wf.trim();
  else if (wf && typeof wf.finger === 'string' && wf.finger.trim()) weakestFinger = wf.finger.trim();

  return { fumbles, bigrams, weakestFinger, script };
}

// Guarantees non-empty fumbles/bigrams so prompts and fallbacks are never blank.
function withDefaults(input: SmartDrillInput): Required<SmartDrillInput> {
  return {
    fumbles: input.fumbles.length > 0 ? input.fumbles : DEFAULT_FUMBLES[input.script],
    bigrams: input.bigrams.length > 0 ? input.bigrams : DEFAULT_BIGRAMS[input.script],
    weakestFinger: input.weakestFinger,
    script: input.script,
  };
}

export function buildSmartDrillPrompt(input: SmartDrillInput): string {
  const { fumbles, bigrams, weakestFinger, script } = withDefaults(input);
  const fumblesStr = fumbles.join(', ');
  const bigramsStr = bigrams.join(', ');
  const fingerClause =
    weakestFinger && weakestFinger !== 'right-thumb' && weakestFinger !== 'left-thumb'
      ? ` The weakest finger is "${weakestFinger}"; favour the keys it controls.`
      : '';

  const shape =
    'Return ONLY minified JSON with exactly this shape and no other text:\n' +
    '{"drills":[{"label":"Isolated keys","text":"..."},' +
    '{"label":"Weak bigrams in words","text":"..."},' +
    '{"label":"Full sentence","text":"..."}]}';

  if (script === 'hindi') {
    return (
      `Create a 3-PART Hindi typing practice drill written in Devanagari script.` +
      ` Target characters: "${fumblesStr}". Target bigrams: "${bigramsStr}".${fingerClause}\n` +
      'Part 1 "Isolated keys": 12-24 keystrokes made ONLY of the target characters, grouped in short runs.\n' +
      'Part 2 "Weak bigrams in words": 8-16 common Hindi words that contain the target bigrams.\n' +
      'Part 3 "Full sentence": one coherent Hindi sentence of 12-25 words reusing the target characters and bigrams.\n' +
      'Use standard Devanagari characters and spaces; no Roman letters, no symbols, no markdown.\n' +
      shape
    );
  }

  return (
    `Create a 3-PART English typing practice drill.` +
    ` Target characters: "${fumblesStr}". Target bigrams: "${bigramsStr}".${fingerClause}\n` +
    'Part 1 "Isolated keys": 12-24 keystrokes made ONLY of the target characters, grouped in short runs (e.g. "jjj kkk lll").\n' +
    'Part 2 "Weak bigrams in words": 8-16 common English words that contain the target bigrams.\n' +
    'Part 3 "Full sentence": one coherent English sentence of 12-25 words reusing the target characters and bigrams.\n' +
    'Use plain ASCII punctuation; no markdown, no code fences, no explanation.\n' +
    shape
  );
}

// Deterministic content used whenever the LLM is unavailable or returns junk,
// so the Smart Drill control never produces an empty queue.
export function buildSmartDrillFallback(input: SmartDrillInput): SmartDrillPart[] {
  const { fumbles, bigrams, script } = withDefaults(input);
  const isolated = fumbles.map((char) => `${char}${char}${char}`).join(' ');
  const bigramWords = bigrams.join(' ');

  return [
    { label: SMART_DRILL_LABELS.isolated, text: isolated },
    { label: SMART_DRILL_LABELS.bigrams, text: bigramWords },
    { label: SMART_DRILL_LABELS.full, text: FALLBACK_FULL_SENTENCE[script] },
  ];
}

function extractJsonObject(raw: string): any | null {
  const stripped = raw.replace(/```(?:json)?/gi, '').trim();
  const start = stripped.indexOf('{');
  const end = stripped.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(stripped.slice(start, end + 1));
  } catch {
    return null;
  }
}

// Parses an LLM response into drill parts. If the response is not valid JSON it
// is treated as a single "Full sentence" drill. Always returns >= 1 usable part.
export function parseSmartDrillResponse(raw: string, input: SmartDrillInput): SmartDrillPart[] {
  const text = (raw || '').trim();
  if (!text) return buildSmartDrillFallback(input);

  const parsed = extractJsonObject(text);
  if (!parsed) {
    return [{ label: SMART_DRILL_LABELS.full, text }];
  }

  const parts: SmartDrillPart[] = [];
  if (Array.isArray(parsed.drills)) {
    for (const drill of parsed.drills) {
      const rawText =
        typeof drill === 'string' ? drill : drill && typeof drill.text === 'string' ? drill.text : '';
      const drillText = rawText.trim();
      if (!drillText) continue;
      const label =
        drill && typeof drill.label === 'string' && drill.label.trim()
          ? drill.label.trim()
          : `Drill ${parts.length + 1}`;
      parts.push({ label, text: drillText });
    }
  } else if (typeof parsed.drill === 'string' && parsed.drill.trim()) {
    // Backward-compatible single-string response.
    parts.push({ label: SMART_DRILL_LABELS.full, text: parsed.drill.trim() });
  }

  if (parts.length === 0) return buildSmartDrillFallback(input);

  // Sanity check: the final part must read like a real sentence, otherwise swap
  // in the deterministic fallback rather than shipping a truncated fragment.
  const last = parts[parts.length - 1];
  if (countWords(last.text) < 4) {
    parts[parts.length - 1] = buildSmartDrillFallback(input)[2];
  }

  return parts;
}
