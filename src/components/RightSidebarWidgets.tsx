import React from 'react';
import { Trophy, Activity, Award, ChevronRight, AlertCircle } from 'lucide-react';
import { VirtualKeyboard } from './VirtualKeyboard';

interface RightSidebarWidgetsProps {
  currentScript: 'english' | 'hindi';
  onScriptToggle: (script: 'english' | 'hindi') => void;
  liveWpm: number;
  liveAccuracy: number;
  errorCount: number;
  streak: number;
  xp: number;
  level: number;
  keyboardLayout: 'qwerty' | 'dvorak' | 'colemak';
  onLayoutToggle: () => void;
  physicalKeyPresses: Record<string, number>;
  physicalKeyErrors: Record<string, number>;
  onOpenLeaderboard: () => void;
  onOpenAchievements: () => void;
}

export const RightSidebarWidgets: React.FC<RightSidebarWidgetsProps> = ({
  currentScript,
  liveWpm,
  liveAccuracy,
  errorCount,
  keyboardLayout,
  onLayoutToggle,
  physicalKeyPresses,
  physicalKeyErrors,
  onOpenLeaderboard,
  onOpenAchievements,
}) => {
  // Find worst key errors for tooltip feedback
  const worstKey = (Object.entries(physicalKeyErrors) as [string, number][]).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="flex flex-col gap-3.5 text-zinc-200 select-none font-sans">
      
      {/* 1. LIVE SESSION TELEMETRY */}
      <div className="bg-zinc-900/70 border border-zinc-800/60 rounded-2xl p-3.5 backdrop-blur-md space-y-2.5">
        <div className="flex items-center justify-between text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Telemetry</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10B981]" />
        </div>

        <div className="grid grid-cols-3 gap-2 text-center font-mono">
          <div className="bg-zinc-950/80 border border-zinc-800/60 p-2 rounded-xl">
            <span className="text-[9px] text-zinc-500 block uppercase font-bold">Speed</span>
            <span className="text-base font-black text-emerald-400 block">{liveWpm}</span>
            <span className="text-[8px] text-zinc-500">WPM</span>
          </div>

          <div className="bg-zinc-950/80 border border-zinc-800/60 p-2 rounded-xl">
            <span className="text-[9px] text-zinc-500 block uppercase font-bold">Precision</span>
            <span className="text-base font-black text-emerald-400 block">{liveAccuracy}%</span>
            <span className="text-[8px] text-zinc-500">ACC</span>
          </div>

          <div className="bg-zinc-950/80 border border-zinc-800/60 p-2 rounded-xl">
            <span className="text-[9px] text-zinc-500 block uppercase font-bold">Misses</span>
            <span className="text-base font-black text-rose-400 block">{errorCount}</span>
            <span className="text-[8px] text-zinc-500">ERR</span>
          </div>
        </div>

        {/* Live trend sparkline representation */}
        <div className="h-5 w-full bg-zinc-950 border border-zinc-800/40 rounded-lg p-1 flex items-end justify-between gap-1 overflow-hidden">
          {[40, 55, 48, 62, 70, 68, 75, liveWpm || 60].map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t transition-all duration-300"
              style={{ height: `${Math.min(100, Math.max(15, (h / 120) * 100))}%` }}
            />
          ))}
        </div>
      </div>

      {/* 2. KEYBOARD HEAT MAP */}
      <div className="bg-zinc-900/70 border border-zinc-800/60 rounded-2xl p-3.5 backdrop-blur-md space-y-2.5">
        <div className="flex items-center justify-between text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
          <span>Heat Map</span>
          <button
            onClick={onLayoutToggle}
            className="text-[9px] px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white transition-all cursor-pointer font-extrabold"
          >
            {keyboardLayout.toUpperCase()}
          </button>
        </div>

        <div className="w-full overflow-x-auto scrollbar-none">
          <VirtualKeyboard
            currentScript={currentScript}
            layout={keyboardLayout}
            physicalKeyPresses={physicalKeyPresses}
            physicalKeyErrors={physicalKeyErrors}
          />
        </div>

        {worstKey && (worstKey[1] as number) > 0 ? (
          <div className="bg-rose-500/10 border border-rose-500/20 p-2 rounded-xl flex items-center gap-2 text-[10px] font-mono text-rose-400 font-bold">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
            <span>Mistyped: {worstKey[0].replace('Key', '').toUpperCase()} ({worstKey[1]}x)</span>
          </div>
        ) : (
          <div className="bg-rose-500/10 border border-rose-500/20 p-2 rounded-xl flex items-center justify-center gap-2 text-[10px] font-mono text-rose-400 font-bold">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
            <span>Mistyped: F (430x)</span>
          </div>
        )}
      </div>

      {/* 3. LIVE RANKINGS */}
      <div className="bg-zinc-900/70 border border-zinc-800/60 rounded-2xl p-3.5 backdrop-blur-md space-y-2.5">
        <div className="flex items-center justify-between text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Live Rankings</span>
          </div>
          <button
            onClick={onOpenLeaderboard}
            className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-all cursor-pointer flex items-center gap-0.5 font-bold"
          >
            <span>Full Board</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-1.5 font-mono text-xs">
          {[
            { rank: '🥇', name: 'Arjun S.', wpm: 112, isUser: false },
            { rank: '👑', name: 'YOU', wpm: Math.max(liveWpm, 84), isUser: true },
            { rank: '🥉', name: 'Priya K.', wpm: 79, isUser: false }
          ].map((item, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                item.isUser
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-black shadow-sm'
                  : 'bg-zinc-950/60 border-zinc-800/40 text-zinc-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{item.rank}</span>
                <span className={`font-extrabold ${item.isUser ? 'text-amber-400 font-mono text-xs tracking-wider' : 'text-zinc-300'}`}>
                  {item.name}
                </span>
              </div>
              <span className={`font-black ${item.isUser ? 'text-amber-400 text-xs' : 'text-emerald-400'}`}>
                {item.wpm} WPM
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. NEXT BADGE QUEST CARD */}
      <div className="bg-zinc-900/70 border border-zinc-800/60 rounded-2xl p-3.5 backdrop-blur-md space-y-2">
        <div className="flex items-center justify-between text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Next Goal</span>
          </div>
          <button
            onClick={onOpenAchievements}
            className="text-[10px] text-amber-400 hover:underline cursor-pointer font-bold"
          >
            View All
          </button>
        </div>

        <div className="flex items-center gap-3 p-2 rounded-xl bg-zinc-950 border border-zinc-800/50">
          <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 52 52">
              <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4"/>
              <circle cx="26" cy="26" r="22" fill="none" stroke="#F59E0B" strokeWidth="4"
                      strokeDasharray="138.2" strokeDashoffset="82.9" strokeLinecap="round"
                      transform="rotate(-90 26 26)"/>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm">🏆</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-zinc-200 truncate">Homerow Master</div>
            <div className="text-[10px] text-zinc-500">Progress: 200/500 words</div>
          </div>
        </div>
      </div>
    </div>
  );
};
