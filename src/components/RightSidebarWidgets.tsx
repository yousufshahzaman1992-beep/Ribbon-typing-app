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

// Helper: Current Monday UTC date as week id (matches App.tsx getCurrentWeekId)
const getCurrentWeekId = (): string => {
  const d = new Date();
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setUTCDate(diff));
  return monday.toISOString().split('T')[0];
};

interface LeaderboardEntry {
  name: string;
  wpm: number;
  accuracy: number;
  isUser?: boolean;
}

const RightSidebarWidgetsImpl: React.FC<RightSidebarWidgetsProps> = ({
  currentScript,
  liveWpm,
  liveAccuracy,
  errorCount,
  streak,
  xp,
  level,
  keyboardLayout,
  onLayoutToggle,
  physicalKeyPresses,
  physicalKeyErrors,
  onOpenLeaderboard,
  onOpenAchievements,
}) => {
  // Find worst key errors for tooltip feedback
  const worstKey = (Object.entries(physicalKeyErrors) as [string, number][]).sort((a, b) => b[1] - a[1])[0];
  const hasErrors = errorCount > 0;

  // Real weekly leaderboard: seed + user PB merged, sorted by wpm
  const leaderboard = React.useMemo((): LeaderboardEntry[] => {
    const weekId = getCurrentWeekId();
    let rows: LeaderboardEntry[] = [];
    try {
      const saved = localStorage.getItem(`ribbon_weekly_leaderboard_${weekId}`);
      if (saved) rows = JSON.parse(saved);
    } catch {
      rows = [];
    }
    let pb: { wpm: number; accuracy: number } | null = null;
    try {
      const savedPb = localStorage.getItem(`ribbon_weekly_pb_${weekId}`);
      if (savedPb) pb = JSON.parse(savedPb);
    } catch {
      pb = null;
    }
    const username = localStorage.getItem("ribbon_username") || "You";
    if (pb) {
      const idx = rows.findIndex((r) => r.isUser);
      if (idx >= 0) {
        rows[idx].wpm = Math.max(rows[idx].wpm, pb.wpm);
        rows[idx].accuracy = Math.max(rows[idx].accuracy, pb.accuracy);
        rows[idx].name = username;
      } else {
        rows.push({ name: username, wpm: pb.wpm, accuracy: pb.accuracy, isUser: true });
      }
    }
    rows.sort((a, b) => b.wpm - a.wpm || b.accuracy - a.accuracy);
    return rows;
  }, []);

  const userIndex = leaderboard.findIndex((r) => r.isUser);
  const topRows = leaderboard.slice(0, 3);
  if (topRows.length === 0 && leaderboard.length > 0) {
    topRows.push(leaderboard[0]);
  }
  const showUserRow = userIndex >= 3;
  const userRow = userIndex >= 0 ? leaderboard[userIndex] : null;

  // Real per-key usage bars (replaces hardcoded fake sparkline)
  const topKeys = Object.entries(physicalKeyPresses as Record<string, number>)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const maxPress = Math.max(1, ...topKeys.map(([, count]) => count));

  // Real XP progress toward next level (replaces static "200/500 words" goal)
  const xpProgress = userXpProgress(xp);

  const rankMedal = (rank: number) => {
    if (rank === 1) return { label: '1', cls: 'bg-amber-400 text-black' };
    if (rank === 2) return { label: '2', cls: 'bg-zinc-300 text-black' };
    if (rank === 3) return { label: '3', cls: 'bg-amber-600 text-black' };
    return { label: `${rank}`, cls: 'bg-zinc-800 text-zinc-400' };
  };

  return (
    <div className="flex flex-col gap-3.5 text-zinc-200 select-none font-sans">
      {/* 1. LIVE SESSION TELEMETRY */}
      <div className="bg-zinc-900/70 border border-zinc-800/60 rounded-2xl p-3.5 backdrop-blur-md space-y-2.5">
        <div className="flex items-center justify-between text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Telemetry</span>
          </div>
          <span className="text-[10px] text-zinc-400 font-mono font-semibold">Session</span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center font-mono">
          <div className="bg-zinc-950/80 border border-zinc-800/60 p-2 rounded-xl">
            <span className="text-[10px] text-zinc-400 block uppercase font-bold">Speed</span>
            <span className="text-base font-black text-emerald-400 block">{liveWpm}</span>
            <span className="text-[10px] text-zinc-500">WPM</span>
          </div>

          <div className="bg-zinc-950/80 border border-zinc-800/60 p-2 rounded-xl">
            <span className="text-[10px] text-zinc-400 block uppercase font-bold">Precision</span>
            <span className="text-base font-black text-emerald-400 block">{liveAccuracy}%</span>
            <span className="text-[10px] text-zinc-500">ACC</span>
          </div>

          <div className="bg-zinc-950/80 border border-zinc-800/60 p-2 rounded-xl">
            <span className="text-[10px] text-zinc-400 block uppercase font-bold">Misses</span>
            <span className="text-base font-black text-rose-400 block">{errorCount}</span>
            <span className="text-[10px] text-zinc-500">ERR</span>
          </div>
        </div>

        {/* Real per-key usage bars this session */}
        {topKeys.length > 0 ? (
          <div className="h-12 w-full bg-zinc-950 border border-zinc-800/40 rounded-lg p-2 flex items-end justify-between gap-1.5 overflow-hidden">
            {topKeys.map(([keyName, count]) => (
              <div key={keyName} className="flex-1 flex flex-col items-center gap-0.5 min-w-0">
                <div
                  className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t transition-all duration-300"
                  style={{ height: `${Math.max(12, Math.round((count / maxPress) * 28))}px` }}
                />
                <span className="text-[8px] text-zinc-500 font-mono truncate w-full text-center">
                  {keyName.replace('Key', '').toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-12 w-full bg-zinc-950 border border-zinc-800/40 rounded-lg flex items-center justify-center text-[10px] text-zinc-500 font-mono">
            Start typing to see key usage
          </div>
        )}
      </div>

      {/* 2. KEYBOARD HEAT MAP */}
      <div className="bg-zinc-900/70 border border-zinc-800/60 rounded-2xl p-3.5 backdrop-blur-md space-y-2.5">
        <div className="flex items-center justify-between text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
          <span>Heat Map</span>
          <button
            onClick={onLayoutToggle}
            className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white transition-all cursor-pointer font-extrabold"
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
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl flex items-center justify-center gap-2 text-[10px] font-mono text-emerald-400 font-bold">
            <span>No mistyped keys yet</span>
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

        {topRows.length > 0 || userRow ? (
          <div className="space-y-1.5 font-mono text-xs">
            {topRows.map((item, idx) => {
              const medal = rankMedal(idx + 1);
              return (
                <div
                  key={`${item.name}-${idx}`}
                  className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                    item.isUser
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-black shadow-sm'
                      : 'bg-zinc-950/60 border-zinc-800/40 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black ${medal.cls}`}>
                      {medal.label}
                    </span>
                    <span className={`font-extrabold ${item.isUser ? 'text-amber-400 font-mono text-xs tracking-wider' : 'text-zinc-300'}`}>
                      {item.isUser ? (item.name || 'You') : item.name}
                    </span>
                  </div>
                  <span className={`font-black ${item.isUser ? 'text-amber-400 text-xs' : 'text-emerald-400'}`}>
                    {item.wpm} WPM
                  </span>
                </div>
              );
            })}
            {showUserRow && userRow && (
              <div className="flex items-center justify-between p-2 rounded-xl border bg-amber-500/15 border-amber-500/40 text-amber-300 font-black shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black bg-zinc-800 text-zinc-400">
                    {userIndex + 1}
                  </span>
                  <span className="font-extrabold text-amber-400 font-mono text-xs tracking-wider">
                    {userRow.name || 'You'}
                  </span>
                </div>
                <span className="font-black text-amber-400 text-xs">{userRow.wpm} WPM</span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/40 text-center text-[10px] text-zinc-500 font-mono">
            No rankings yet this week
          </div>
        )}
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
                      strokeDasharray="138.2" strokeDashoffset={138.2 * (1 - xpProgress)} strokeLinecap="round"
                      transform="rotate(-90 26 26)"/>
            </svg>
            <Award className="absolute inset-0 m-auto w-4 h-4 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-zinc-200 truncate">Level {level}</div>
            <div className="text-[10px] text-zinc-500">Progress: {xp % 500}/500 XP</div>
            {streak > 1 && (
              <div className="text-[10px] text-zinc-500">Streak: {streak} days</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper: 0..1 fraction of progress toward next level
function userXpProgress(xp: number): number {
  const within = xp % 500;
  return Math.max(0, Math.min(1, within / 500));
}

export const RightSidebarWidgets = React.memo(RightSidebarWidgetsImpl);
