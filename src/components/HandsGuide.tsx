import React from 'react';
import { FINGER_MAP, INSCRIPT_MAP } from '../data';

interface HandsGuideProps {
  nextExpectedChar?: string | null;
  currentScript: 'english' | 'hindi';
}

const HandsGuideComponent: React.FC<HandsGuideProps> = ({
  nextExpectedChar = null,
  currentScript,
}) => {
  const getExpectedFinger = (): string | null => {
    if (!nextExpectedChar) return null;
    const lower = nextExpectedChar.toLowerCase();

    if (currentScript === 'hindi') {
      // Find qwerty key that maps to this Hindi char
      const mappedEntry = Object.entries(INSCRIPT_MAP).find(([_, entry]) => 
        entry.base === lower || entry.shift === lower
      );
      if (mappedEntry) {
        return FINGER_MAP[mappedEntry[0]] || null;
      }
    }
    return FINGER_MAP[lower] || null;
  };

  const activeFinger = getExpectedFinger();

  const getFingerDisplayLabel = (finger: string | null): string => {
    if (!finger) return '';
    switch (finger) {
      case 'L-pinky': return 'Left Pinky';
      case 'L-ring': return 'Left Ring Finger';
      case 'L-middle': return 'Left Middle Finger';
      case 'L-index': return 'Left Index Finger';
      case 'R-index': return 'Right Index Finger';
      case 'R-middle': return 'Right Middle Finger';
      case 'R-ring': return 'Right Ring Finger';
      case 'R-pinky': return 'Right Pinky';
      case 'Thumb': return 'Either Thumb (Spacebar)';
      default: return '';
    }
  };

  const FingerIndicator = ({ fingerId, label, height, isThumb = false }: {
    fingerId: string;
    label: string;
    height: string;
    isThumb?: boolean;
  }) => {
    const isActive = activeFinger === fingerId;
    return (
      <div className="flex flex-col items-center justify-end gap-1 select-none">
        {/* Active Pulse Dot */}
        <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
          isActive ? 'bg-[#eac97c] shadow-[0_0_8px_#eac97c] scale-125' : 'bg-transparent'
        }`} />
        {/* Finger visual representation */}
        <div className={`w-3.5 ${height} rounded-t-full transition-all duration-300 border ${
          isActive 
            ? 'bg-gradient-to-t from-[#cba052] to-[#eac97c] border-[#eac97c] shadow-[0_0_12px_rgba(203,160,82,0.5)] scale-105' 
            : 'bg-zinc-900/60 border-zinc-800 text-zinc-500'
        }`} />
        {/* Tiny font label */}
        <span className={`text-[7px] font-mono uppercase tracking-tighter ${isActive ? 'text-[#eac97c] font-bold' : 'text-zinc-600'}`}>
          {isThumb ? 'Thumb' : label}
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-3 bg-zinc-950/20 rounded-xl border border-zinc-900/30 p-4 w-full max-w-xl mx-auto shadow-inner">
      {/* Sub-header instruction box */}
      <div className="text-center">
        {nextExpectedChar ? (
          <div className="font-mono text-xs text-zinc-400">
            Next key:{' '}
            <span className="text-[#eac97c] font-bold px-1.5 py-0.5 bg-[#cba052]/10 border border-[#cba052]/30 rounded uppercase mr-2">
              {nextExpectedChar === ' ' ? 'Space' : nextExpectedChar}
            </span>
            Finger:{' '}
            <span className="text-[#eac97c] font-extrabold underline decoration-[#cba052] decoration-2">
              {getFingerDisplayLabel(activeFinger)}
            </span>
          </div>
        ) : (
          <div className="font-mono text-xs text-zinc-500 italic">
            Place your fingers on Home Row (A S D F - J K L ;)
          </div>
        )}
      </div>

      <div className="flex gap-12 sm:gap-20 justify-center items-end select-none">
        {/* Left Hand Representation */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="font-mono text-[8px] text-zinc-500 uppercase tracking-widest font-bold">Left Hand</span>
          <div className="flex items-end gap-2 h-16 bg-zinc-950/40 px-3.5 py-2 rounded-xl border border-zinc-900/50">
            <FingerIndicator fingerId="L-pinky" label="Pinky" height="h-8" />
            <FingerIndicator fingerId="L-ring" label="Ring" height="h-11" />
            <FingerIndicator fingerId="L-middle" label="Middle" height="h-12" />
            <FingerIndicator fingerId="L-index" label="Index" height="h-10" />
            <FingerIndicator fingerId="Thumb" label="Thumb" height="h-6" isThumb={true} />
          </div>
        </div>

        {/* Right Hand Representation */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="font-mono text-[8px] text-zinc-500 uppercase tracking-widest font-bold">Right Hand</span>
          <div className="flex items-end gap-2 h-16 bg-zinc-950/40 px-3.5 py-2 rounded-xl border border-zinc-900/50">
            <FingerIndicator fingerId="Thumb" label="Thumb" height="h-6" isThumb={true} />
            <FingerIndicator fingerId="R-index" label="Index" height="h-10" />
            <FingerIndicator fingerId="R-middle" label="Middle" height="h-12" />
            <FingerIndicator fingerId="R-ring" label="Ring" height="h-11" />
            <FingerIndicator fingerId="R-pinky" label="Pinky" height="h-8" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const HandsGuide = React.memo(HandsGuideComponent);
