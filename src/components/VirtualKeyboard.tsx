import React, { useState, useEffect, useMemo } from 'react';
import { INSCRIPT_MAP } from '../data';

interface VirtualKeyboardProps {
  currentScript: 'english' | 'hindi';
  nextExpectedChar?: string | null;
  layout?: 'qwerty' | 'dvorak' | 'colemak';
  physicalKeyPresses?: Record<string, number>;
  physicalKeyErrors?: Record<string, number>;
  onKeyClick?: (char: string) => void;
}

const LAYOUTS = {
  qwerty: [
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'"],
    ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"]
  ],
  dvorak: [
    ["'", ",", ".", "p", "y", "f", "g", "c", "r", "l", "[", "]"],
    ["a", "o", "e", "u", "i", "d", "h", "t", "n", "s", "-"],
    [";", "q", "j", "k", "x", "b", "m", "w", "v", "z"]
  ],
  colemak: [
    ["q", "w", "f", "p", "g", "j", "l", "u", "y", ";", "[", "]"],
    ["a", "r", "s", "t", "d", "h", "n", "e", "i", "o", "'"],
    ["z", "x", "c", "v", "b", "k", "m", ",", ".", "/"]
  ]
};

const KEY_CODES: Record<'qwerty' | 'dvorak' | 'colemak', string[][]> = {
  qwerty: [
    ["KeyQ", "KeyW", "KeyE", "KeyR", "KeyT", "KeyY", "KeyU", "KeyI", "KeyO", "KeyP", "BracketLeft", "BracketRight"],
    ["KeyA", "KeyS", "KeyD", "KeyF", "KeyG", "KeyH", "KeyJ", "KeyK", "KeyL", "Semicolon", "Quote"],
    ["KeyZ", "KeyX", "KeyC", "KeyV", "KeyB", "KeyN", "KeyM", "Comma", "Period", "Slash"]
  ],
  dvorak: [
    ["Quote", "Comma", "Period", "KeyP", "KeyY", "KeyF", "KeyG", "KeyC", "KeyR", "KeyL", "BracketLeft", "BracketRight"],
    ["KeyA", "KeyO", "KeyE", "KeyU", "KeyI", "KeyD", "KeyH", "KeyT", "KeyN", "KeyS", "Minus"],
    ["Semicolon", "KeyQ", "KeyJ", "KeyK", "KeyX", "KeyB", "KeyM", "KeyW", "KeyV", "KeyZ"]
  ],
  colemak: [
    ["KeyQ", "KeyW", "KeyF", "KeyP", "KeyG", "KeyJ", "KeyL", "KeyU", "KeyY", "Semicolon", "BracketLeft", "BracketRight"],
    ["KeyA", "KeyR", "KeyS", "KeyT", "KeyD", "KeyH", "KeyN", "KeyE", "KeyI", "KeyO", "Quote"],
    ["KeyZ", "KeyX", "KeyC", "KeyV", "KeyB", "KeyN", "KeyM", "Comma", "Period", "Slash"]
  ]
};

interface KeyButtonProps {
  charKey: string;
  displayChar: string;
  fontClass: string;
  isPressed: boolean;
  isExpected: boolean;
  heatBg: string;
  heatBorder: string;
  heatText: string;
  heatGlow: string;
  onClick?: (char: string) => void;
}

