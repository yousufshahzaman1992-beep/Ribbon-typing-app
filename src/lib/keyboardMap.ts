import { FINGER_MAP } from '../data';

// Canonical long-form finger labels used by the weakness analyzer.
export type FingerLabel =
  | 'left-pinky'
  | 'left-ring'
  | 'left-middle'
  | 'left-index'
  | 'right-index'
  | 'right-middle'
  | 'right-ring'
  | 'right-pinky'
  | 'left-thumb'
  | 'right-thumb';

// The codebase already defines the single source of truth for key → finger
// assignments in `src/data.ts` (FINGER_MAP, used by HandsGuide/VirtualKeyboard).
// We reuse it here and normalise its short internal labels ('L-pinky', 'Thumb',
// …) into the canonical long-form labels the analyzer expects, so we do not
// maintain a second, conflicting mapping.
const NORMALISE: Record<string, FingerLabel> = {
  'L-pinky': 'left-pinky',
  'L-ring': 'left-ring',
  'L-middle': 'left-middle',
  'L-index': 'left-index',
  'R-index': 'right-index',
  'R-middle': 'right-middle',
  'R-ring': 'right-ring',
  'R-pinky': 'right-pinky',
  'Thumb': 'right-thumb',
};

// Character (lower-case) → canonical finger label.
export const KEY_FINGER_MAP: Record<string, FingerLabel> = Object.fromEntries(
  Object.entries(FINGER_MAP).map(([key, short]) => [key, (NORMALISE[short] || 'right-thumb') as FingerLabel])
) as Record<string, FingerLabel>;

// Map DOM KeyboardEvent.code values (which is what physicalKeyPresses /
// physicalKeyErrors are keyed by) to their character equivalents.
export const CODE_TO_CHAR: Record<string, string> = {
  KeyA: 'a', KeyB: 'b', KeyC: 'c', KeyD: 'd', KeyE: 'e', KeyF: 'f', KeyG: 'g',
  KeyH: 'h', KeyI: 'i', KeyJ: 'j', KeyK: 'k', KeyL: 'l', KeyM: 'm', KeyN: 'n',
  KeyO: 'o', KeyP: 'p', KeyQ: 'q', KeyR: 'r', KeyS: 's', KeyT: 't', KeyU: 'u',
  KeyV: 'v', KeyW: 'w', KeyX: 'x', KeyY: 'y', KeyZ: 'z',
  Digit0: '0', Digit1: '1', Digit2: '2', Digit3: '3', Digit4: '4', Digit5: '5',
  Digit6: '6', Digit7: '7', Digit8: '8', Digit9: '9',
  Space: ' ', Semicolon: ';', Quote: "'", Comma: ',', Period: '.', Slash: '/',
  Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']', Backslash: '\\',
  Backquote: '`',
};

// Resolve a raw key (either a single character or a KeyboardEvent.code) to the
// character it represents, or null if it is not a mapped printable key.
export function resolveKeyChar(key: string): string | null {
  if (!key) return null;
  if (key.length === 1) return key.toLowerCase();
  const mapped = CODE_TO_CHAR[key];
  return mapped !== undefined ? mapped : null;
}

// Return the canonical finger label responsible for a key, or null if the key
// is not part of the standard QWERTY map.
export function getFingerForKey(key: string): string | null {
  const char = resolveKeyChar(key);
  if (char === null) return null;
  return KEY_FINGER_MAP[char] ?? null;
}

// Human-readable form of a canonical finger label: 'left-pinky' → 'Left Pinky'.
export function formatFingerLabel(finger: string | null): string {
  if (!finger) return '';
  return finger
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export const FINGER_LABEL_LIST: FingerLabel[] = [
  'left-pinky', 'left-ring', 'left-middle', 'left-index',
  'right-index', 'right-middle', 'right-ring', 'right-pinky',
  'left-thumb', 'right-thumb',
];
