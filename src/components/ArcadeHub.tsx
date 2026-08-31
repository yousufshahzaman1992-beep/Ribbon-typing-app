import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Gamepad2, Zap, Target, Link } from 'lucide-react';

// ─── shared word pool — sorted short→long ───────────────────────────────────
const WORDS_EASY   = ['at','do','go','hi','if','in','is','it','me','my','no','of','ok','on','so','to','up','us','we'];
const WORDS_MED    = ['type','fast','code','word','jump','dash','fire','play','win','beat','hit','loop','flow','race','rush','spin','lock'];
const WORDS_HARD   = ['quick','block','chain','combo','speed','track','pixel','level','score','power','blast','rapid','focus','index','shift'];
const WORDS_EXPERT = ['arcade','sprint','reflex','streak','master','target','keyboard','practice','sequence','accuracy'];

const getWordPool = (streak: number) => {
  if (streak < 3)  return WORDS_EASY;
  if (streak < 8)  return WORDS_MED;
  if (streak < 15) return WORDS_HARD;
  return WORDS_EXPERT;
};

// ─── types ───────────────────────────────────────────────────────────────────
type Game = 'menu' | 'invaders' | 'wordsprint' | 'whack' | 'combo';

interface FallingLetter { id: number; char: string; x: number; y: number; speed: number; }
interface WhackKey { id: number; key: string; row: number; col: number; deadline: number; }

interface Props {
  sfx: any;
  onClose: () => void;
}