const KeyButtonComponent: React.FC<KeyButtonProps> = ({
  charKey,
  displayChar,
  fontClass,
  isPressed,
  isExpected,
  heatBg,
  heatBorder,
  heatText,
  heatGlow,
  onClick,
}) => {
  let stylingClass = `${heatBg} ${heatBorder} ${heatText} ${heatGlow}`;

  // Pressed & expected override heat styles
  if (isPressed) {
    stylingClass = "bg-[#00F0FF] border-[#00F0FF] text-[#0B0C10] font-black shadow-[0_0_15px_#00F0FF] scale-[0.92] translate-y-[1px]";
  } else if (isExpected) {
    stylingClass = "bg-[#FFB800]/20 border-[#FFB800] text-[#FFB800] font-black shadow-[0_0_14px_rgba(255,184,0,0.5)]";
  }

  return (
    <div
      onClick={() => onClick && onClick(charKey)}
      title={`Click key '${charKey.toUpperCase()}' to launch targeted repair drill`}
      className={`border flex items-center justify-center select-none uppercase shrink-0 transition-colors duration-75 rounded-[4px] md:rounded-[6px] lg:rounded-[8px] cursor-pointer hover:border-amber-400/80 active:scale-95 ${fontClass} ${stylingClass}`}
      style={{
        width: 'calc((100cqw - 30px) / 13)',
        height: 'calc((100cqw - 30px) / 13)',
        maxWidth: '40px',
        maxHeight: '40px',
        minWidth: '18px',
        minHeight: '18px',
        fontSize: 'clamp(8px, calc((100cqw - 30px) / 32), 13px)',
      }}
    >
      <span className="relative z-10 font-bold">{displayChar}</span>
    </div>
  );
};

const KeyButton = React.memo(KeyButtonComponent);

const VirtualKeyboardComponent: React.FC<VirtualKeyboardProps> = ({
  currentScript,
  nextExpectedChar = null,
  layout = 'qwerty',
  physicalKeyPresses = {},
  physicalKeyErrors = {},
  onKeyClick,
}) => {
  const [localPressedCode, setLocalPressedCode] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      setLocalPressedCode(e.code);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      setLocalPressedCode(prev => (prev === e.code ? null : prev));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const isNextExpected = (k: string) => {
    if (!nextExpectedChar) return false;
    const normExpected = nextExpectedChar.toLowerCase();
    
    if (currentScript === 'hindi') {
      const mappedEntry = Object.entries(INSCRIPT_MAP).find(([_, entry]) => 
        entry.base === normExpected || entry.shift === normExpected
      );
      if (mappedEntry) {
        return mappedEntry[0] === k;
      }
    }
    return k === normExpected;
  };

  // Precompute heat map styles once per render instead of sorting on every key iteration
  const keyHeatStyles = useMemo(() => {
    const styles: Record<string, { bg: string; border: string; text: string; glow: string }> = {};

    const pressedKeys = (Object.entries(physicalKeyPresses) as [string, number][])
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);

    const totalPressed = pressedKeys.length;
    const pressedRanks = new Map<string, number>();
    pressedKeys.forEach(([code], index) => {
      pressedRanks.set(code, index);
    });

    const allCodes = new Set<string>();
    Object.values(KEY_CODES).forEach(rows => {
      rows.forEach(row => {
        row.forEach(code => {
          allCodes.add(code);
        });
      });
    });

    allCodes.forEach(code => {
      const pressCount = physicalKeyPresses[code] || 0;
      const errorCount = physicalKeyErrors[code] || 0;

      if (errorCount > 3) {
        styles[code] = {
          bg: 'bg-[#FF4444]/20 animate-pulse',
          border: 'border-[#FF4444]',
          text: 'text-[#FF4444] font-bold',
          glow: 'shadow-[0_0_12px_rgba(255,68,68,0.5)]'
        };
        return;
      }

      if (pressCount === 0) {
        styles[code] = {
          bg: 'bg-[#1F2833]',
          border: 'border-white/5',
          text: 'text-[#C5C6C7]',
          glow: 'shadow-none'
        };
        return;
      }

      const rank = pressedRanks.has(code) ? pressedRanks.get(code)! : -1;
      if (rank !== -1) {
        const percentile = rank / totalPressed;

        if (percentile < 0.2) {
          styles[code] = {
            bg: 'bg-[#00F0FF]/20',
            border: 'border-[#00F0FF]',
            text: 'text-[#00F0FF] font-black',
            glow: 'shadow-[0_0_12px_rgba(0,240,255,0.6),inset_0_0_4px_rgba(0,240,255,0.3)]'
          };
        } else if (percentile < 0.8) {
          styles[code] = {
            bg: 'bg-[#45A29E]/20',
            border: 'border-[#45A29E]',
            text: 'text-[#45A29E] font-bold',
            glow: 'shadow-[0_0_8px_rgba(69,162,158,0.4)]'
          };
        } else {
          styles[code] = {
            bg: 'bg-[#C5C6C7]/10',
            border: 'border-[#C5C6C7]/30',
            text: 'text-[#C5C6C7]/80',
            glow: 'shadow-none'
          };
        }
      } else {
        styles[code] = {
          bg: 'bg-[#1F2833]',
          border: 'border-white/5',
          text: 'text-[#C5C6C7]',
          glow: 'shadow-none'
        };
      }
    });

    return styles;
  }, [physicalKeyPresses, physicalKeyErrors]);

  const keyboardRows = LAYOUTS[layout] || LAYOUTS.qwerty;
  const codeRows = KEY_CODES[layout] || KEY_CODES.qwerty;

  return (
    <div 
      className="keyboard-container keyboard-wrapper flex flex-col gap-[2px] items-center select-none w-full max-w-2xl mx-auto pt-3 pb-0 bg-[#0B0C10]/40 rounded-xl border border-zinc-800/50 px-4"
      style={{ marginBottom: '0px', paddingBottom: '0px', containerType: 'inline-size', width: '100%', overflowX: 'hidden' }}
    >
      {keyboardRows.map((row, rIdx) => (
        <div 
          key={rIdx} 
          className="flex gap-[2px] shrink-0"
          style={rIdx === 2 ? { marginBottom: '6px' } : undefined}
        >
          {row.map((k, colIdx) => {
            let displayChar = k;
            let fontClass = "font-mono";
            
            if (currentScript === 'hindi' && INSCRIPT_MAP[k]) {
              displayChar = INSCRIPT_MAP[k].base;
              fontClass = "font-devanagari font-bold text-xs md:text-sm";
            }

            const code = codeRows[rIdx]?.[colIdx] || '';
            const isPressed = localPressedCode === code;
            const isExpected = isNextExpected(k);

            const heat = keyHeatStyles[code] || {
              bg: 'bg-[#1F2833]',
              border: 'border-white/5',
              text: 'text-[#C5C6C7]',
              glow: 'shadow-none'
            };

            return (
              <KeyButton
                key={`${rIdx}-${colIdx}-${k}`}
                charKey={k}
                displayChar={displayChar}
                fontClass={fontClass}
                isPressed={isPressed}
                isExpected={isExpected}
                heatBg={heat.bg}
                heatBorder={heat.border}
                heatText={heat.text}
                heatGlow={heat.glow}
                onClick={onKeyClick}
              />
            );
          })}
        </div>
      ))}

      {/* Visual Space Bar directly inside keyboard container */}
      <div className="flex gap-[2px] shrink-0 justify-center w-full mt-[2px]" style={{ marginBottom: '6px' }}>
        <div
          className={`border flex items-center justify-center select-none uppercase shrink-0 transition-colors duration-75 font-mono rounded-[4px] md:rounded-[6px] lg:rounded-[8px] ${
            localPressedCode === 'Space'
              ? 'bg-[#00F0FF] border-[#00F0FF] text-[#0B0C10] font-black shadow-[0_0_15px_#00F0FF] scale-[0.92] translate-y-[1px]'
              : nextExpectedChar === ' '
                ? 'bg-[#FFB800]/20 border-[#FFB800] text-[#FFB800] font-black shadow-[0_0_14px_rgba(255,184,0,0.5)]'
                : 'bg-[#1F2833] border-white/5 text-[#C5C6C7]'
          }`}
          style={{
            width: 'min(220px, 45%)',
            height: 'calc((100cqw - 30px) / 13)',
            maxWidth: '220px',
            maxHeight: '40px',
            minWidth: '100px',
            minHeight: '18px',
            fontSize: 'clamp(8px, calc((100cqw - 30px) / 32), 13px)',
          }}
        >
          <span className="relative z-10 font-bold">SPACE</span>
        </div>
      </div>
    </div>
  );
};

export const VirtualKeyboard = React.memo(VirtualKeyboardComponent, (prev, next) => {
  return (
    prev.currentScript === next.currentScript &&
    prev.nextExpectedChar === next.nextExpectedChar &&
    prev.layout === next.layout &&
    prev.physicalKeyPresses === next.physicalKeyPresses &&
    prev.physicalKeyErrors === next.physicalKeyErrors
  );
});