// ─── ArcadeHub ───────────────────────────────────────────────────────────────
export const ArcadeHub: React.FC<Props> = ({ sfx, onClose }) => {
  const [game, setGame] = useState<Game>('menu');
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const startGame = (g: Game) => { setGame(g); setScore(0); setGameOver(false); };
  const backToMenu = () => { setGame('menu'); setGameOver(false); setScore(0); };

  return (
    <div className="absolute inset-0 bg-[#0B0C10]/96 backdrop-blur-md flex flex-col z-40 select-none rounded-[20px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-4 h-4 text-[#FFB800] animate-pulse" />
          <span className="text-[#FFB800] font-black font-mono uppercase text-sm tracking-wider">
            {game === 'menu' ? 'Ribbon Arcade' : game === 'invaders' ? '🛸 Invaders' : game === 'wordsprint' ? '⚡ Word Sprint' : game === 'whack' ? '🎯 Whack-a-Key' : '🔗 Combo Chain'}
          </span>
          {game !== 'menu' && (
            <span className="ml-2 text-[#00F0FF] font-mono text-xs font-black">SCORE: {score}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {game !== 'menu' && (
            <button onClick={backToMenu} className="text-[10px] font-mono text-zinc-400 hover:text-white px-2 py-1 rounded border border-zinc-700 hover:border-zinc-500 transition-all cursor-pointer">
              ← Menu
            </button>
          )}
          <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative overflow-hidden">
        {game === 'menu' && <ArcadeMenu onSelect={startGame} sfx={sfx} />}
        {game === 'invaders' && <InvadersGame sfx={sfx} score={score} setScore={setScore} gameOver={gameOver} setGameOver={setGameOver} onBack={backToMenu} />}
        {game === 'wordsprint' && <WordSprintGame sfx={sfx} score={score} setScore={setScore} gameOver={gameOver} setGameOver={setGameOver} onBack={backToMenu} />}
        {game === 'whack' && <WhackKeyGame sfx={sfx} score={score} setScore={setScore} gameOver={gameOver} setGameOver={setGameOver} onBack={backToMenu} />}
        {game === 'combo' && <ComboChainGame sfx={sfx} score={score} setScore={setScore} gameOver={gameOver} setGameOver={setGameOver} onBack={backToMenu} />}
      </div>
    </div>
  );
};

// ─── Menu ────────────────────────────────────────────────────────────────────
const GAME_CARDS = [
  { id: 'invaders' as Game, icon: '🛸', title: 'Invaders', desc: 'Type falling letters before they breach your shield', color: '#FFB800', border: 'border-[#FFB800]/30', glow: 'shadow-[0_0_20px_rgba(255,184,0,0.15)]' },
  { id: 'wordsprint' as Game, icon: '⚡', title: 'Word Sprint', desc: 'Type words as fast as you can — race against the clock', color: '#00F0FF', border: 'border-[#00F0FF]/30', glow: 'shadow-[0_0_20px_rgba(0,240,255,0.15)]' },
  { id: 'whack' as Game, icon: '🎯', title: 'Whack-a-Key', desc: 'Keys light up on the keyboard — press them before they vanish', color: '#45A29E', border: 'border-[#45A29E]/30', glow: 'shadow-[0_0_20px_rgba(69,162,158,0.15)]' },
  { id: 'combo' as Game, icon: '🔗', title: 'Combo Chain', desc: 'Type the displayed letter sequence without breaking your streak', color: '#FF6B35', border: 'border-[#FF6B35]/30', glow: 'shadow-[0_0_20px_rgba(255,107,53,0.15)]' },
];

const ArcadeMenu: React.FC<{ onSelect: (g: Game) => void; sfx: any }> = ({ onSelect, sfx }) => (
  <div className="h-full flex flex-col items-center justify-center p-6 gap-4">
    <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest mb-2">Choose your game</p>
    <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
      {GAME_CARDS.map(g => (
        <button
          key={g.id}
          onClick={() => { sfx.playClick(); onSelect(g.id); }}
          className={`flex flex-col items-start p-4 rounded-xl bg-[#141419] border ${g.border} ${g.glow} hover:scale-[1.03] transition-all cursor-pointer text-left gap-2`}
        >
          <span className="text-3xl">{g.icon}</span>
          <span className="font-black font-mono text-sm" style={{ color: g.color }}>{g.title}</span>
          <span className="text-[10px] font-mono text-zinc-500 leading-relaxed">{g.desc}</span>
        </button>
      ))}
    </div>
  </div>
);

// ─── Game Over overlay ────────────────────────────────────────────────────────
const GameOverScreen: React.FC<{ score: number; onRestart: () => void; onMenu: () => void }> = ({ score, onRestart, onMenu }) => (
  <div className="absolute inset-0 bg-[#0B0C10]/90 flex flex-col items-center justify-center gap-5 z-10 animate-in fade-in duration-300">
    <span className="text-5xl">💀</span>
    <div className="text-center">
      <p className="text-white font-black font-mono text-xl uppercase tracking-widest">Game Over</p>
      <p className="text-[#00F0FF] font-mono text-sm mt-1">Score: <b>{score}</b></p>
    </div>
    <div className="flex gap-3">
      <button onClick={onRestart} className="bg-[#FFB800] text-zinc-950 font-black font-mono text-xs px-5 py-2.5 rounded-lg hover:scale-105 transition-all cursor-pointer">Play Again</button>
      <button onClick={onMenu} className="border border-zinc-700 text-zinc-300 font-mono text-xs px-5 py-2.5 rounded-lg hover:bg-zinc-800 transition-all cursor-pointer">← Menu</button>
    </div>
  </div>
);

// ─── GAME 1: Invaders ────────────────────────────────────────────────────────
interface GameProps { sfx: any; score: number; setScore: React.Dispatch<React.SetStateAction<number>>; gameOver: boolean; setGameOver: React.Dispatch<React.SetStateAction<boolean>>; onBack: () => void; }

const InvadersGame: React.FC<GameProps> = ({ sfx, score, setScore, gameOver, setGameOver, onBack }) => {
  const [shield, setShield] = useState(100);
  const [letters, setLetters] = useState<FallingLetter[]>([]);
  const [started, setStarted] = useState(false);
  const [wave, setWave] = useState(1);
  const shieldRef = useRef(100);
  const activeRef = useRef(false);
  const elapsedRef = useRef(0);
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lettersRef = useRef<FallingLetter[]>([]);

  useEffect(() => { lettersRef.current = letters; }, [letters]);

  const getWave = (secs: number) => Math.min(5, 1 + Math.floor(secs / 15));
  const getSpawnMs = (w: number) => [2000, 1500, 1100, 800, 600][w - 1];
  const getSpeed  = (w: number) => [0.5, 0.8, 1.2, 1.6, 2.1][w - 1];

  const restart = () => {
    setShield(100); shieldRef.current = 100; setScore(0); setLetters([]); lettersRef.current = [];
    setGameOver(false); setStarted(false); setWave(1);
    activeRef.current = false; elapsedRef.current = 0;
    if (spawnRef.current) clearInterval(spawnRef.current);
  };

  const start = () => { setStarted(true); activeRef.current = true; sfx.playClick(); };

  // Ramp wave every second
  useEffect(() => {
    if (!started || gameOver) return;
    const clock = setInterval(() => {
      elapsedRef.current += 1;
      const w = getWave(elapsedRef.current);
      setWave(w);
    }, 1000);
    return () => clearInterval(clock);
  }, [started, gameOver]);

  // Re-create spawn timer whenever wave changes
  useEffect(() => {
    if (!started || gameOver) return;
    if (spawnRef.current) clearInterval(spawnRef.current);
    spawnRef.current = setInterval(() => {
      const alphas = 'abcdefghijklmnopqrstuvwxyz';
      const spd = getSpeed(wave) + Math.random() * 0.4;
      const letter: FallingLetter = { id: Date.now() + Math.random(), char: alphas[Math.floor(Math.random() * 26)], x: 10 + Math.random() * 80, y: 0, speed: spd };
      lettersRef.current = [...lettersRef.current, letter];
      setLetters(lettersRef.current);
    }, getSpawnMs(wave));
    return () => { if (spawnRef.current) clearInterval(spawnRef.current); };
  }, [wave, started, gameOver]);

  // Frame loop
  useEffect(() => {
    if (!started || gameOver) return;
    const frame = setInterval(() => {
      const current = lettersRef.current;
      const moved = current.map(l => ({ ...l, y: l.y + l.speed }));
      const breached = moved.filter(l => l.y >= 90);
      if (breached.length > 0) {
        const next = Math.max(0, shieldRef.current - 15 * breached.length);
        shieldRef.current = next; setShield(next);
        if (next <= 0) { setGameOver(true); activeRef.current = false; sfx.playClick(false, true); }
        else sfx.playClick(false, true);
      }
      const survivors = moved.filter(l => l.y < 90);
      lettersRef.current = survivors;
      setLetters(survivors);
    }, 40);
    return () => clearInterval(frame);
  }, [started, gameOver]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (!activeRef.current || gameOver) return;
      const c = e.key.toLowerCase();
      const i = lettersRef.current.findIndex(l => l.char === c);
      if (i !== -1) {
        sfx.playClick();
        setScore(s => s + wave * 10);
        lettersRef.current = lettersRef.current.filter((_, idx) => idx !== i);
        setLetters(lettersRef.current);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [gameOver, wave]);

  const waveColors = ['text-[#45A29E]','text-[#00F0FF]','text-[#FFB800]','text-orange-400','text-red-400'];
  const waveLabels = ['🟢 Wave 1 – Beginner','🔵 Wave 2 – Easy','🟡 Wave 3 – Medium','🟠 Wave 4 – Hard','🔴 Wave 5 – Insane'];

  return (
    <div className="h-full flex flex-col p-3 gap-2">
      {gameOver && <GameOverScreen score={score} onRestart={restart} onMenu={onBack} />}
      <div className="flex items-center justify-between text-[10px] font-mono shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-zinc-500">SHIELD:</span>
          <div className="w-28 h-2 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-red-500 to-[#FFB800] transition-all" style={{ width: `${shield}%` }} /></div>
          <span className="text-[#FFB800] font-black">{shield}%</span>
        </div>
        {started && (
          <span className={`font-black text-[10px] ${waveColors[wave-1]}`}>{waveLabels[wave-1]}</span>
        )}
      </div>
      <div className="flex-1 relative bg-[#080A0E] rounded-xl border border-zinc-800 overflow-hidden">
        {!started ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <span className="text-4xl">🛸</span>
            <p className="font-black font-mono text-sm text-white">Ribbon Invaders</p>
            <p className="text-zinc-400 font-mono text-xs text-center max-w-xs">Starts slow — speeds up every 15 seconds. Type letters before they breach!</p>
            <div className="flex gap-2 text-[9px] font-mono">
              {['🟢 Slow','🔵 Easy','🟡 Med','🟠 Hard','🔴 Max'].map((l,i) => (
                <span key={i} className="bg-zinc-800/60 px-1.5 py-0.5 rounded">{l}</span>
              ))}
            </div>
            <button onClick={start} className="bg-[#FFB800] text-zinc-950 font-black font-mono text-xs px-5 py-2 rounded-lg hover:scale-105 transition-all cursor-pointer mt-1">Activate Shield Grid</button>
          </div>
        ) : letters.map(l => (
          <div key={l.id} className="absolute font-mono font-black text-xl text-[#0B0C10] bg-[#FFB800] px-3 py-1 rounded-lg shadow-lg" style={{ left: `${l.x}%`, top: `${l.y}%`, transform: 'translate(-50%,-50%)' }}>
            {l.char.toUpperCase()}
          </div>
        ))}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-red-500 shadow-[0_0_8px_red]" />
      </div>
    </div>
  );
};

// ─── GAME 2: Word Sprint ──────────────────────────────────────────────────────
const WordSprintGame: React.FC<GameProps> = ({ sfx, score, setScore, gameOver, setGameOver, onBack }) => {
  const [timeLeft, setTimeLeft] = useState(30);
  const [currentWord, setCurrentWord] = useState('');
  const [input, setInput] = useState('');
  const [started, setStarted] = useState(false);
  const [streak, setStreak] = useState(0);
  const [level, setLevel] = useState<'Beginner'|'Easy'|'Medium'|'Expert'>('Beginner');
  const inputRef = useRef<HTMLInputElement>(null);

  const nextWord = useCallback((currentStreak: number) => {
    const pool = getWordPool(currentStreak);
    setCurrentWord(pool[Math.floor(Math.random() * pool.length)]);
    const lv = currentStreak < 3 ? 'Beginner' : currentStreak < 8 ? 'Easy' : currentStreak < 15 ? 'Medium' : 'Expert';
    setLevel(lv);
  }, []);

  const restart = () => { setTimeLeft(30); setScore(0); setInput(''); setStreak(0); setGameOver(false); setStarted(false); nextWord(0); };

  useEffect(() => { nextWord(0); }, []);

  useEffect(() => {
    if (!started || gameOver) return;
    const t = setInterval(() => {
      setTimeLeft(p => (p <= 1 ? 0 : p - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [started, gameOver]);

  useEffect(() => {
    if (started && !gameOver && timeLeft <= 0) {
      setGameOver(true);
    }
  }, [timeLeft, started, gameOver]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!started) { setStarted(true); }
    const val = e.target.value;
    if (val.endsWith(' ') || val === currentWord) {
      if (val.trim() === currentWord) {
        sfx.playClick();
        const newStreak = streak + 1;
        setScore(s => s + 10 * Math.max(1, newStreak));
        setStreak(newStreak);
        nextWord(newStreak);
      } else {
        sfx.playClick(false, true);
        setStreak(0);
        nextWord(0);
      }
      setInput('');
    } else {
      setInput(val);
    }
  };

  const levelColors: Record<string,string> = { Beginner:'text-[#45A29E]', Easy:'text-[#00F0FF]', Medium:'text-[#FFB800]', Expert:'text-red-400' };
  const timerColor = timeLeft <= 5 ? 'text-red-400' : timeLeft <= 10 ? 'text-[#FFB800]' : 'text-[#00F0FF]';

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 gap-6">
      {gameOver && <GameOverScreen score={score} onRestart={restart} onMenu={onBack} />}
      <div className="flex items-center gap-6 text-center">
        <div><p className="text-zinc-500 font-mono text-[9px] uppercase">Time</p><p className={`font-black font-mono text-3xl ${timerColor}`}>{timeLeft}s</p></div>
        <div><p className="text-zinc-500 font-mono text-[9px] uppercase">Streak</p><p className="font-black font-mono text-3xl text-[#FFB800]">×{streak}</p></div>
        <div><p className="text-zinc-500 font-mono text-[9px] uppercase">Level</p><p className={`font-black font-mono text-sm ${levelColors[level]}`}>{level}</p></div>
      </div>
      <div className="bg-[#141419] border border-zinc-700 rounded-2xl px-10 py-6 text-center min-w-[280px]">
        <p className="text-4xl font-black font-mono text-white tracking-widest">{currentWord}</p>
      </div>
      <input
        ref={inputRef}
        autoFocus
        value={input}
        onChange={handleInput}
        disabled={gameOver}
        placeholder={started ? '' : 'Start typing…'}
        className="bg-[#0B0C10] border-2 border-zinc-700 focus:border-[#00F0FF] text-white font-mono text-lg px-4 py-2 rounded-xl outline-none w-64 text-center transition-all"
      />
      <p className="text-zinc-600 font-mono text-[10px] text-center">Words get harder as your streak grows · Streak multiplies points</p>
    </div>
  );
};

// ─── GAME 3: Whack-a-Key ─────────────────────────────────────────────────────
const KEYBOARD_ROWS = [
  ['q','w','e','r','t','y','u','i','o','p'],
  ['a','s','d','f','g','h','j','k','l'],
  ['z','x','c','v','b','n','m'],
];

const WhackKeyGame: React.FC<GameProps> = ({ sfx, score, setScore, gameOver, setGameOver, onBack }) => {
  const [keys, setKeys] = useState<WhackKey[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [started, setStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const idRef = useRef(0);
  const keysRef = useRef<WhackKey[]>([]);
  const spawnMsRef = useRef(1400);
  const deadlineRef = useRef(3000);

  const restart = () => { setKeys([]); keysRef.current = []; setTimeLeft(30); setScore(0); setGameOver(false); setStarted(false); setElapsed(0); };

  // deadline and spawn interval are derived from elapsed (state, triggers re-renders)
  const deadline  = Math.max(900,  3000 - elapsed * 35);
  const spawnMs   = Math.max(400,  1400 - elapsed * 20);

  useEffect(() => { keysRef.current = keys; }, [keys]);
  useEffect(() => { spawnMsRef.current = spawnMs; }, [spawnMs]);
  useEffect(() => { deadlineRef.current = deadline; }, [deadline]);

  const getDiffLabel = () => {
    if (deadline > 2400) return { label:'🟢 Beginner', color:'text-[#45A29E]' };
    if (deadline > 1800) return { label:'🔵 Easy',     color:'text-[#00F0FF]' };
    if (deadline > 1200) return { label:'🟡 Medium',   color:'text-[#FFB800]' };
    return                      { label:'🔴 Expert',   color:'text-red-400' };
  };

  // Self-rescheduling spawn timer — reads latest spawnMs via ref so the
  // ramp shortens the delay without tearing the timer down every second.
  useEffect(() => {
    if (!started || gameOver) return;
    let spawnTimer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      spawnTimer = setTimeout(() => {
        const row = Math.floor(Math.random() * KEYBOARD_ROWS.length);
        const col = Math.floor(Math.random() * KEYBOARD_ROWS[row].length);
        const key = KEYBOARD_ROWS[row][col];
        if (!keysRef.current.some(k => k.key === key)) {
          keysRef.current = [...keysRef.current, { id: idRef.current++, key, row, col, deadline: Date.now() + deadlineRef.current }];
          setKeys(keysRef.current);
        }
        schedule();
      }, spawnMsRef.current);
    };
    schedule();
    return () => { if (spawnTimer) clearTimeout(spawnTimer); };
  }, [started, gameOver]);

  // Main clock — increments elapsed (which shortens spawn delay via ref above)
  useEffect(() => {
    if (!started || gameOver) return;
    const timer = setInterval(() => {
      setElapsed(e => e + 1);
      setTimeLeft(p => (p <= 1 ? 0 : p - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [started, gameOver]);

  useEffect(() => {
    if (started && !gameOver && timeLeft <= 0) setGameOver(true);
  }, [timeLeft, started, gameOver]);

  // Expire missed keys
  useEffect(() => {
    if (!started || gameOver) return;
    const expire = setInterval(() => {
      const now = Date.now();
      const expired = keysRef.current.filter(k => k.deadline < now);
      if (expired.length > 0) {
        sfx.playClick(false, true);
        keysRef.current = keysRef.current.filter(k => k.deadline >= now);
        setKeys(keysRef.current);
      }
    }, 100);
    return () => clearInterval(expire);
  }, [started, gameOver]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (gameOver) return;
      if (!started) setStarted(true);
      const k = e.key.toLowerCase();
      if (keysRef.current.some(key => key.key === k)) {
        sfx.playClick();
        setScore(s => s + 15);
        keysRef.current = keysRef.current.filter(key => key.key !== k);
        setKeys(keysRef.current);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [gameOver, started]);

  const diff = getDiffLabel();
  const timerColor = timeLeft <= 5 ? 'text-red-400' : 'text-[#00F0FF]';

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 gap-4">
      {gameOver && <GameOverScreen score={score} onRestart={restart} onMenu={onBack} />}
      <div className="flex items-center gap-4">
        <p className={`font-black font-mono text-2xl ${timerColor}`}>{timeLeft}s</p>
        <span className={`font-black font-mono text-xs ${diff.color}`}>{diff.label}</span>
        {!started && <p className="text-zinc-400 font-mono text-xs animate-pulse">Press any lit key to start</p>}
      </div>
      <div className="flex flex-col items-center gap-1.5">
        {KEYBOARD_ROWS.map((row, ri) => (
          <div key={ri} className="flex gap-1.5">
            {row.map((k) => {
              const active = keys.find(kk => kk.key === k);
              const progress = active ? Math.max(0, (active.deadline - Date.now()) / 2000) : 1;
              return (
                <div key={k} className={`w-10 h-10 flex items-center justify-center rounded-lg font-mono font-black text-sm border-2 transition-all duration-150 ${active ? 'border-[#FFB800] bg-[#FFB800]/20 text-[#FFB800] shadow-[0_0_15px_rgba(255,184,0,0.4)] scale-110 animate-pulse' : 'border-zinc-800 bg-zinc-900/60 text-zinc-600'}`}>
                  {k.toUpperCase()}
                  {active && <div className="absolute bottom-0 left-0 h-0.5 bg-[#FFB800] transition-all" style={{ width: `${progress * 100}%` }} />}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <p className="text-zinc-600 font-mono text-[10px]">Press lit keys before they disappear · +15 pts each</p>
    </div>
  );
};

// ─── GAME 4: Combo Chain ──────────────────────────────────────────────────────
const genSequence = (len: number) => {
  const chars = 'asdfjkl;ghtyuiop';
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const ComboChainGame: React.FC<GameProps> = ({ sfx, score, setScore, gameOver, setGameOver, onBack }) => {
  const [sequence, setSequence] = useState(() => genSequence(2));
  const [typed, setTyped] = useState('');
  const [combo, setCombo] = useState(0);
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null);

  const restart = () => { setSequence(genSequence(2)); setTyped(''); setCombo(0); setGameOver(false); setFlash(null); setScore(0); };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (gameOver || e.key.length !== 1) return;
      const key = e.key.toLowerCase();
      const next = typed + key;
      if (sequence.startsWith(next)) {
        setTyped(next);
        if (next === sequence) {
          sfx.playClick();
          const newCombo = combo + 1;
          setCombo(newCombo);
          setScore(s => s + 20 * Math.max(1, newCombo));
          setFlash('correct');
          // starts at 2 chars, grows by 1 every 3 combos, caps at 12
          const newLen = Math.min(12, 2 + Math.floor(newCombo / 3));
          setTimeout(() => { setSequence(genSequence(newLen)); setTyped(''); setFlash(null); }, 400);
        }
      } else {
        sfx.playClick(false, true);
        setFlash('wrong');
        setCombo(0);
        setTyped('');
        setTimeout(() => setFlash(null), 300);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [sequence, typed, combo, gameOver]);

  const borderColor = flash === 'correct' ? 'border-[#45A29E] shadow-[0_0_20px_rgba(69,162,158,0.4)]' : flash === 'wrong' ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'border-zinc-700';

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 gap-6">
      {gameOver && <GameOverScreen score={score} onRestart={restart} onMenu={onBack} />}
      <div className="flex items-center gap-6">
        <div className="text-center"><p className="text-zinc-500 font-mono text-[9px] uppercase">Combo</p><p className="text-[#FFB800] font-black font-mono text-3xl">×{combo}</p></div>
        <div className="text-center"><p className="text-zinc-500 font-mono text-[9px] uppercase">Score</p><p className="text-[#00F0FF] font-black font-mono text-3xl">{score}</p></div>
      </div>
      <div className={`border-2 ${borderColor} bg-[#141419] rounded-2xl px-8 py-5 transition-all duration-150`}>
        <div className="flex gap-2 items-center">
          {sequence.split('').map((ch, i) => (
            <span key={i} className={`font-black font-mono text-2xl w-8 h-10 flex items-center justify-center rounded-lg ${i < typed.length ? 'bg-[#45A29E]/30 text-[#45A29E]' : i === typed.length ? 'bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/50 animate-pulse' : 'text-zinc-500'}`}>
              {ch.toUpperCase()}
            </span>
          ))}
        </div>
      </div>
      <p className="text-zinc-600 font-mono text-[10px] text-center">Type the sequence exactly · Build your combo for bonus points<br/>Sequence grows longer as your combo increases</p>
    </div>
  );
};
