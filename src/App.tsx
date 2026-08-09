import React, { useState, useEffect, useRef, useMemo, useCallback, useTransition } from 'react';
import { TypingText } from './components/TypingText';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Keyboard,
  Gamepad2,
  BarChart3,
  Settings,
  Flame,
  Check,
  RotateCcw,
  X,
  Award,
  Volume2,
  VolumeX,
  Sparkles,
  Shield,
  Activity,
  Sliders,
  ChevronDown,
  ChevronUp,
  Info,
  RefreshCw,
  Globe,
  Trophy,
  Plus,
  Pause,
  Play,
  Wrench,
  Maximize,
  Minimize,
  Timer,
  Menu,
  ChevronLeft,
  ChevronRight,
  Users,
  Palette,
  History,
  Target,
  Headphones,
  Download,
  Upload,
  Clock,
  Zap,
  Trash2
} from 'lucide-react';
import { VirtualKeyboard } from './components/VirtualKeyboard';
import { ArcadeHub } from './components/ArcadeHub';
import { OnboardingModal } from './components/OnboardingModal';
import { RightSidebarWidgets } from './components/RightSidebarWidgets';
import { ToastNotification, ToastItem } from './components/ToastNotification';

import { LESSONS } from './data';
import { STORIES_LIT1 } from './stories_lit1';
import { PASSAGES } from './passages';
import { Lesson, SessionHistoryItem } from './types';
import { generateStory, generateText } from './lib/llmProvider';

// Web Audio API Sound Synthesizer for tactile mechanical clacks
class MechanicalFeedback {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  public volume: number = 0.5;
  public preset: 'blue' | 'red' | 'brown' | 'silent' | 'typewriter' | 'arcade' = 'blue';

  constructor() { }

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  public playClick(isSpace: boolean = false, isError: boolean = false) {
    if (!this.enabled || this.preset === 'silent') return;
    try {
      this.init();
      if (!this.ctx) return;

      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const ctx = this.ctx;
      const volume = this.volume;
      const preset = this.preset;

      // Defer heavy node creation and audio graph setup to keep typing render crisp and non-blocking
      setTimeout(() => {
        try {
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();

          if (isError) {
            if (preset === 'arcade') {
              osc.type = 'sawtooth';
              osc.frequency.setValueAtTime(120, ctx.currentTime);
              osc.frequency.linearRampToValueAtTime(30, ctx.currentTime + 0.15);
            } else if (preset === 'typewriter') {
              osc.type = 'sawtooth';
              osc.frequency.setValueAtTime(90, ctx.currentTime);
              osc.frequency.linearRampToValueAtTime(40, ctx.currentTime + 0.2);
            } else {
              osc.type = 'triangle';
              osc.frequency.setValueAtTime(130, ctx.currentTime);
              osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.12);
            }
            gainNode.gain.setValueAtTime(0.2 * volume, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.12);
          } else if (isSpace) {
            if (preset === 'blue') {
              osc.type = 'sine';
              osc.frequency.setValueAtTime(110, ctx.currentTime);
              osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.08);
              gainNode.gain.setValueAtTime(0.25 * volume, ctx.currentTime);
            } else if (preset === 'red') {
              osc.type = 'triangle';
              osc.frequency.setValueAtTime(80, ctx.currentTime);
              osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.1);
              gainNode.gain.setValueAtTime(0.22 * volume, ctx.currentTime);
            } else if (preset === 'brown') {
              osc.type = 'sine';
              osc.frequency.setValueAtTime(70, ctx.currentTime);
              osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.06);
              gainNode.gain.setValueAtTime(0.18 * volume, ctx.currentTime);
            } else if (preset === 'typewriter') {
              osc.type = 'sine';
              osc.frequency.setValueAtTime(1600, ctx.currentTime);
              osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.15);
              gainNode.gain.setValueAtTime(0.3 * volume, ctx.currentTime);
            } else {
              osc.type = 'square';
              osc.frequency.setValueAtTime(160, ctx.currentTime);
              osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.1);
              gainNode.gain.setValueAtTime(0.08 * volume, ctx.currentTime);
            }
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (preset === 'typewriter' ? 0.25 : 0.1));
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + (preset === 'typewriter' ? 0.25 : 0.1));
          } else {
            if (preset === 'blue') {
              osc.type = 'sine';
              osc.frequency.setValueAtTime(1200, ctx.currentTime);
              osc.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.04);
              gainNode.gain.setValueAtTime(0.15 * volume, ctx.currentTime);
            } else if (preset === 'red') {
              osc.type = 'triangle';
              osc.frequency.setValueAtTime(340, ctx.currentTime);
              osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.05);
              gainNode.gain.setValueAtTime(0.18 * volume, ctx.currentTime);
            } else if (preset === 'brown') {
              osc.type = 'sine';
              osc.frequency.setValueAtTime(200, ctx.currentTime);
              osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.04);
              gainNode.gain.setValueAtTime(0.12 * volume, ctx.currentTime);
            } else if (preset === 'typewriter') {
              osc.type = 'triangle';
              osc.frequency.setValueAtTime(950, ctx.currentTime);
              osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.03);
              gainNode.gain.setValueAtTime(0.25 * volume, ctx.currentTime);
            } else {
              osc.type = 'sine';
              osc.frequency.setValueAtTime(800, ctx.currentTime);
              osc.frequency.linearRampToValueAtTime(1100, ctx.currentTime + 0.05);
              gainNode.gain.setValueAtTime(0.08 * volume, ctx.currentTime);
            }
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.05);
          }
        } catch (e) { }
      }, 0);
    } catch (e) {
      // Audio lock fallback
    }
  }
}

const sfx = new MechanicalFeedback();

const JS_KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'return', 'async', 'await',
  'try', 'catch', 'if', 'else', 'for', 'while', 'switch', 'case', 'break', 'default',
  'import', 'export', 'class', 'extends', 'new', 'this', 'throw', 'typeof'
]);

const MEDICAL_TERMS = new Set([
  'gastroenterology', 'electroencephalogram', 'pseudohyponatremia',
  'hepatic', 'encephalopathy', 'sphincterotome', 'choledocholithiasis',
  'otolaryngology', 'cardiothoracic', 'electrocardiography', 'atherosclerosis',
  'myocardial', 'infarction', 'thoracotomy', 'glomerulonephritis',
  'immunosuppressants', 'nephrotoxicity', 'leukopenia', 'pharmacology',
  'thrombocytopenia', 'microangiopathic', 'hemolytic', 'anemia', 'hematological'
]);

const CODE_SNIPPETS = [
  "const fetchData = async () => { try { await api.call(); } catch (e) {} };",
  "const calculateSum = (arr) => { return arr.reduce((acc, val) => acc + val, 0); };",
  "const findActiveUser = (users) => { return users.find(u => u.isActive === true); };",
  "const renderComponent = ({ items }) => { return ( <div> {items.map(i => <span key={i.id}>{i.name}</span>)} </div> ); };",
  "const useToggle = (initialValue = false) => { const [state, setState] = useState(initialValue); return [state, () => setState(s => !s)]; };"
];

const MEDICAL_PRACTICE_TEXTS = [
  "In gastroenterology, an electroencephalogram might be ordered if hepatic encephalopathy is suspected. This metabolic disorder arises from liver dysfunction leading to neurocognitive impairment. Diagnostic steps often require a complete evaluation of electrolytes, as acute pseudohyponatremia or hyperbilirubinemia can confound cognitive symptoms during clinical evaluation.",
  "Otolaryngology residents frequently study sphincterotome placement and choledocholithiasis interventions during gastroenterology rotations. In emergency cardiology, signs of atherosclerosis or myocardial infarction necessitate immediate electrocardiography. Simultaneously, the surgical staff must prepare for thoracotomy in cases of severe cardiothoracic trauma.",
  "The administration of immunosuppressants during glomerulonephritis therapy requires careful monitoring for potential nephrotoxicity or severe leukopenia. Furthermore, the pharmacology team cross-references thrombocytopenia markers to avert acute microangiopathic hemolytic anemia, a life-threatening hematological complication."
];

const countMedicalTermsTyped = (typed: string, target: string): number => {
  const targetWords = target.split(/\s+/);
  let count = 0;

  let currentTargetCharIndex = 0;
  for (let i = 0; i < targetWords.length; i++) {
    const word = targetWords[i];
    const wordLen = word.length;
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');

    if (MEDICAL_TERMS.has(cleanWord)) {
      const wordEndInTarget = currentTargetCharIndex + wordLen;
      if (typed.length >= wordEndInTarget) {
        const typedPart = typed.substring(currentTargetCharIndex, wordEndInTarget);
        const targetPart = target.substring(currentTargetCharIndex, wordEndInTarget);
        if (typedPart === targetPart) {
          count++;
        }
      }
    }
    currentTargetCharIndex += wordLen + 1; // +1 for space
  }
  return count;
};

const getLayoutCharFromEvent = (e: KeyboardEvent, layout: 'qwerty' | 'dvorak' | 'colemak'): string => {
  const code = e.code;
  const isShift = e.shiftKey;

  const codeToChar: Record<string, { qwerty: string; dvorak: string; colemak: string }> = {
    KeyQ: { qwerty: 'q', dvorak: "'", colemak: 'q' },
    KeyW: { qwerty: 'w', dvorak: ',', colemak: 'w' },
    KeyE: { qwerty: 'e', dvorak: '.', colemak: 'f' },
    KeyR: { qwerty: 'r', dvorak: 'p', colemak: 'p' },
    KeyT: { qwerty: 't', dvorak: 'y', colemak: 'g' },
    KeyY: { qwerty: 'y', dvorak: 'f', colemak: 'j' },
    KeyU: { qwerty: 'u', dvorak: 'g', colemak: 'l' },
    KeyI: { qwerty: 'i', dvorak: 'c', colemak: 'u' },
    KeyO: { qwerty: 'o', dvorak: 'r', colemak: 'y' },
    KeyP: { qwerty: 'p', dvorak: 'l', colemak: ';' },

    KeyA: { qwerty: 'a', dvorak: 'a', colemak: 'a' },
    KeyS: { qwerty: 's', dvorak: 'o', colemak: 'r' },
    KeyD: { qwerty: 'd', dvorak: 'e', colemak: 's' },
    KeyF: { qwerty: 'f', dvorak: 'u', colemak: 't' },
    KeyG: { qwerty: 'g', dvorak: 'i', colemak: 'd' },
    KeyH: { qwerty: 'h', dvorak: 'd', colemak: 'h' },
    KeyJ: { qwerty: 'j', dvorak: 'h', colemak: 'n' },
    KeyK: { qwerty: 'k', dvorak: 't', colemak: 'e' },
    KeyL: { qwerty: 'l', dvorak: 'n', colemak: 'i' },
    Semicolon: { qwerty: ';', dvorak: 's', colemak: 'o' },

    KeyZ: { qwerty: 'z', dvorak: ';', colemak: 'z' },
    KeyX: { qwerty: 'x', dvorak: 'q', colemak: 'x' },
    KeyC: { qwerty: 'c', dvorak: 'j', colemak: 'c' },
    KeyV: { qwerty: 'v', dvorak: 'k', colemak: 'v' },
    KeyB: { qwerty: 'b', dvorak: 'x', colemak: 'b' },
    KeyN: { qwerty: 'n', dvorak: 'b', colemak: 'k' },
    KeyM: { qwerty: 'm', dvorak: 'm', colemak: 'm' },
    Comma: { qwerty: ',', dvorak: 'w', colemak: ',' },
    Period: { qwerty: '.', dvorak: 'v', colemak: '.' },
    Slash: { qwerty: '/', dvorak: 'z', colemak: '/' }
  };

  const mapping = codeToChar[code];
  if (!mapping) {
    return e.key;
  }

  const char = mapping[layout];
  return isShift ? char.toUpperCase() : char;
};

const formatTimer = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const formatParagraphToLines = (text: string, maxChars: number = 65): string => {
  const clean = text.replace(/\s+/g, ' ').trim();
  const words = clean.split(' ');
  const lines: string[] = [];
  let currentLine: string[] = [];
  let currentLength = 0;

  for (const word of words) {
    if (currentLength + word.length + (currentLine.length > 0 ? 1 : 0) > maxChars && currentLine.length > 0) {
      lines.push(currentLine.join(' '));
      currentLine = [word];
      currentLength = word.length;
    } else {
      currentLine.push(word);
      currentLength += word.length + (currentLine.length > 1 ? 1 : 0);
    }
  }
  if (currentLine.length > 0) {
    lines.push(currentLine.join(' '));
  }
  return lines.join('\n');
};

interface CustomPracticePlaygroundProps {
  loadLesson: (lesson: Lesson) => void;
  sfx: any;
}

const CustomPracticePlayground: React.FC<CustomPracticePlaygroundProps> = ({ loadLesson, sfx }) => {
  const [text, setText] = React.useState<string>("");

  return (
    <div className="pt-4 border-t border-zinc-800 space-y-3 text-left">
      <span className="text-[10px] font-mono text-[#FFB800] uppercase tracking-wider block font-bold">Custom Practice Playground</span>
      <div className="bg-[#181822] p-4 rounded-[12px] border border-zinc-850 space-y-3">
        <p className="text-[11px] text-zinc-400 font-mono leading-relaxed">Type or paste any paragraph, programming code, or legal text below to generate your own custom, high-velocity practice session.</p>
        <textarea
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste or write your custom text here... e.g. const typingMaster = true; console.log('Keep coding!');"
          className="w-full bg-[#0F0F12] border border-zinc-800 rounded-[8px] p-2.5 text-xs font-mono text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-[#FFB800] transition-colors resize-none"
        />
        <button
          onClick={() => {
            if (!text.trim()) return;
            const customLesson: Lesson = {
              id: 8888,
              name: "✏️ Custom Practice Playground",
              desc: "User-defined training session",
              keys: null,
              customText: text.trim()
            };
            loadLesson(customLesson);
            sfx.playClick();
          }}
          disabled={!text.trim()}
          className="w-full bg-[#FFB800] hover:bg-[#FFB800]/90 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 font-extrabold text-xs py-2 rounded-[8px] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Load Custom Paragraph Drill</span>
        </button>
      </div>
    </div>
  );
};

// ─── N-GRAM SMART COMPOSE ENGINE (zero-cost, no API) ────────────────────────
const SMART_COMPOSE_WORDS = [
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it', 'for', 'not', 'on', 'with',
  'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her',
  'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up',
  'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time',
  'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could',
  'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think',
  'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even',
  'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us', 'between', 'need',
  'large', 'often', 'hand', 'high', 'place', 'hold', 'turn', 'such', 'here', 'each', 'around',
  'long', 'thing', 'great', 'same', 'tell', 'last', 'never', 'keep', 'old', 'while', 'find',
  'every', 'where', 'though', 'thought', 'through', 'without', 'much', 'before', 'right', 'too',
  'mean', 'down', 'call', 'little', 'few', 'both', 'next', 'home', 'should', 'world', 'still',
  'three', 'small', 'set', 'put', 'always', 'open', 'seem', 'together', 'white', 'children',
  'begin', 'got', 'walk', 'fact', 'once', 'read', 'city', 'those', 'help', 'against', 'slow',
  'center', 'love', 'person', 'money', 'serve', 'appear', 'road', 'rule', 'cold', 'notice',
  'voice', 'unit', 'power', 'town', 'fine', 'drive', 'short', 'lead', 'listen', 'wind', 'point',
  'play', 'spell', 'add', 'land', 'done', 'music', 'letter', 'sentence', 'language', 'shape',
  'number', 'group', 'watch', 'learn', 'plant', 'cover', 'food', 'drink', 'mind', 'behind',
  'near', 'equal', 'ground', 'possible', 'island', 'complete', 'size', 'especially', 'quite',
  'certain', 'result', 'real', 'produce', 'example', 'change', 'view', 'surface', 'building',
  'nothing', 'rest', 'carefully', 'inside', 'wheels', 'stay', 'green', 'known', 'island',
  'week', 'less', 'machine', 'figure', 'star', 'noun', 'field', 'able', 'pound', 'beauty',
  'contain', 'front', 'final', 'given', 'glass', 'grass', 'product', 'numeral', 'wind',
  'question', 'happen', 'ship', 'half', 'rock', 'order', 'fire', 'south', 'problem', 'piece',
  'since', 'whole', 'space', 'heard', 'best', 'hour', 'better', 'true', 'during', 'hundred',
  'five', 'remember', 'step', 'early', 'west', 'interest', 'reach', 'fast', 'verb', 'sing',
  'six', 'table', 'travel', 'morning', 'simple', 'several', 'vowel', 'toward', 'war', 'lay',
  'beautiful', 'believe', 'different', 'follow', 'important', 'another', 'sometimes',
  'understand', 'thousand', 'probably', 'whether', 'however', 'although', 'themselves',
  'everything', 'writing', 'following', 'according', 'perhaps', 'already', 'anyone',
  'anything', 'himself', 'herself', 'itself', 'someone', 'somewhere', 'suddenly', 'whatever',
  'whenever', 'children', 'between', 'without', 'through', 'special', 'moving', 'common',
  'class', 'quickly', 'slowly', 'simply', 'family', 'school', 'country', 'answer', 'pretty',
  'become', 'before', 'always', 'number', 'people', 'really', 'started', 'turned', 'called',
  'looked', 'seemed', 'asked', 'given', 'taken', 'known', 'shown', 'heard', 'brought', 'found'
].filter((v, i, a) => a.indexOf(v) === i);

function getSmartSuggestion(partialWord: string): string {
  if (!partialWord || partialWord.length < 2) return '';
  const lower = partialWord.toLowerCase();
  const match = SMART_COMPOSE_WORDS.find(
    w => w.startsWith(lower) && w.length > lower.length
  );
  return match ? match.slice(lower.length) : '';
}

export default function App() {
  // Navigation & UI Layout State
  const [activeModal, setActiveModal] = useState<'lessons' | 'practice' | 'stats' | 'settings' | 'leaderboard' | 'achievements' | 'friends' | 'themes' | 'history' | 'goals' | 'sounds' | 'calendar' | null>(null);
  const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(true);

  // Custom Story & Text State
  const [customStoryModalOpen, setCustomStoryModalOpen] = useState<boolean>(false);
  const [customStoryTitle, setCustomStoryTitle] = useState<string>('');
  const [customStoryContent, setCustomStoryContent] = useState<string>('');
  const [customStories, setCustomStories] = useState<Lesson[]>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('ribbon_custom_user_stories');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          return [];
        }
      }
    }
    return [];
  });

  // Redesign: XP, Level & Toast Notification State
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('ribbon_onboarding_done') !== 'true';
    }
    return false;
  });

  const [userXp, setUserXp] = useState<number>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('ribbon_user_xp');
      return saved ? parseInt(saved, 10) : 180;
    }
    return 180;
  });

  const userLevel = useMemo(() => Math.floor(userXp / 500) + 1, [userXp]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((title: string, desc: string, type: 'achievement' | 'levelup' | 'streak' | 'info' = 'info') => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts(prev => [...prev, { id, title, desc, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const handleHorizontalWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY !== 0 && !e.shiftKey) {
      e.currentTarget.scrollLeft += e.deltaY;
    }
  }, []);

  const handleSaveAndStartCustomStory = (startImmediately: boolean = true) => {
    if (!customStoryContent.trim()) return;
    const title = customStoryTitle.trim() || `Custom Story #${customStories.length + 1}`;
    const newCustomLesson: Lesson = {
      id: 88000 + Date.now(),
      name: `🎨 ${title}`,
      keys: null,
      desc: `User Created Story • ${customStoryContent.trim().split(/\s+/).length} words`,
      category: currentScript === 'hindi' ? "Practice Stories (Hindi)" : "Practice Stories",
      customText: customStoryContent.trim()
    };

    const updated = [newCustomLesson, ...customStories];
    setCustomStories(updated);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('ribbon_custom_user_stories', JSON.stringify(updated));
    }

    if (startImmediately) {
      loadLesson(newCustomLesson);
      setFreestyleMode(false);
      setCustomStoryModalOpen(false);
      setCustomStoryTitle('');
      setCustomStoryContent('');
      addToast('Custom Story Loaded', `Started practicing "${title}"`, 'info');
    } else {
      addToast('Custom Story Saved', `Saved "${title}" to practice stories`, 'info');
      setCustomStoryTitle('');
      setCustomStoryContent('');
    }
  };

  const handleDeleteCustomStory = (storyId: number) => {
    const updated = customStories.filter(s => s.id !== storyId);
    setCustomStories(updated);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('ribbon_custom_user_stories', JSON.stringify(updated));
    }
    addToast('Story Removed', 'Custom story deleted from your list', 'info');
  };

  // Auto-collapse sidebar on mobile screens on mount
  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarExpanded(false);
    }
  }, []);
  const [mobileStatsOpen, setMobileStatsOpen] = useState<boolean>(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ribbon-panel-collapsed') === 'true';
    }
    return false;
  });
  const [keyboardVisibleOnMobile, setKeyboardVisibleOnMobile] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [aiStoryOpen, setAiStoryOpen] = useState<boolean>(false);
  const [weaknessOpen, setWeaknessOpen] = useState<boolean>(false);
  // Unified typing state for batch updates
  const [typingState, setTypingState] = useState<{
    typedText: string;
    physicalKeyPresses: Record<string, number>;
    physicalKeyErrors: Record<string, number>;
    fumbles: Record<string, number>;
    mistypedNewlineIndices: Set<number>;
    autoInsertedBrackets: number[];
    punishedTokenIndex: number | null;
  }>(() => {
    const savedKeyPresses = typeof localStorage !== 'undefined' ? localStorage.getItem("physicalKeyPresses") : null;
    const savedKeyErrors = typeof localStorage !== 'undefined' ? localStorage.getItem("physicalKeyErrors") : null;
    const savedFumbles = typeof localStorage !== 'undefined' ? localStorage.getItem("fumbles") : null;
    return {
      typedText: "",
      physicalKeyPresses: savedKeyPresses ? JSON.parse(savedKeyPresses) : {},
      physicalKeyErrors: savedKeyErrors ? JSON.parse(savedKeyErrors) : {},
      fumbles: savedFumbles ? JSON.parse(savedFumbles) : {},
      mistypedNewlineIndices: new Set(),
      autoInsertedBrackets: [],
      punishedTokenIndex: null
    };
  });

  const {
    typedText,
    physicalKeyPresses,
    physicalKeyErrors,
    fumbles,
    mistypedNewlineIndices,
    autoInsertedBrackets,
    punishedTokenIndex
  } = typingState;

  // useTransition lets us mark non-critical state updates as low priority
  // React will process urgent typing keystrokes before finishing stats updates
  const [, startStatsTransition] = useTransition();

  // Defer keyboard heat-map stats so they never block the typing render critical path
  const deferredPhysicalKeyPresses = React.useDeferredValue(physicalKeyPresses);
  const deferredPhysicalKeyErrors = React.useDeferredValue(physicalKeyErrors);

  const setTypedText = (val: string | ((prev: string) => string)) => {
    setTypingState(prev => ({
      ...prev,
      typedText: typeof val === 'function' ? val(prev.typedText) : val
    }));
  };

  const setPhysicalKeyPresses = (val: Record<string, number> | ((prev: Record<string, number>) => Record<string, number>)) => {
    setTypingState(prev => ({
      ...prev,
      physicalKeyPresses: typeof val === 'function' ? val(prev.physicalKeyPresses) : val
    }));
  };

  const setPhysicalKeyErrors = (val: Record<string, number> | ((prev: Record<string, number>) => Record<string, number>)) => {
    setTypingState(prev => ({
      ...prev,
      physicalKeyErrors: typeof val === 'function' ? val(prev.physicalKeyErrors) : val
    }));
  };

  const setFumbles = (val: Record<string, number> | ((prev: Record<string, number>) => Record<string, number>)) => {
    setTypingState(prev => ({
      ...prev,
      fumbles: typeof val === 'function' ? val(prev.fumbles) : val
    }));
  };

  const setMistypedNewlineIndices = (val: Set<number> | ((prev: Set<number>) => Set<number>)) => {
    setTypingState(prev => ({
      ...prev,
      mistypedNewlineIndices: typeof val === 'function' ? val(prev.mistypedNewlineIndices) : val
    }));
  };

  const setAutoInsertedBrackets = (val: number[] | ((prev: number[]) => number[])) => {
    setTypingState(prev => ({
      ...prev,
      autoInsertedBrackets: typeof val === 'function' ? val(prev.autoInsertedBrackets) : val
    }));
  };

  const setPunishedTokenIndex = (val: number | null | ((prev: number | null) => number | null)) => {
    setTypingState(prev => ({
      ...prev,
      punishedTokenIndex: typeof val === 'function' ? val(prev.punishedTokenIndex) : val
    }));
  };

  // Preference Settings
  const [currentScript, setCurrentScript] = useState<'english' | 'hindi'>(() => {
    const saved = localStorage.getItem("currentScript");
    return (saved === 'hindi' || saved === 'english') ? saved : 'english';
  });
  useEffect(() => {
    localStorage.setItem("currentScript", currentScript);
  }, [currentScript]);
  const [filterStoriesByDuration, setFilterStoriesByDuration] = useState<boolean>(true);

  // Sync default lesson when language changes
  useEffect(() => {
    if (currentScript === 'hindi') {
      const defaultHindi = LESSONS.find(l => l.category === "Touch Typing Basics (Hindi)") || LESSONS.find(l => l.id === 500);
      if (defaultHindi) {
        setCurrentLesson(defaultHindi);
      }
    } else {
      const defaultEnglish = LESSONS.find(l => l.id === 0) || LESSONS[0];
      if (defaultEnglish) {
        setCurrentLesson(defaultEnglish);
      }
    }
  }, [currentScript]);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem("soundEnabled");
    return saved !== null ? saved === "true" : true;
  });
  useEffect(() => {
    localStorage.setItem("soundEnabled", soundEnabled.toString());
  }, [soundEnabled]);
  const [soundVolume, setSoundVolume] = useState<number>(() => {
    const saved = localStorage.getItem("soundVolume");
    return saved !== null ? parseFloat(saved) : 0.5;
  });
  const [soundPreset, setSoundPreset] = useState<'blue' | 'red' | 'brown' | 'silent' | 'typewriter' | 'arcade'>(() => {
    const saved = localStorage.getItem("soundProfile");
    return (saved as any) || 'blue';
  });

  // FEATURE 1: Friends list & follow state
  const [friendsList, setFriendsList] = useState<string[]>(() => {
    const saved = localStorage.getItem("friends");
    return saved ? JSON.parse(saved) : [];
  });
  const [activities, setActivities] = useState<Array<{ user: string; action: string; timestamp: string }>>(() => {
    const saved = localStorage.getItem("friends_activity");
    return saved ? JSON.parse(saved) : [];
  });
  const [searchFriendQuery, setSearchFriendQuery] = useState<string>("");

  // FEATURE 2: Themes state
  const [activeTheme, setActiveTheme] = useState<string>(() => {
    return localStorage.getItem("active_theme") || "dark";
  });
  const [customThemeColors, setCustomThemeColors] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem("custom_theme_colors");
    return saved ? JSON.parse(saved) : {
      bg: "#0B0C10",
      text: "#C5C6C7",
      cursor: "#00F0FF",
      accent: "#45A29E",
      error: "#FF4444",
      correct: "#45A29E"
    };
  });

  // FEATURE 4: Daily Goals state
  const [dailyGoals, setDailyGoals] = useState<{ practiceMin: number; wordsTyped: number; targetWpm: number }>(() => {
    const saved = localStorage.getItem("daily_goals");
    return saved ? JSON.parse(saved) : { practiceMin: 15, wordsTyped: 500, targetWpm: 70 };
  });
  const [dailyGoalsProgress, setDailyGoalsProgress] = useState<{ practiceMin: number; wordsTyped: number; bestWpmToday: number }>(() => {
    const saved = localStorage.getItem("daily_goals_progress");
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem("daily_goals_last_date");
    if (lastDate !== today) {
      return { practiceMin: 0, wordsTyped: 0, bestWpmToday: 0 };
    }
    return saved ? JSON.parse(saved) : { practiceMin: 0, wordsTyped: 0, bestWpmToday: 0 };
  });
  const [goalsStreak, setGoalsStreak] = useState<number>(() => {
    const saved = localStorage.getItem("goals_streak");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [lastGoalsCompletedDate, setLastGoalsCompletedDate] = useState<string>(() => {
    return localStorage.getItem("daily_goals_last_completed_date") || "";
  });
  const [goalToast, setGoalToast] = useState<string | null>(null);

  const [streak, setStreak] = useState<number>(() => {
    const saved = localStorage.getItem("streak");
    return saved ? parseInt(saved, 10) : 0;
  });

  useEffect(() => {
    localStorage.setItem("streak", streak.toString());
  }, [streak]);
  const [speedTarget, setSpeedTarget] = useState<number>(60);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [calendarYear, setCalendarYear] = useState<number>(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState<number>(new Date().getMonth());

  // Mode Selection and Custom Practice Layout States
  const [activeAppMode, setActiveAppMode] = useState<'normal' | 'code' | 'medical'>('normal');
  const [keyboardLayout, setKeyboardLayout] = useState<'qwerty' | 'dvorak' | 'colemak'>('qwerty');
  const [currentLesson, setCurrentLesson] = useState<Lesson>(() => {
    const savedScript = localStorage.getItem("currentScript");
    if (savedScript === 'hindi') {
      return LESSONS.find(l => l.id === 500) || LESSONS[0];
    }
    return LESSONS.find(l => l.id === 101) || LESSONS[0];
  });
  const [lastSelectedNormalLesson, setLastSelectedNormalLesson] = useState<Lesson | null>(() => {
    const savedScript = localStorage.getItem("currentScript");
    if (savedScript === 'hindi') {
      return LESSONS.find(l => l.id === 500) || LESSONS[0];
    }
    return LESSONS.find(l => l.id === 101) || LESSONS[0];
  });

  const handleModeChange = useCallback((mode: 'normal' | 'code' | 'medical') => {
    setActiveAppMode(mode);
    setAutoInsertedBrackets([]);
    setTypedText("");
    setStartTime(null);
    setElapsed(0);
    setWorkoutCompleted(false);
    setWorkoutStats(null);
    keystrokeTimesRef.current = [];

    if (mode === 'normal') {
      if (lastSelectedNormalLesson) {
        setCurrentLesson(lastSelectedNormalLesson);
        setTargetText(lastSelectedNormalLesson.customText ? lastSelectedNormalLesson.customText.replace(/\s+/g, ' ').trim() : "");
      } else {
        const defaultLesson = LESSONS.find(l => l.id === 101) || LESSONS[0] || {
          id: 1,
          name: "Lesson 1 — Home Row Base",
          keys: ['a', 's', 'd', 'f', 'j', 'k', 'l'],
          desc: "Type with a, s, d, f and j, k, l, ;",
          customText: STORIES_LIT1[0].text
        };
        setCurrentLesson(defaultLesson);
        setTargetText(defaultLesson.customText ? defaultLesson.customText.replace(/\s+/g, ' ').trim() : "");
      }
    } else if (mode === 'code') {
      if (currentLesson.id !== 9001 && currentLesson.id !== 9002) {
        setLastSelectedNormalLesson(currentLesson);
      }
      const randomSnippet = CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)];
      const codeLesson: Lesson = {
        id: 9001,
        name: "💻 Code Practice (JavaScript)",
        keys: null,
        desc: "Practice actual code syntax and IDE-like auto brackets",
        customText: randomSnippet
      };
      setCurrentLesson(codeLesson);
      setTargetText(randomSnippet);
    } else if (mode === 'medical') {
      if (currentLesson.id !== 9001 && currentLesson.id !== 9002) {
        setLastSelectedNormalLesson(currentLesson);
      }
      const randomMedical = MEDICAL_PRACTICE_TEXTS[Math.floor(Math.random() * MEDICAL_PRACTICE_TEXTS.length)];
      const medicalLesson: Lesson = {
        id: 9002,
        name: "🏥 Medical Practice (Complex Terms)",
        keys: null,
        desc: "Type extremely complex medical jargon to test visual endurance",
        customText: randomMedical
      };
      setCurrentLesson(medicalLesson);
      setTargetText(formatParagraphToLines(randomMedical));
    }
  }, [lastSelectedNormalLesson, currentLesson]);

  // Sync fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as any;
      const isFS = !!(doc.fullscreenElement || doc.mozFullScreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement);
      setIsFullscreen(isFS);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    const doc = document as any;
    const docEl = document.documentElement as any;

    const requestFS = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullscreen || docEl.msRequestFullscreen;
    const exitFS = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

    const isFS = !!(doc.fullscreenElement || doc.mozFullScreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement);

    if (!isFS) {
      if (requestFS) {
        requestFS.call(docEl).catch(() => { });
      }
    } else {
      if (exitFS) {
        exitFS.call(doc).catch(() => { });
      }
    }
  };

  const safeCopyToClipboard = (text: string): Promise<boolean> => {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      return navigator.clipboard.writeText(text)
        .then(() => true)
        .catch((err) => {
          console.warn("Clipboard API failed, trying fallback:", err);
          return fallbackCopyToClipboard(text);
        });
    } else {
      return Promise.resolve(fallbackCopyToClipboard(text));
    }
  };

  const fallbackCopyToClipboard = (text: string): boolean => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      console.error("Fallback copy failed:", err);
      return false;
    }
  };

  const getCalendarWeeks = (year: number, month: number) => {
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday, 1 is Monday...
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Add empty slots for days of previous month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    // Add days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    // Group into weeks of 7 days
    const weeks: (Date | null)[][] = [];
    const daysCopy = [...days];
    while (daysCopy.length > 0) {
      weeks.push(daysCopy.splice(0, 7));
    }
    return weeks;
  };

  const getSessionsForDate = (date: Date) => {
    if (!date) return [];
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000;
    return history.filter(item => item.ts >= startOfDay && item.ts < endOfDay);
  };

  // Timed Test, Infinite Text, and Freestyle States
  const [testDuration, setTestDuration] = useState<number | null>(null); // null means ∞ Unlimited

  // Helper to wrap paragraph text into lines of ~75 chars
  const getLessonStructure = useCallback((lesson: Lesson): { lines: string[] }[] => {
    let rawText = lesson.customText || "";

    // For 10M (600s), 15M (900s), or Unlimited (null), extend text to at least 2500+ words
    if (testDuration === 600 || testDuration === 900 || testDuration === null) {
      const words = rawText.split(/\s+/).filter(Boolean);
      if (words.length > 0 && words.length < 2500) {
        const repeatCount = Math.ceil(2500 / words.length);
        const textChunk = rawText.trim();
        rawText = Array(repeatCount).fill(textChunk).join("\n\n");
      }
    }

    if (activeAppMode === 'code') {
      const rawLines = rawText.split('\n');
      return [{
        lines: rawLines
      }];
    }

    const rawParagraphs = rawText.split(/\n\n+/);
    const paragraphs: { lines: string[] }[] = [];

    for (const para of rawParagraphs) {
      const cleanedPara = para.replace(/\s+/g, ' ').trim();
      if (!cleanedPara) continue;

      const words = cleanedPara.split(' ');
      const lines: string[] = [];
      let currentLine = "";

      for (const word of words) {
        if (!word) continue;
        if (currentLine.length === 0) {
          currentLine = word;
        } else if (currentLine.length + 1 + word.length <= 75) {
          currentLine += " " + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) {
        lines.push(currentLine);
      }
      paragraphs.push({ lines });
    }
    return paragraphs;
  }, [activeAppMode, testDuration]);

  const buildTargetTextFromStructure = useCallback((paragraphs: { lines: string[] }[]): string => {
    const allLines: string[] = [];
    for (const para of paragraphs) {
      allLines.push(...para.lines);
    }
    return allLines.join('\n') + '\n';
  }, []);

  // Currently Selected Lesson or Exercise (Defaults to Alice in Wonderland Chapter 1 as requested)

  // Typing state
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState<number>(0);
  const [workoutCompleted, setWorkoutCompleted] = useState<boolean>(false);
  const [workoutStats, setWorkoutStats] = useState<{ wpm: number; accuracy: number; duration: number } | null>(null);

  const [selectedStoryId, setSelectedStoryId] = useState<number | null>(null);
  const [freestyleMode, setFreestyleMode] = useState<boolean>(false);
  const [currentPassageIndex, setCurrentPassageIndex] = useState<number>(0);
  const [timedEndModalOpen, setTimedEndModalOpen] = useState<boolean>(false);

  // AI-powered features states
  const [storyTopic, setStoryTopic] = useState<string>("");
  const [storyDuration, setStoryDuration] = useState<number>(2);
  const [storyGenerating, setStoryGenerating] = useState<boolean>(false);
  const [weaknessBigram, setWeaknessBigram] = useState<string | null>(null);
  const [weaknessDelay, setWeaknessDelay] = useState<number | null>(null);
  const [weaknessSentence, setWeaknessSentence] = useState<string | null>(null);
  const [sentenceGenerating, setSentenceGenerating] = useState<boolean>(false);
  const keystrokeTimesRef = useRef<Array<{ key: string; ts: number }>>([]);

  // Feature 1: Keystroke Dynamics tracking refs
  const keyDownTimesRef = useRef<Record<string, number>>({});
  const lastKeyUpTimeRef = useRef<number>(0);
  const backspaceClusterRef = useRef<number>(0);
  const backspaceClusterStartRef = useRef<number>(-1);
  const keystrokeDynamicsLog = useRef<Array<{ key: string; holdTime: number; flightTime: number; timestamp: number }>>([]);

  // Keystroke dynamics and backspace clusters states
  const [dynamics, setDynamics] = useState<Array<{ key: string; holdTime: number; flightTime: number; timestamp: number }>>([]);
  const [clusters, setClusters] = useState<Array<{ count: number; index: number; timestamp: number }>>([]);

  // When stats modal is opened, load these from localStorage
  useEffect(() => {
    if (activeModal === 'stats') {
      if (keystrokeDynamicsLog.current.length > 0) {
        const existing = localStorage.getItem('keystrokeDynamics');
        const prev = existing ? JSON.parse(existing) : [];
        const combined = [...prev, ...keystrokeDynamicsLog.current].slice(-500);
        localStorage.setItem('keystrokeDynamics', JSON.stringify(combined));
        keystrokeDynamicsLog.current = [];
      }
      const dynamicsStr = localStorage.getItem('keystrokeDynamics');
      if (dynamicsStr) {
        setDynamics(JSON.parse(dynamicsStr));
      }
      const clustersStr = localStorage.getItem('backspaceClusters');
      if (clustersStr) {
        setClusters(JSON.parse(clustersStr));
      }
    }
  }, [activeModal]);

  // Feature 2: Premium & Smart Compose state
  const [isPremium, setIsPremium] = useState<boolean>(() => {
    return localStorage.getItem('ribbon_is_premium') === 'true';
  });
  const [smartComposeEnabled, setSmartComposeEnabled] = useState<boolean>(() => {
    return localStorage.getItem('ribbon_smart_compose') === 'true';
  });
  const [smartSuggestion, setSmartSuggestion] = useState<string>('');
  const smartComposeEnabledRef = useRef(localStorage.getItem('ribbon_smart_compose') === 'true');
  const isPremiumRef = useRef(localStorage.getItem('ribbon_is_premium') === 'true');
  const smartSuggestionRef = useRef('');

  // Effect to dynamically compute smart compose suggestions
  useEffect(() => {
    if (smartComposeEnabled && isPremium) {
      const lastSpaceIdx = Math.max(typedText.lastIndexOf(' '), typedText.lastIndexOf('\n'));
      const partialWord = lastSpaceIdx === -1 ? typedText : typedText.slice(lastSpaceIdx + 1);
      const suggestion = getSmartSuggestion(partialWord);
      setSmartSuggestion(suggestion);
    } else {
      setSmartSuggestion('');
    }
  }, [typedText, smartComposeEnabled, isPremium]);

  // Exam Mode (disables backspace — simulates SSC/CHSL strict exam conditions)
  const [examMode, setExamMode] = useState<boolean>(() => {
    return localStorage.getItem('ribbon_exam_mode') === 'true';
  });

  // Zen Mode, Weekly Challenges, and Smart Drills states
  const [zenMode, setZenMode] = useState<boolean>(false);
  const [weeklyChallengeOpen, setWeeklyChallengeOpen] = useState<boolean>(false);
  const [weeklyChallengeStory, setWeeklyChallengeStory] = useState<string>("");
  const [weeklyChallengeWeekId, setWeeklyChallengeWeekId] = useState<string>("");
  const [weeklyChallengeLoading, setWeeklyChallengeLoading] = useState<boolean>(false);
  const [weeklyChallengePB, setWeeklyChallengePB] = useState<{ wpm: number; accuracy: number; timestamp: number } | null>(null);
  const [username, setUsername] = useState<string>(() => {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem("ribbon_username") || "You";
    }
    return "You";
  });
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<any[]>([]);
  const [smartDrillGenerating, setSmartDrillGenerating] = useState<boolean>(false);
  const [focusBadgeEarned, setFocusBadgeEarned] = useState<boolean>(() => {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem("ribbon_focus_badge_earned") === "true";
    }
    return false;
  });

  // Bot Race & Boss Battle state
  const [botRaceActive, setBotRaceActive] = useState<boolean>(false);
  const [botWpm, setBotWpm] = useState<number>(40);
  const [botProgress, setBotProgress] = useState<number>(0);
  const [botWins, setBotWins] = useState<number>(() => {
    if (typeof localStorage !== "undefined") {
      return Number(localStorage.getItem("ribbon_bot_wins") || "0");
    }
    return 0;
  });
  const [userWins, setUserWins] = useState<number>(() => {
    if (typeof localStorage !== "undefined") {
      return Number(localStorage.getItem("ribbon_user_wins") || "0");
    }
    return 0;
  });

  const [adaptiveBossActive, setAdaptiveBossActive] = useState<boolean>(false);
  const [bossWpm, setBossWpm] = useState<number>(30);
  const [bossProgress, setBossProgress] = useState<number>(0);
  const [bossWinStreak, setBossWinStreak] = useState<number>(() => {
    if (typeof localStorage !== "undefined") {
      return Number(localStorage.getItem("ribbon_boss_win_streak") || "0");
    }
    return 0;
  });

  const [raceEndModalOpen, setRaceEndModalOpen] = useState<boolean>(false);
  const [raceWinner, setRaceWinner] = useState<'user' | 'bot' | 'boss' | null>(null);
  const [raceMetrics, setRaceMetrics] = useState<{
    userWpm: number;
    userAcc: number;
    opponentWpm: number;
    opponentAcc: number;
  } | null>(null);

  // Achievements State
  const [achievementsOpen, setAchievementsOpen] = useState<boolean>(false);
  const [achievementToast, setAchievementToast] = useState<{
    id: string;
    title: string;
    desc: string;
    icon: string;
  } | null>(null);

  // Stats Analytics State
  const [globalStats, setGlobalStats] = useState(() => {
    const saved = localStorage.getItem("global_stats");
    return saved ? JSON.parse(saved) : {
      avgWpm: 0,
      bestWpm: 0,
      accuracy: 0,
      totalTests: 0,
      timeSpentMin: 0
    };
  });

  const [history, setHistory] = useState<SessionHistoryItem[]>(() => {
    const saved = localStorage.getItem("history");
    return saved ? JSON.parse(saved) : [];
  });

  const [analyticsScriptFilter, setAnalyticsScriptFilter] = useState<'all' | 'english' | 'hindi'>('all');

  // Ghost Mode State
  const [ghostPbWpm, setGhostPbWpm] = useState<number>(() => {
    const saved = localStorage.getItem("ghost_pb_wpm");
    return saved ? parseInt(saved, 10) : 0;
  });

  const [ghostTimestamps, setGhostTimestamps] = useState<number[]>(() => {
    const saved = localStorage.getItem("ghost_pb_timestamps");
    return saved ? JSON.parse(saved) : [];
  });

  const [resetMessage, setResetMessage] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("global_stats", JSON.stringify(globalStats));
  }, [globalStats]);

  // Consolidated and debounced localStorage sync to prevent blocking the main thread during fast typing
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem("fumbles", JSON.stringify(fumbles));
    }, 1000);
    return () => clearTimeout(timer);
  }, [fumbles]);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem("history", JSON.stringify(history.slice(0, 500)));
    }, 1500);
    return () => clearTimeout(timer);
  }, [history]);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem("physicalKeyPresses", JSON.stringify(physicalKeyPresses));
    }, 2000);
    return () => clearTimeout(timer);
  }, [physicalKeyPresses]);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem("physicalKeyErrors", JSON.stringify(physicalKeyErrors));
    }, 2000);
    return () => clearTimeout(timer);
  }, [physicalKeyErrors]);

  // Sync sounds, friends, themes and daily goals to localStorage
  useEffect(() => {
    localStorage.setItem("soundVolume", soundVolume.toString());
  }, [soundVolume]);

  useEffect(() => {
    localStorage.setItem("soundProfile", soundPreset);
  }, [soundPreset]);

  useEffect(() => {
    localStorage.setItem("friends", JSON.stringify(friendsList));
  }, [friendsList]);

  useEffect(() => {
    localStorage.setItem("friends_activity", JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem("active_theme", activeTheme);
  }, [activeTheme]);

  useEffect(() => {
    localStorage.setItem("custom_theme_colors", JSON.stringify(customThemeColors));
  }, [customThemeColors]);

  useEffect(() => {
    localStorage.setItem("daily_goals", JSON.stringify(dailyGoals));
  }, [dailyGoals]);

  useEffect(() => {
    localStorage.setItem("daily_goals_progress", JSON.stringify(dailyGoalsProgress));
    localStorage.setItem("daily_goals_last_date", new Date().toDateString());
  }, [dailyGoalsProgress]);

  useEffect(() => {
    localStorage.setItem("goals_streak", goalsStreak.toString());
  }, [goalsStreak]);

  useEffect(() => {
    localStorage.setItem("daily_goals_last_completed_date", lastGoalsCompletedDate);
  }, [lastGoalsCompletedDate]);

  useEffect(() => {
    localStorage.setItem('ribbon_smart_compose', smartComposeEnabled.toString());
    smartComposeEnabledRef.current = smartComposeEnabled;
  }, [smartComposeEnabled]);

  useEffect(() => {
    localStorage.setItem('ribbon_is_premium', isPremium.toString());
    isPremiumRef.current = isPremium;
  }, [isPremium]);

  useEffect(() => {
    smartSuggestionRef.current = smartSuggestion;
  }, [smartSuggestion]);

  // Periodically persist keystroke dynamics to localStorage
  useEffect(() => {
    const timer = setInterval(() => {
      if (keystrokeDynamicsLog.current.length > 0) {
        const existing = localStorage.getItem('keystrokeDynamics');
        const prev: typeof keystrokeDynamicsLog.current = existing ? JSON.parse(existing) : [];
        const combined = [...prev, ...keystrokeDynamicsLog.current].slice(-500);
        localStorage.setItem('keystrokeDynamics', JSON.stringify(combined));
        keystrokeDynamicsLog.current = [];
      }
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleShare = useCallback(() => {
    sfx.playClick();
    const shareText = `⌨️ Ribbon Typing Performance Badge 📸\n\n🔥 Streak: ${streak} Days\n⚡ Avg Speed: ${globalStats.avgWpm} WPM\n🎯 Best Speed: ${globalStats.bestWpm} WPM\n✨ Accuracy: ${globalStats.accuracy}%\n\nCan you beat my typing speed? Train with Ribbon!`;

    const triggerFeedback = (success: boolean) => {
      setShareFeedback(success ? "Copied!" : "Failed to copy!");
      setTimeout(() => setShareFeedback(null), 2000);
    };

    if (navigator.share) {
      navigator.share({
        title: 'Ribbon Typing Trainer',
        text: shareText,
        url: window.location.href
      }).catch(() => {
        safeCopyToClipboard(shareText).then(triggerFeedback);
      });
    } else {
      safeCopyToClipboard(shareText).then(triggerFeedback);
    }
  }, [streak, globalStats]);

  // Keyboard visual pressed tracking — stored as a ref so it never triggers re-renders
  const physicallyPressedKeysRef = useRef<Set<string>>(new Set());

  // Scrolling refs for typing area
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mobileContainerRef = useRef<HTMLDivElement | null>(null);
  const activeCharRef = useRef<HTMLSpanElement | null>(null);
  const isAppendingRef = useRef<boolean>(false);
  // AI story auto-append: tracks whether a background prefetch is already in flight
  const aiPrefetchInFlightRef = useRef<boolean>(false);
  // Tracks the targetText length at which the last prefetch was triggered (prevents double-firing)
  const aiPrefetchTriggeredAtRef = useRef<number>(0);

  const getActiveContainer = (): HTMLDivElement | null => {
    if (containerRef.current && (containerRef.current.offsetParent !== null || containerRef.current.clientWidth > 0)) {
      return containerRef.current;
    }
    if (mobileContainerRef.current && (mobileContainerRef.current.offsetParent !== null || mobileContainerRef.current.clientWidth > 0)) {
      return mobileContainerRef.current;
    }
    return (containerRef.current || mobileContainerRef.current || document.querySelector('.typing-area')) as HTMLDivElement | null;
  };

  // Arcade mini-game states (Ribbon Invaders played in upper text area container)
  const [arcadeActive, setArcadeActive] = useState<boolean>(false);
  const [arcadeScore, setArcadeScore] = useState<number>(0);
  const [arcadeShield, setArcadeShield] = useState<number>(100);
  const [fallingLetters, setFallingLetters] = useState<Array<{
    id: number;
    char: string;
    x: number;
    y: number;
    speed: number;
  }>>([]);

  // Memoized lesson structure to prevent recalculations on every keystroke
  const parsedParagraphs = useMemo(() => {
    return getLessonStructure(currentLesson);
  }, [currentLesson, activeAppMode, getLessonStructure]);

  const derivedTargetText = useMemo(() => {
    return buildTargetTextFromStructure(parsedParagraphs);
  }, [parsedParagraphs, buildTargetTextFromStructure]);

  // Generate target text dynamically based on the lesson
  const getTargetText = (lesson: Lesson): string => {
    const rawText = lesson.customText || STORIES_LIT1[0].text;
    if (lesson.id === 9001) {
      return rawText;
    }
    return rawText.replace(/\s+/g, ' ').trim();
  };

  const [targetText, setTargetText] = useState<string>("");

  useEffect(() => {
    if (isAppendingRef.current) {
      isAppendingRef.current = false;
      return;
    }
    setTargetText(derivedTargetText);
    setTypedText("");
    setMistypedNewlineIndices(new Set());
    setStartTime(null);
    setElapsed(0);
    setWorkoutCompleted(false);
    setWorkoutStats(null);
    setAutoInsertedBrackets([]);
    setIsPaused(false);
    // Reset scroll position so text always starts from the top on lesson load
    requestAnimationFrame(() => {
      if (containerRef.current) containerRef.current.scrollTop = 0;
      if (mobileContainerRef.current) mobileContainerRef.current.scrollTop = 0;
    });
  }, [derivedTargetText]);

  // ── AI Story Auto-Append ────────────────────────────────────────────────────
  // When the user is typing an AI story (lesson id 9999) and reaches 80% of the
  // current text, silently fetch a new story chunk in the background and append
  // it — so they never run out of text mid-session.
  useEffect(() => {
    // Only applies to AI stories
    if (currentLesson.id !== 9999) return;
    if (!targetText || targetText.length === 0) return;
    if (workoutCompleted) return;
    if (aiPrefetchInFlightRef.current) return;

    const progress = typedText.length / targetText.length;

    // Fire once per "generation cycle" — only when we cross 80% and haven't
    // already triggered for this particular targetText length.
    if (progress >= 0.80 && aiPrefetchTriggeredAtRef.current !== targetText.length) {
      aiPrefetchTriggeredAtRef.current = targetText.length;
      aiPrefetchInFlightRef.current = true;

      const topic = storyTopic || 'typing practice';

      (async () => {
        let newChunk = "";
        try {
          const res = await fetch('/api/generate-story', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic, duration: storyDuration, script: currentScript }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data && data.story) newChunk = data.story;
          }
        } catch (err) {
          // fallback below
        }

        if (!newChunk) {
          try {
            newChunk = await generateStory(`Continue the typing story about "${topic}" in ${currentScript === 'hindi' ? 'Hindi' : 'English'}.`, 150);
          } catch (e) {
            console.warn('[AutoAppend] Fallback story prefetch failed:', e);
          }
        }

        if (newChunk) {
          const cleanExisting = (currentLessonRef.current.customText || '').replace(/\s+/g, ' ').trim();
          const cleanNew = newChunk.replace(/\s+/g, ' ').trim();
          const combinedText = cleanExisting + '\n\n' + cleanNew;

          const mergedLesson: Lesson = {
            ...currentLessonRef.current,
            customText: combinedText,
          };

          isAppendingRef.current = true;
          setCurrentLesson(mergedLesson);

          const nextParsed = getLessonStructure(mergedLesson);
          const nextFormatted = buildTargetTextFromStructure(nextParsed);
          setTargetText(nextFormatted);
        }
      })().finally(() => {
        aiPrefetchInFlightRef.current = false;
      });
    }
  }, [typedText.length, targetText, currentLesson.id, workoutCompleted, storyTopic, storyDuration, getLessonStructure, buildTargetTextFromStructure]);

  // Keep refs of current values to avoid stale closures in clock setInterval and keyboard handlers
  const typedTextRef = useRef(typedText);
  const targetTextRef = useRef(targetText);
  const currentLessonRef = useRef(currentLesson);
  const autoInsertedBracketsRef = useRef(autoInsertedBrackets);
  const workoutCompletedRef = useRef(workoutCompleted);
  const isPausedRef = useRef(isPaused);
  const timedEndModalOpenRef = useRef(timedEndModalOpen);
  const freestyleModeRef = useRef(freestyleMode);
  const activeAppModeRef = useRef(activeAppMode);
  const startTimeRef = useRef(startTime);
  const elapsedRef = useRef(elapsed);
  const testDurationRef = useRef(testDuration);
  const currentPassageIndexRef = useRef(currentPassageIndex);
  const activeModalRef = useRef(activeModal);
  const arcadeActiveRef = useRef(arcadeActive);
  const keyboardLayoutRef = useRef(keyboardLayout);
  const examModeRef = useRef(examMode);
  const handleTypingKeyRef = useRef<(key: string, physicalCode?: string) => void>(() => { });

  // Keep refs in sync with state in a single consolidated useEffect to minimize commit phase overhead
  useEffect(() => {
    typedTextRef.current = typedText;
    targetTextRef.current = targetText;
    currentLessonRef.current = currentLesson;
    autoInsertedBracketsRef.current = autoInsertedBrackets;
    workoutCompletedRef.current = workoutCompleted;
    isPausedRef.current = isPaused;
    timedEndModalOpenRef.current = timedEndModalOpen;
    freestyleModeRef.current = freestyleMode;
    activeAppModeRef.current = activeAppMode;
    startTimeRef.current = startTime;
    elapsedRef.current = elapsed;
    testDurationRef.current = testDuration;
    currentPassageIndexRef.current = currentPassageIndex;
    activeModalRef.current = activeModal;
    arcadeActiveRef.current = arcadeActive;
    keyboardLayoutRef.current = keyboardLayout;
    examModeRef.current = examMode;
  }, [
    typedText, targetText, currentLesson, autoInsertedBrackets, workoutCompleted,
    isPaused, timedEndModalOpen, freestyleMode, activeAppMode, startTime,
    elapsed, testDuration, currentPassageIndex, activeModal, arcadeActive, keyboardLayout, examMode
  ]);

  // Throttling references for scrolling engine
  const lastScrollTimeRef = useRef<number>(0);
  const scrollTimeoutRef = useRef<number | null>(null);
  const measureRafIdRef = useRef<number | null>(null);
  const writeRafIdRef = useRef<number | null>(null);
  const performScrollRef = useRef<() => void>(() => { });

  const performScroll = useCallback(() => {
    const now = Date.now();
    const delay = 50; // Throttle to run at most every 50ms

    const executeScroll = () => {
      lastScrollTimeRef.current = Date.now();
      if (measureRafIdRef.current !== null) cancelAnimationFrame(measureRafIdRef.current);
      if (writeRafIdRef.current !== null) cancelAnimationFrame(writeRafIdRef.current);

      measureRafIdRef.current = requestAnimationFrame(() => {
        const container = getActiveContainer();
        const activeChar = activeCharRef.current;

        if (activeChar && container) {
          const charRect = activeChar.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          // Convert viewport-relative position to absolute content position
          const charAbsoluteTop = container.scrollTop + (charRect.top - containerRect.top);
          // Keep cursor 15% from top — scroll text up aggressively on each new line
          const targetScroll = Math.max(0, Math.min(
            charAbsoluteTop - Math.floor(container.clientHeight * 0.15),
            container.scrollHeight - container.clientHeight
          ));
          // Caret overlay (read before writing scrollTop)
          const carets = document.querySelectorAll('.custom-caret') as NodeListOf<HTMLDivElement>;
          carets.forEach(caret => {
            caret.style.display = 'block';
            caret.style.left = `${charRect.left - containerRect.left + container.scrollLeft}px`;
            caret.style.top = `${charAbsoluteTop}px`;
            caret.style.width = `${charRect.width}px`;
            caret.style.height = `${charRect.height}px`;
          });
          const suggestions = document.querySelectorAll('.custom-suggestion') as NodeListOf<HTMLDivElement>;
          suggestions.forEach(sug => {
            sug.style.display = 'flex';
            sug.style.left = `${charRect.left - containerRect.left + container.scrollLeft}px`;
            sug.style.top = `${charAbsoluteTop - 24}px`;
          });
          writeRafIdRef.current = requestAnimationFrame(() => {
            // scrollTo with behavior:'instant' bypasses CSS scroll-behavior:smooth
            // so the scroll snaps immediately rather than animating and being
            // interrupted by the next keystroke (which caused the tiny-fraction bug)
            container.scrollTo({ top: targetScroll, behavior: 'instant' });
          });
        } else {
          const carets = document.querySelectorAll('.custom-caret') as NodeListOf<HTMLDivElement>;
          carets.forEach(caret => { caret.style.display = 'none'; });
          const suggestions = document.querySelectorAll('.custom-suggestion') as NodeListOf<HTMLDivElement>;
          suggestions.forEach(sug => { sug.style.display = 'none'; });
        }
      });
    };

    if (now - lastScrollTimeRef.current >= delay) {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }
      executeScroll();
    } else {
      if (!scrollTimeoutRef.current) {
        scrollTimeoutRef.current = setTimeout(() => {
          scrollTimeoutRef.current = null;
          executeScroll();
        }, delay - (now - lastScrollTimeRef.current)) as unknown as number;
      }
    }
  }, []);

  useEffect(() => {
    performScrollRef.current = performScroll;
  }, [performScroll]);

  // Persistent resize listener (registered only once on mount)
  useEffect(() => {
    const handleResize = () => {
      requestAnimationFrame(() => {
        if (performScrollRef.current) performScrollRef.current();
      });
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Sync scroll positioning based on active char and update cursor coordinates
  useEffect(() => {
    let initRafId = requestAnimationFrame(() => {
      performScroll();
    });
    return () => {
      cancelAnimationFrame(initRafId);
      if (measureRafIdRef.current !== null) cancelAnimationFrame(measureRafIdRef.current);
      if (writeRafIdRef.current !== null) cancelAnimationFrame(writeRafIdRef.current);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [typedText.length, targetText, performScroll]);

  // Force a Scroll Container Recalculation after targetText changes to ensure content growth is updated
  useEffect(() => {
    let timeoutId: any = null;
    let rafId: number | null = null;

    const triggerRecalc = () => {
      timeoutId = setTimeout(() => {
        rafId = requestAnimationFrame(() => {
          const container = getActiveContainer();
          const activeChar = activeCharRef.current;
          if (activeChar && container) {
            const charRect = activeChar.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            const charAbsoluteTop = container.scrollTop + (charRect.top - containerRect.top);
            const targetScroll = Math.max(0, Math.min(
              charAbsoluteTop - Math.floor(container.clientHeight * 0.15),
              container.scrollHeight - container.clientHeight
            ));
            container.scrollTo({ top: targetScroll, behavior: 'instant' });
            const carets = document.querySelectorAll('.custom-caret') as NodeListOf<HTMLDivElement>;
            carets.forEach(caret => {
              caret.style.display = 'block';
              caret.style.left = `${charRect.left - containerRect.left + container.scrollLeft}px`;
              caret.style.top = `${charAbsoluteTop}px`;
              caret.style.width = `${charRect.width}px`;
              caret.style.height = `${charRect.height}px`;
            });
            const suggestions = document.querySelectorAll('.custom-suggestion') as NodeListOf<HTMLDivElement>;
            suggestions.forEach(sug => {
              sug.style.display = 'flex';
              sug.style.left = `${charRect.left - containerRect.left + container.scrollLeft}px`;
              sug.style.top = `${charAbsoluteTop - 24}px`;
            });
          }
        });
      }, 60);
    };

    triggerRecalc();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [targetText]);

  // Sync sound settings to class
  useEffect(() => {
    sfx.enabled = soundEnabled;
    sfx.volume = soundVolume;
    sfx.preset = soundPreset;
  }, [soundEnabled, soundVolume, soundPreset]);

  // Remediation Drill Generator for Weak Keys (Hallmark of Typing Master)
  const generateFumbleDrill = (targetChar?: string) => {
    let topKeys: string[] = [];

    if (targetChar && targetChar.match(/^[a-z]$/i)) {
      topKeys = [targetChar.toLowerCase()];
    } else {
      const sortedFumbles = Object.entries(fumbles)
        .filter(([char, count]) => ((count as number) > 0) && char.match(/^[a-z]$/i))
        .sort((a, b) => (b[1] as number) - (a[1] as number));

      if (sortedFumbles.length === 0) {
        topKeys = ['f', 'j', 'd', 'k'];
      } else {
        topKeys = sortedFumbles.slice(0, 3).map(([char]) => char);
      }
    }

    const letterWords: Record<string, string[]> = {
      a: ['about', 'apple', 'arcade', 'around'],
      b: ['brave', 'bubble', 'border', 'button'],
      c: ['click', 'classic', 'coach', 'curve'],
      d: ['drill', 'defense', 'design', 'decide'],
      e: ['elite', 'engine', 'expert', 'elapsed'],
      f: ['fumble', 'finger', 'fluent', 'focus'],
      g: ['global', 'graph', 'guide', 'gamer'],
      h: ['header', 'history', 'hindi', 'human'],
      i: ['invader', 'index', 'improve', 'intercept'],
      j: ['joyful', 'jacket', 'journey', 'judgment'],
      k: ['keyboard', 'keycap', 'knack', 'keeper'],
      l: ['lesson', 'layout', 'learning', 'literary'],
      m: ['metrics', 'memory', 'muscle', 'mechanical'],
      n: ['novice', 'navigation', 'needle', 'neutral'],
      o: ['overlay', 'outcome', 'output', 'orbit'],
      p: ['profile', 'practice', 'posture', 'preset'],
      q: ['quick', 'quiet', 'queen', 'quiz'],
      r: ['retro', 'reset', 'repair', 'remedy'],
      s: ['scribe', 'streak', 'shield', 'stable'],
      t: ['tactile', 'tutor', 'training', 'target'],
      u: ['user', 'utility', 'ultimate', 'universe'],
      v: ['velocity', 'visual', 'volume', 'victory'],
      w: ['workout', 'window', 'wrapped', 'word'],
      x: ['extra', 'expert', 'exam', 'index'],
      y: ['yellow', 'yield', 'yearly', 'your'],
      z: ['zero', 'zone', 'zebra', 'zodiac']
    };

    let drillParts: string[] = [];
    topKeys.forEach(k => {
      const K = k.toUpperCase();
      drillParts.push(`${k}${k}${k}`, `${k}${k} ${k}${k}`, `${K}${k}${k}`);
      const words = letterWords[k] || [k + 'a', k + 'e'];
      drillParts.push(...words.slice(0, 3));
    });

    if (topKeys.length >= 2) {
      const k1 = topKeys[0];
      const k2 = topKeys[1];
      drillParts.push(`${k1}${k2}${k1}${k2}`, `${k2}${k1}${k2}${k1}`);
    }

    while (drillParts.length < 18) {
      const randomKey = topKeys[Math.floor(Math.random() * topKeys.length)];
      const words = letterWords[randomKey] || [randomKey];
      drillParts.push(words[Math.floor(Math.random() * words.length)]);
    }

    const finalDrillText = drillParts.slice(0, 20).join(' ');

    const remediationLesson: Lesson = {
      id: 9999,
      name: `🔧 Key Repair Drill ('${topKeys.join(', ').toUpperCase()}')`,
      keys: topKeys,
      desc: `Targeted muscle memory repair for key(s): ${topKeys.join(', ').toUpperCase()}`,
      customText: finalDrillText
    };

    loadLesson(remediationLesson);
  };

  // Locate top fumble key dynamically for the orange indicator
  const getMostFumbledKey = (): string | null => {
    const entries = Object.entries(fumbles).filter(([char, count]) => {
      return (count as number) > 0 && char.match(/^[a-z]$/);
    });
    if (entries.length === 0) return null;
    entries.sort((a, b) => (b[1] as number) - (a[1] as number));
    return entries[0][0];
  };

  const mostFumbledKey = getMostFumbledKey();

  // Adaptive Speed Rank and Badge Calculation
  const getTypingRank = (wpm: number) => {
    if (wpm < 30) return { title: "Novice Scribe", emoji: "🥉", color: "text-zinc-400 border-zinc-800 bg-zinc-900/50" };
    if (wpm < 50) return { title: "Fluent Typist", emoji: "🥈", color: "text-zinc-300 border-zinc-700 bg-zinc-800/40" };
    if (wpm < 70) return { title: "Elite Secretary", emoji: "🥇", color: "text-yellow-500/90 border-[#FFB800]/20 bg-[#FFB800]/5" };
    if (wpm < 90) return { title: "Typing Master", emoji: "🏆", color: "text-amber-400 border-amber-500/30 bg-amber-500/10" };
    return { title: "Cyber Speed Demon", emoji: "⚡", color: "text-red-400 border-red-500/30 bg-red-500/10 animate-pulse" };
  };

  const typingRank = getTypingRank(globalStats.avgWpm);

  // Ranked Titles Helper
  const getRankedTitle = (bestWpm: number): string => {
    if (bestWpm < 30) return "Bronze Scribbler";
    if (bestWpm < 50) return "Silver Typist";
    if (bestWpm < 70) return "Gold Racer";
    if (bestWpm < 90) return "Platinum Master";
    return "Grandmaster";
  };

  const getRankedTitleColor = (bestWpm: number): string => {
    if (bestWpm < 30) return "text-[#CD7F32]"; // Bronze
    if (bestWpm < 50) return "text-[#A9A9A9]"; // Silver
    if (bestWpm < 70) return "text-[#FFD700]"; // Gold
    if (bestWpm < 90) return "text-[#00F0FF]"; // Platinum
    return "text-[#FF4444]"; // Grandmaster
  };

  useEffect(() => {
    localStorage.setItem("ranked_title", getRankedTitle(globalStats.bestWpm));
  }, [globalStats.bestWpm]);

  // Timed test completion logic
  const handleTimedTestCompletion = useCallback((finalTyped: string, finalTarget: string) => {
    if (backspaceClusterRef.current > 0) {
      const newCluster = {
        count: backspaceClusterRef.current,
        index: backspaceClusterStartRef.current,
        timestamp: Date.now()
      };
      const currentClusters = localStorage.getItem('backspaceClusters');
      const prevClusters = currentClusters ? JSON.parse(currentClusters) : [];
      const updatedClusters = [...prevClusters, newCluster].slice(-100);
      localStorage.setItem('backspaceClusters', JSON.stringify(updatedClusters));
      backspaceClusterRef.current = 0;
      backspaceClusterStartRef.current = -1;
    }

    if (testDuration === null || testDuration <= 0) return;

    let correctsCount = 0;
    const minLength = Math.min(finalTyped.length, finalTarget.length);
    for (let i = 0; i < minLength; i++) {
      if (finalTyped[i] === finalTarget[i]) correctsCount++;
    }

    const accuracy = finalTyped.length > 0 ? Math.round((correctsCount / finalTyped.length) * 100) : 100;
    const finalAccuracy = Math.min(100, Math.max(0, accuracy));
    const finalWpm = Math.round((finalTyped.length / 5) / (testDuration / 60));

    // Save history
    const sessionItem: SessionHistoryItem = {
      wpm: finalWpm,
      accuracy: finalAccuracy,
      ts: Date.now(),
      script: currentScript
    };
    setHistory(prev => [sessionItem, ...prev]);

    // Save and check PB for Ghost Mode
    const savedPbWpmStr = localStorage.getItem("ghost_pb_wpm");
    const prevPbWpm = savedPbWpmStr ? parseInt(savedPbWpmStr, 10) : 0;
    if (finalWpm > prevPbWpm) {
      localStorage.setItem("ghost_pb_wpm", finalWpm.toString());

      const startTs = startTime || (keystrokeTimesRef.current.length > 0 ? keystrokeTimesRef.current[0].ts : Date.now());
      const relativeTimes = keystrokeTimesRef.current.map(item => item.ts - startTs);
      localStorage.setItem("ghost_pb_timestamps", JSON.stringify(relativeTimes));

      setGhostPbWpm(finalWpm);
      setGhostTimestamps(relativeTimes);
    }

    // Sync global metrics
    setGlobalStats(prev => {
      const tests = prev.totalTests + 1;
      return {
        ...prev,
        totalTests: tests,
        avgWpm: Math.round((prev.avgWpm * prev.totalTests + finalWpm) / tests),
        bestWpm: Math.max(prev.bestWpm, finalWpm),
        accuracy: parseFloat(((prev.accuracy * prev.totalTests + finalAccuracy) / tests).toFixed(1)),
        timeSpentMin: prev.timeSpentMin + Math.ceil(testDuration / 60)
      };
    });

    // Award streak increment (once per calendar day)
    {
      const today = new Date().toDateString();
      const lastStreakDate = localStorage.getItem("ribbon_last_streak_date");
      if (lastStreakDate !== today) {
        setStreak(s => s + 1);
        localStorage.setItem("ribbon_last_streak_date", today);
      }
    }

    // Check typing achievements for timed test
    setTimeout(() => {
      checkTypingAchievements(finalWpm, globalStats.totalTests + 1);
    }, 100);

    // Update daily goals progress
    setDailyGoalsProgress(prev => {
      const today = new Date().toDateString();
      const lastDate = localStorage.getItem("daily_goals_last_date");
      const basePrev = (lastDate && lastDate !== today)
        ? { practiceMin: 0, wordsTyped: 0, bestWpmToday: 0 }
        : prev;

      const minutesEarned = Math.max(1, Math.round(testDuration / 60));
      const wordsEarned = Math.round(finalTyped.length / 5);
      const nextPracticeMin = basePrev.practiceMin + minutesEarned;
      const nextWordsTyped = basePrev.wordsTyped + wordsEarned;
      const nextBestWpm = Math.max(basePrev.bestWpmToday, finalWpm);

      const wasCompletedBefore = basePrev.practiceMin >= dailyGoals.practiceMin &&
        basePrev.wordsTyped >= dailyGoals.wordsTyped &&
        basePrev.bestWpmToday >= dailyGoals.targetWpm;

      const isCompletedNow = nextPracticeMin >= dailyGoals.practiceMin &&
        nextWordsTyped >= dailyGoals.wordsTyped &&
        nextBestWpm >= dailyGoals.targetWpm;

      if (isCompletedNow && !wasCompletedBefore) {
        setGoalsStreak(s => s + 1);
        setGoalToast("🎉 Daily Practice Goals Completed! Streak extended!");
        setTimeout(() => setGoalToast(null), 5000);
      }

      return {
        practiceMin: nextPracticeMin,
        wordsTyped: nextWordsTyped,
        bestWpmToday: nextBestWpm
      };
    });

    // Log own activity to the feed
    setActivities(prev => [{
      user: username || "You",
      action: `scored ${finalWpm} WPM on a ${Math.round(testDuration / 60)}-minute timed test!`,
      timestamp: new Date().toISOString()
    }, ...prev].slice(0, 30));
  }, [testDuration, startTime, dailyGoals]);

  // Next expected key for visual keyboard highlights — memoized to avoid recomputing on every render
  const nextExpectedChar = useMemo(() => targetText[typedText.length] || null, [targetText, typedText.length]);

  // Memoized accuracy: avoid Array.from + filter on every render
  const liveAccuracy = useMemo(() => {
    if (typedText.length === 0) return 100;
    let correct = 0;
    for (let i = 0; i < typedText.length; i++) {
      if (typedText[i] === targetText[i]) correct++;
    }
    return Math.round((correct / typedText.length) * 100);
  }, [typedText, targetText]);

  // Memoized live WPM
  const liveWpm = useMemo(() => {
    if (!startTime || elapsed <= 0) return 0;
    return Math.round((typedText.length / 5) / (elapsed / 60));
  }, [typedText.length, elapsed, startTime]);

  // Calculate current Ghost Index based on elapsed time and PB timestamps
  const ghostIndex = useMemo((): number => {
    if (!startTime || isPaused || workoutCompleted || timedEndModalOpen) return -1;
    if (!ghostTimestamps || ghostTimestamps.length === 0) return -1;
    const ghostTimeMs = elapsed * 1000;
    let idx = 0;
    while (idx < ghostTimestamps.length && ghostTimestamps[idx] <= ghostTimeMs) {
      idx++;
    }
    return Math.min(idx, targetText.length - 1);
  }, [startTime, isPaused, workoutCompleted, timedEndModalOpen, ghostTimestamps, elapsed, targetText.length]);

  const playCompletionSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.15); // E5
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.3); // G5
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.warn("Audio Context error:", e);
    }
  };

  const handleOpponentWin = (type: 'bot' | 'boss') => {
    // Calculate user's stats
    const durationSec = elapsed > 0.5 ? elapsed : 0.5;
    let correctsCount = 0;
    const currentTyped = typedTextRef.current;
    const currentTarget = targetTextRef.current;
    for (let i = 0; i < currentTyped.length; i++) {
      if (currentTyped[i] === currentTarget[i]) correctsCount++;
    }
    const accuracy = currentTyped.length > 0 ? Math.round((correctsCount / currentTyped.length) * 100) : 100;
    const wpm = Math.round((currentTyped.length / 5) / (durationSec / 60));

    setWorkoutCompleted(true);
    setRaceWinner(type);

    const oppWpm = type === 'bot' ? botWpm : bossWpm;
    setRaceMetrics({
      userWpm: wpm,
      userAcc: accuracy,
      opponentWpm: oppWpm,
      opponentAcc: 100
    });

    if (type === 'bot') {
      setBotWins(prev => {
        const next = prev + 1;
        localStorage.setItem("ribbon_bot_wins", String(next));
        return next;
      });
    } else {
      setBossWinStreak(0);
      localStorage.setItem("ribbon_boss_win_streak", "0");
    }

    setRaceEndModalOpen(true);
    playCompletionSound();
  };

  // Active workout clock (Tick-based to safely support pausing without clock jumping)
  useEffect(() => {
    let interval: any;
    if (startTime && !workoutCompleted && !arcadeActive && !isPaused && !timedEndModalOpen && !raceEndModalOpen) {
      interval = setInterval(() => {
        setElapsed(prev => {
          const next = prev + 0.25;
          if (testDuration !== null && next >= testDuration) {
            clearInterval(interval);
            setTimedEndModalOpen(true);
            playCompletionSound();
            analyzeKeystrokes(); // Calculate slowest bi-gram and trigger coach drill
            handleTimedTestCompletion(typedTextRef.current, targetTextRef.current);
            return testDuration;
          }

          // Bot and adaptive boss progress increments
          if (botRaceActive && targetText.length > 0) {
            setBotProgress(curr => {
              const nextBot = curr + (botWpm * 5 / 60) * 0.25;
              if (nextBot >= targetText.length) {
                clearInterval(interval);
                handleOpponentWin('bot');
                return targetText.length;
              }
              return nextBot;
            });
          } else if (adaptiveBossActive && targetText.length > 0) {
            // Live user WPM calculation
            const liveUserWpm = next > 0 ? (typedTextRef.current.length / 5) / (next / 60) : 0;
            const liveBossWpm = Math.max(30, liveUserWpm * 0.85);
            setBossWpm(Math.round(liveBossWpm));

            setBossProgress(curr => {
              const nextBoss = curr + (liveBossWpm * 5 / 60) * 0.25;
              if (nextBoss >= targetText.length) {
                clearInterval(interval);
                handleOpponentWin('boss');
                return targetText.length;
              }
              return nextBoss;
            });
          }

          return next;
        });
      }, 250);
    }
    return () => clearInterval(interval);
  }, [startTime, workoutCompleted, arcadeActive, isPaused, testDuration, timedEndModalOpen, botRaceActive, botWpm, adaptiveBossActive, targetText, raceEndModalOpen]);

  // Unlock achievement helper
  const unlockAchievement = (id: string, title: string, desc: string, icon: string) => {
    if (typeof localStorage === 'undefined') return;
    const achievementsKey = "ribbon_unlocked_achievements";
    const saved = localStorage.getItem(achievementsKey);
    const unlocked = saved ? JSON.parse(saved) : [];

    if (!unlocked.includes(id)) {
      const nextUnlocked = [...unlocked, id];
      localStorage.setItem(achievementsKey, JSON.stringify(nextUnlocked));

      // Trigger beautiful notification toast!
      setAchievementToast({ id, title, desc, icon });

      // Custom achievement sound chime!
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const now = audioCtx.currentTime;
        // Dual note positive chime
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        osc1.type = "sine";
        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc1.frequency.setValueAtTime(659.25, now + 0.15); // E5
        osc1.frequency.setValueAtTime(783.99, now + 0.3); // G5
        osc1.frequency.setValueAtTime(1046.50, now + 0.45); // C6

        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(261.63, now); // C4
        osc2.frequency.setValueAtTime(329.63, now + 0.15); // E4
        osc2.frequency.setValueAtTime(392.00, now + 0.3); // G4
        osc2.frequency.setValueAtTime(523.25, now + 0.45); // C5

        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.9);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.9);
        osc2.stop(now + 0.9);
      } catch (err) {
        console.warn("Chime failed", err);
      }

      setTimeout(() => {
        setAchievementToast(curr => curr?.id === id ? null : curr);
      }, 5000);
    }
  };

  const checkTypingAchievements = (wpm: number, totalTests: number) => {
    // 1. Speed Milestones
    if (wpm >= 30) unlockAchievement("speed_30", "🥉 Bronze Speedster", "Achieved 30 WPM speed target!", "🥉");
    if (wpm >= 50) unlockAchievement("speed_50", "🥈 Silver Speedster", "Achieved 50 WPM speed target!", "🥈");
    if (wpm >= 70) unlockAchievement("speed_70", "🥇 Gold Speedster", "Achieved 70 WPM speed target!", "🥇");
    if (wpm >= 100) unlockAchievement("speed_100", "💎 Diamond Speedster", "Achieved 100 WPM speed target!", "💎");

    // 2. Practice Milestones
    if (totalTests >= 10) unlockAchievement("practice_10", "📚 Bookworm", "Completed 10 typing exercises!", "📚");
    if (totalTests >= 50) unlockAchievement("practice_50", "🎓 Scholar", "Completed 50 typing exercises!", "🎓");
    if (totalTests >= 100) unlockAchievement("practice_100", "🏆 Master Scholar", "Completed 100 typing exercises!", "🏆");

    // 3. Streak Milestones
    if (streak >= 7) unlockAchievement("streak_7", "🔥 On Fire", "Maintained a 7-day practice streak!", "🔥");
    if (streak >= 30) unlockAchievement("streak_30", "🔥 Unstoppable", "Maintained a 30-day practice streak!", "🔥");
    if (streak >= 100) unlockAchievement("streak_100", "🔥 Legendary", "Maintained a 100-day practice streak!", "🔥");
  };

  const checkBotRaceAchievements = (type: 'bot' | 'boss') => {
    if (type === 'bot') {
      const nextUserWins = userWins + 1;
      if (nextUserWins >= 1) unlockAchievement("bot_1", "🤖 Rookie Racer", "Won your first 🤖 Bot Race!", "🤖");
      if (nextUserWins >= 10) unlockAchievement("bot_10", "🤖 Veteran Racer", "Won 10 🤖 Bot Races!", "⚡");
      if (nextUserWins >= 50) unlockAchievement("bot_50", "🤖 Master Racer", "Won 50 🤖 Bot Races!", "👑");
    } else {
      const nextStreak = bossWinStreak + 1;
      if (nextStreak >= 1) unlockAchievement("boss_1", "💀 Giant Slayer", "Defeated the adaptive 💀 Boss!", "⚔️");
      if (nextStreak >= 5) unlockAchievement("boss_5", "💀 Boss Nemesis", "Defeated the adaptive 💀 Boss 5 times in a row!", "🔥");
    }
  };

  // Physical keyup/keydown handler for real-time key glow visual effect
  useEffect(() => {
    const handlePhysKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      physicallyPressedKeysRef.current.add(e.key.toLowerCase());
      // Feature 1: record keydown time for hold-time calculation
      keyDownTimesRef.current[e.key] = Date.now();
      // Note: backspace cluster is reset inside handleTypingKey after persistence;
      // resetting here too early would race with localStorage save.
    };

    const handlePhysKeyUp = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      physicallyPressedKeysRef.current.delete(e.key.toLowerCase());
      // Feature 1: compute hold time and flight time, log entry
      const keyDownTime = keyDownTimesRef.current[e.key];
      if (keyDownTime !== undefined) {
        const now = Date.now();
        const holdTime = now - keyDownTime;
        const flightTime = lastKeyUpTimeRef.current > 0 ? keyDownTime - lastKeyUpTimeRef.current : 0;
        lastKeyUpTimeRef.current = now;
        delete keyDownTimesRef.current[e.key];
        if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') {
          keystrokeDynamicsLog.current.push({ key: e.key, holdTime: Math.max(0, holdTime), flightTime: Math.max(0, flightTime), timestamp: now });
          if (keystrokeDynamicsLog.current.length > 1000) {
            keystrokeDynamicsLog.current = keystrokeDynamicsLog.current.slice(-500);
          }
        }
      }
    };

    window.addEventListener('keydown', handlePhysKeyDown);
    window.addEventListener('keyup', handlePhysKeyUp);
    return () => {
      window.removeEventListener('keydown', handlePhysKeyDown);
      window.removeEventListener('keyup', handlePhysKeyUp);
    };
  }, []);

  // Global typing keyboard listener — registered ONCE on mount, uses refs to avoid stale closures
  useEffect(() => {
    const handleGlobalTyping = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (activeModalRef.current !== null || arcadeActiveRef.current || timedEndModalOpenRef.current) return;

      // Escape is used as a shortcut to instantly restart drill
      if (e.key === 'Escape') {
        handleResetSession();
        return;
      }

      // Ignore modifiers
      if (e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') {
        return;
      }

      // Feature 2: Tab accepts Smart Compose suggestion
      if (e.key === 'Tab') {
        e.preventDefault();
        if (smartComposeEnabledRef.current && isPremiumRef.current && smartSuggestionRef.current) {
          const suggestion = smartSuggestionRef.current;
          const typed = typedTextRef.current;
          const target = targetTextRef.current;
          // Only accept if suggestion exactly matches the next expected chars in target
          // — prevents fumble recording and exam-mode lockout on mismatched suggestions
          const expected = target.slice(typed.length, typed.length + suggestion.length);
          if (expected === suggestion) {
            for (const char of suggestion) {
              if (handleTypingKeyRef.current) handleTypingKeyRef.current(char);
            }
          }
        }
        return;
      }

      if (isPausedRef.current) {
        return;
      }

      if (e.key === ' ' || e.key === 'Backspace' || e.key === 'Enter' || e.key.length === 1) {
        e.preventDefault();
      }

      let keyToProcess = e.key;
      const currentLayout = keyboardLayoutRef.current;
      if (currentLayout !== 'qwerty' && e.key.length === 1 && e.key !== ' ' && e.key !== 'Enter') {
        keyToProcess = getLayoutCharFromEvent(e, currentLayout);
      }

      if (handleTypingKeyRef.current) handleTypingKeyRef.current(keyToProcess, e.code);
    };

    window.addEventListener('keydown', handleGlobalTyping);
    return () => window.removeEventListener('keydown', handleGlobalTyping);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // handleTypingKey uses refs exclusively — no state deps → no stale-closure-caused re-registrations
  const handleTypingKey = useCallback((key: string, physicalCode?: string) => {
    const typedText = typedTextRef.current;
    const targetText = targetTextRef.current;
    const autoInsertedBrackets = autoInsertedBracketsRef.current;
    const workoutCompleted = workoutCompletedRef.current;
    const isPaused = isPausedRef.current;
    const timedEndModalOpen = timedEndModalOpenRef.current;
    const freestyleMode = freestyleModeRef.current;
    const activeAppMode = activeAppModeRef.current;
    const startTime = startTimeRef.current;
    const elapsed = elapsedRef.current;
    const testDuration = testDurationRef.current;
    const currentPassageIndex = currentPassageIndexRef.current;
    const currentLesson = currentLessonRef.current;

    if (workoutCompleted || isPaused || timedEndModalOpen) return;

    // Start timer on first keypress
    if (typedText.length === 0 && !startTime) {
      setStartTime(Date.now());
      setAiStoryOpen(false);
    }

    if (key === 'Backspace') {
      // Exam Mode: block backspace entirely (simulates SSC strict exam)
      if (examModeRef.current) {
        sfx.playClick(true, false); // play error sound to indicate blocked
        return;
      }
      if (typedText.length > 0) {
        sfx.playClick(false, false);
        if (backspaceClusterRef.current === 0) {
          backspaceClusterStartRef.current = typedText.length;
        }
        backspaceClusterRef.current += 1;
        // Critical: update text display state in one urgent render
        setTypingState(prev => {
          const prevTyped = prev.typedText;
          if (prevTyped.length === 0) return prev;
          const deletedChar = prevTyped[prevTyped.length - 1];
          const nextCharIndex = prevTyped.length;
          const backspacedIndex = prevTyped.length - 1;

          let nextBrackets = prev.autoInsertedBrackets;
          if (activeAppMode === 'code' && (deletedChar === '(' || deletedChar === '{' || deletedChar === '[') && nextBrackets.includes(nextCharIndex)) {
            nextBrackets = nextBrackets.filter(idx => idx !== nextCharIndex);
          }

          let nextMistypes = prev.mistypedNewlineIndices;
          if (nextMistypes.has(backspacedIndex)) {
            nextMistypes = new Set(nextMistypes);
            nextMistypes.delete(backspacedIndex);
          }

          return {
            ...prev,
            typedText: prevTyped.slice(0, -1),
            autoInsertedBrackets: nextBrackets,
            mistypedNewlineIndices: nextMistypes,
          };
        });
      }
    } else if (key.length === 1 || key === 'Enter') {
      const charToCompare = key === 'Enter' ? '\n' : key;

      if (backspaceClusterRef.current > 0) {
        const newCluster = {
          count: backspaceClusterRef.current,
          index: backspaceClusterStartRef.current,
          timestamp: Date.now()
        };
        const currentClusters = localStorage.getItem('backspaceClusters');
        const prevClusters = currentClusters ? JSON.parse(currentClusters) : [];
        const updatedClusters = [...prevClusters, newCluster].slice(-100);
        localStorage.setItem('backspaceClusters', JSON.stringify(updatedClusters));

        backspaceClusterRef.current = 0;
        backspaceClusterStartRef.current = -1;
      }

      // Track keystroke time for bigram analysis (ref, no render)
      keystrokeTimesRef.current.push({ key: charToCompare, ts: Date.now() });

      if (freestyleMode) {
        sfx.playClick(key === ' ' || key === 'Enter', false);
        // URGENT: just update text
        setTypingState(prev => ({ ...prev, typedText: prev.typedText + charToCompare }));
        // LOW PRIORITY: update stats
        startStatsTransition(() => {
          setTypingState(prev => ({
            ...prev,
            physicalKeyPresses: physicalCode
              ? { ...prev.physicalKeyPresses, [physicalCode]: (prev.physicalKeyPresses[physicalCode] || 0) + 1 }
              : prev.physicalKeyPresses,
          }));
        });
      } else {
        // Normal Mode
        const expectedChar = targetText[typedText.length];

        // Block advancement if expected is newline and user pressed something else
        if (expectedChar === '\n' && charToCompare !== '\n') {
          sfx.playClick(key === ' ' || key === 'Enter', true);
          const charKey = charToCompare.toLowerCase();
          // Mistyped newline: the mistypedNewlineIndices is needed for display
          setTypingState(prev => ({
            ...prev,
            mistypedNewlineIndices: (() => {
              const next = new Set(prev.mistypedNewlineIndices);
              // Use prev.typedText.length — avoids stale closure from outer scope
              next.add(prev.typedText.length);
              return next;
            })(),
          }));
          // Stats are low priority
          startStatsTransition(() => {
            setTypingState(prev => ({
              ...prev,
              fumbles: { ...prev.fumbles, [charKey]: (prev.fumbles[charKey] || 0) + 1 },
              physicalKeyErrors: physicalCode
                ? { ...prev.physicalKeyErrors, [physicalCode]: (prev.physicalKeyErrors[physicalCode] || 0) + 1 }
                : prev.physicalKeyErrors,
            }));
          });
          return;
        }

        const isCorrect = charToCompare === expectedChar;
        sfx.playClick(key === ' ' || key === 'Enter', !isCorrect);

        // Pre-compute derived values synchronously (no state)
        let punishedIdx: number | null = null;
        if (!isCorrect) {
          const tokens = targetText.split(/(\s+)/);
          let tempGlobalIndex = 0;
          for (let i = 0; i < tokens.length; i++) {
            const len = tokens[i].length;
            if (typedText.length >= tempGlobalIndex && typedText.length < tempGlobalIndex + len) {
              punishedIdx = i;
              break;
            }
            tempGlobalIndex += len;
          }
        }

        let newBracketIndex: number | null = null;
        if (activeAppMode === 'code' && isCorrect && (charToCompare === '(' || charToCompare === '{' || charToCompare === '[')) {
          const matchingChar = charToCompare === '(' ? ')' : charToCompare === '{' ? '}' : ']';
          let depth = 0;
          for (let i = typedText.length; i < targetText.length; i++) {
            if (targetText[i] === charToCompare) depth++;
            else if (targetText[i] === matchingChar) {
              depth--;
              if (depth === 0) { newBracketIndex = i; break; }
            }
          }
        }

        const newTyped = typedText + charToCompare;
        const charKey = charToCompare.toLowerCase();

        // URGENT: update only what TypingText needs to display correctly
        setTypingState(prev => {
          const next: typeof prev = {
            ...prev,
            typedText: newTyped,
          };
          if (punishedIdx !== null) next.punishedTokenIndex = punishedIdx;
          if (newBracketIndex !== null) next.autoInsertedBrackets = [...prev.autoInsertedBrackets, newBracketIndex];
          return next;
        });

        // LOW PRIORITY: update stats — React can interrupt these if a new keystroke arrives
        startStatsTransition(() => {
          setTypingState(prev => {
            const next: typeof prev = { ...prev };
            if (physicalCode) {
              next.physicalKeyPresses = { ...prev.physicalKeyPresses, [physicalCode]: (prev.physicalKeyPresses[physicalCode] || 0) + 1 };
            }
            if (!isCorrect) {
              if (physicalCode) {
                next.physicalKeyErrors = { ...prev.physicalKeyErrors, [physicalCode]: (prev.physicalKeyErrors[physicalCode] || 0) + 1 };
              }
              if (charToCompare.match(/^[a-zA-Z0-9;,.?!\n ]$/)) {
                next.fumbles = { ...prev.fumbles, [charKey]: (prev.fumbles[charKey] || 0) + 1 };
              }
            }
            return next;
          });
        });

        // Clear punishment after 200ms (infrequent)
        if (punishedIdx !== null) {
          setTimeout(() => {
            setTypingState(prev => prev.punishedTokenIndex === punishedIdx ? { ...prev, punishedTokenIndex: null } : prev);
          }, 200);
        }

        // Verify completion
        if (newTyped.length >= targetText.length) {
          if (testDuration !== null) {
            // Infinite timed mode: append the next classic literature passage smoothly
            if (currentLesson.category === "Practice Stories") {
              const filtered = getFilteredStories(testDuration);
              if (filtered.length > 0) {
                const currentIdx = filtered.findIndex(l => l.id === currentLesson.id);
                const nextIdx = currentIdx === -1 ? 0 : (currentIdx + 1) % filtered.length;
                const nextStory = filtered[nextIdx];
                if (nextStory && nextStory.customText) {
                  // Clean formatting and whitespaces before appending
                  const cleanCurrentText = (currentLesson.customText || "").replace(/\s+/g, ' ').trim();
                  const cleanNextText = nextStory.customText.replace(/\s+/g, ' ').trim();

                  // Construct the combined custom text with a space/newline separation
                  const combinedText = cleanCurrentText + "\n\n" + cleanNextText;

                  const mergedLesson: Lesson = {
                    ...currentLesson,
                    customText: combinedText,
                  };

                  isAppendingRef.current = true;
                  setCurrentLesson(mergedLesson);

                  const nextParsed = getLessonStructure(mergedLesson);
                  const nextFormattedText = buildTargetTextFromStructure(nextParsed);
                  setTargetText(nextFormattedText);

                  if (nextStory.id) {
                    setSelectedStoryId(nextStory.id);
                  }
                } else {
                  const nextIdxPassage = (currentPassageIndex + 1) % PASSAGES.length;
                  setCurrentPassageIndex(nextIdxPassage);
                  const nextPassage = PASSAGES[nextIdxPassage];

                  const cleanCurrentText = (currentLesson.customText || "").replace(/\s+/g, ' ').trim();
                  const cleanNextPassage = nextPassage.replace(/\s+/g, ' ').trim();
                  const combinedText = cleanCurrentText + "\n\n" + cleanNextPassage;
                  const mergedLesson: Lesson = {
                    ...currentLesson,
                    customText: combinedText,
                  };

                  isAppendingRef.current = true;
                  setCurrentLesson(mergedLesson);

                  const nextParsed = getLessonStructure(mergedLesson);
                  const nextFormattedText = buildTargetTextFromStructure(nextParsed);
                  setTargetText(nextFormattedText);
                }
              } else {
                const nextIdxPassage = (currentPassageIndex + 1) % PASSAGES.length;
                setCurrentPassageIndex(nextIdxPassage);
                const nextPassage = PASSAGES[nextIdxPassage];

                const cleanCurrentText = (currentLesson.customText || "").replace(/\s+/g, ' ').trim();
                const cleanNextPassage = nextPassage.replace(/\s+/g, ' ').trim();
                const combinedText = cleanCurrentText + "\n\n" + cleanNextPassage;
                const mergedLesson: Lesson = {
                  ...currentLesson,
                  customText: combinedText,
                };

                isAppendingRef.current = true;
                setCurrentLesson(mergedLesson);

                const nextParsed = getLessonStructure(mergedLesson);
                const nextFormattedText = buildTargetTextFromStructure(nextParsed);
                setTargetText(nextFormattedText);
              }
            } else {
              const nextIdx = (currentPassageIndex + 1) % PASSAGES.length;
              setCurrentPassageIndex(nextIdx);
              const nextPassage = PASSAGES[nextIdx];

              const cleanCurrentText = (currentLesson.customText || "").replace(/\s+/g, ' ').trim();
              const cleanNextPassage = nextPassage.replace(/\s+/g, ' ').trim();
              const combinedText = cleanCurrentText + "\n\n" + cleanNextPassage;
              const mergedLesson: Lesson = {
                ...currentLesson,
                customText: combinedText,
              };

              isAppendingRef.current = true;
              setCurrentLesson(mergedLesson);

              const nextParsed = getLessonStructure(mergedLesson);
              const nextFormattedText = buildTargetTextFromStructure(nextParsed);
              setTargetText(nextFormattedText);
            }
          } else {
            // Standard/Unlimited mode: complete the lesson
            // Use real wall-clock duration to avoid stale elapsed ref (ticks every 250ms)
            const nowTs = Date.now();
            const startTs = startTimeRef.current || nowTs;
            const durationSec = Math.max(0.5, (nowTs - startTs) / 1000);
            let correctsCount = 0;
            for (let i = 0; i < targetText.length; i++) {
              if (newTyped[i] === targetText[i]) correctsCount++;
            }

            // Industry-standard: correct chars / total chars typed (matches timed mode formula)
            const accuracy = newTyped.length > 0 ? Math.round((correctsCount / newTyped.length) * 100) : 100;
            const wpm = Math.round((newTyped.length / 5) / (durationSec / 60));

            if (botRaceActive || adaptiveBossActive) {
              setWorkoutCompleted(true);
              setRaceWinner('user');
              const oppWpm = botRaceActive ? botWpm : bossWpm;
              setRaceMetrics({
                userWpm: wpm,
                userAcc: accuracy,
                opponentWpm: oppWpm,
                opponentAcc: 100
              });

              if (botRaceActive) {
                setUserWins(prev => {
                  const next = prev + 1;
                  localStorage.setItem("ribbon_user_wins", String(next));
                  return next;
                });
              } else {
                setBossWinStreak(prev => {
                  const next = prev + 1;
                  localStorage.setItem("ribbon_boss_win_streak", String(next));
                  return next;
                });
              }

              setTimeout(() => {
                checkBotRaceAchievements(botRaceActive ? 'bot' : 'boss');
              }, 100);

              setRaceEndModalOpen(true);
              playCompletionSound();
              return;
            }

            setWorkoutCompleted(true);
            setWorkoutStats({ wpm, accuracy, duration: durationSec });
            analyzeKeystrokes(); // Calculate slowest bi-gram and trigger coach drill

            // Handle special weekly challenge completion (id 9990)
            if (currentLesson.id === 9990) {
              const weekId = weeklyChallengeWeekId || getCurrentWeekId();
              const existingPbStr = localStorage.getItem(`ribbon_weekly_pb_${weekId}`);
              const existingPb = existingPbStr ? JSON.parse(existingPbStr) : null;

              if (!existingPb || wpm > existingPb.wpm || (wpm === existingPb.wpm && accuracy > existingPb.accuracy)) {
                const newPb = { wpm, accuracy, timestamp: Date.now() };
                localStorage.setItem(`ribbon_weekly_pb_${weekId}`, JSON.stringify(newPb));
                setWeeklyChallengePB(newPb);

                // Update leaderboard
                const lb = getLeaderboardForWeek(weekId);
                const userIndex = lb.findIndex((item: any) => item.isUser);
                if (userIndex >= 0) {
                  lb[userIndex].wpm = wpm;
                  lb[userIndex].accuracy = accuracy;
                  lb[userIndex].name = username;
                } else {
                  lb.push({ name: username, wpm, accuracy, isUser: true });
                }
                lb.sort((a: any, b: any) => b.wpm - a.wpm || b.accuracy - a.accuracy);
                localStorage.setItem(`ribbon_weekly_leaderboard_${weekId}`, JSON.stringify(lb));
                setWeeklyLeaderboard(lb);

                // Calculate percentile and badge
                const newUserIndex = lb.findIndex((item: any) => item.isUser);
                const rank = newUserIndex + 1;
                const totalPlayers = lb.length;
                const percentile = ((totalPlayers - rank) / totalPlayers) * 100;

                let badge: "Gold" | "Silver" | "Bronze" | "None" = "None";
                if (percentile >= 90) badge = "Gold";
                else if (percentile >= 75) badge = "Silver";
                else if (percentile >= 50) badge = "Bronze";

                // Save weekly history
                const historyKey = "ribbon_weekly_history";
                const historyStr = localStorage.getItem(historyKey);
                const weeklyHistory = historyStr ? JSON.parse(historyStr) : [];
                const histIndex = weeklyHistory.findIndex((item: any) => item.weekId === weekId);
                const historyItem = {
                  weekId,
                  wpm,
                  accuracy,
                  badge,
                  rank,
                  totalPlayers,
                  timestamp: Date.now()
                };

                if (histIndex >= 0) {
                  weeklyHistory[histIndex] = historyItem;
                } else {
                  weeklyHistory.unshift(historyItem);
                }
                localStorage.setItem(historyKey, JSON.stringify(weeklyHistory));
              }
            }

            // Handle special smart drill completion (id 8889)
            if (currentLesson.id === 8889) {
              if (accuracy > 95) {
                setFocusBadgeEarned(true);
                localStorage.setItem("ribbon_focus_badge_earned", "true");
              }
            }

            // Save session history
            const sessionItem: SessionHistoryItem = {
              wpm,
              accuracy,
              ts: Date.now(),
              script: currentScript
            };
            setHistory(prev => [sessionItem, ...prev].slice(0, 500));

            // Sync global metrics
            setGlobalStats(prev => {
              const tests = prev.totalTests + 1;
              return {
                ...prev,
                totalTests: tests,
                avgWpm: Math.round((prev.avgWpm * prev.totalTests + wpm) / tests),
                bestWpm: Math.max(prev.bestWpm, wpm),
                accuracy: parseFloat(((prev.accuracy * prev.totalTests + accuracy) / tests).toFixed(1)),
                timeSpentMin: prev.timeSpentMin + 1
              };
            });

            // Award streak increment (once per calendar day)
            {
              const today = new Date().toDateString();
              const lastStreakDate = localStorage.getItem("ribbon_last_streak_date");
              if (lastStreakDate !== today) {
                setStreak(s => s + 1);
                localStorage.setItem("ribbon_last_streak_date", today);
              }
            }

            // Update daily goals progress
            setDailyGoalsProgress(prev => {
              const today = new Date().toDateString();
              const lastDate = localStorage.getItem("daily_goals_last_date");
              const basePrev = (lastDate && lastDate !== today)
                ? { practiceMin: 0, wordsTyped: 0, bestWpmToday: 0 }
                : prev;

              const minutesEarned = Math.max(1, Math.round(durationSec / 60));
              const wordsEarned = Math.round(newTyped.length / 5);
              const nextPracticeMin = basePrev.practiceMin + minutesEarned;
              const nextWordsTyped = basePrev.wordsTyped + wordsEarned;
              const nextBestWpm = Math.max(basePrev.bestWpmToday, wpm);

              const wasCompletedBefore = basePrev.practiceMin >= dailyGoals.practiceMin &&
                basePrev.wordsTyped >= dailyGoals.wordsTyped &&
                basePrev.bestWpmToday >= dailyGoals.targetWpm;

              const isCompletedNow = nextPracticeMin >= dailyGoals.practiceMin &&
                nextWordsTyped >= dailyGoals.wordsTyped &&
                nextBestWpm >= dailyGoals.targetWpm;

              if (isCompletedNow && !wasCompletedBefore) {
                setGoalsStreak(s => s + 1);
                setGoalToast("🎉 Daily Practice Goals Completed! Streak extended!");
                setTimeout(() => setGoalToast(null), 5000);
              }

              return {
                practiceMin: nextPracticeMin,
                wordsTyped: nextWordsTyped,
                bestWpmToday: nextBestWpm
              };
            });

            // Check typing achievements
            setTimeout(() => {
              checkTypingAchievements(wpm, globalStats.totalTests + 1);
            }, 100);

            // Log own activity to the feed
            setActivities(prev => [{
              user: username || "You",
              action: `completed "${currentLesson.name}" at ${wpm} WPM (${accuracy}% acc)!`,
              timestamp: new Date().toISOString()
            }, ...prev].slice(0, 30));
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleTimedTestCompletion]);

  // Keep the handleTypingKeyRef always pointing to the latest version
  useEffect(() => {
    handleTypingKeyRef.current = handleTypingKey;
  }, [handleTypingKey]);

  // Reset current typing session
  const handleResetSession = useCallback(() => {
    if (backspaceClusterRef.current > 0) {
      const newCluster = {
        count: backspaceClusterRef.current,
        index: backspaceClusterStartRef.current,
        timestamp: Date.now()
      };
      const currentClusters = localStorage.getItem('backspaceClusters');
      const prevClusters = currentClusters ? JSON.parse(currentClusters) : [];
      const updatedClusters = [...prevClusters, newCluster].slice(-100);
      localStorage.setItem('backspaceClusters', JSON.stringify(updatedClusters));
      backspaceClusterRef.current = 0;
      backspaceClusterStartRef.current = -1;
    }

    let nextText = currentLesson.customText || "";
    if (activeAppMode === 'code' && currentLesson.id === 9001) {
      const randomSnippet = CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)];
      setCurrentLesson(prev => ({ ...prev, customText: randomSnippet }));
      nextText = randomSnippet;
    } else if (activeAppMode === 'medical' && currentLesson.id === 9002) {
      const randomMedical = MEDICAL_PRACTICE_TEXTS[Math.floor(Math.random() * MEDICAL_PRACTICE_TEXTS.length)];
      setCurrentLesson(prev => ({ ...prev, customText: randomMedical }));
      nextText = formatParagraphToLines(randomMedical);
    }

    setTypingState(prev => ({
      ...prev,
      typedText: "",
      mistypedNewlineIndices: new Set(),
      autoInsertedBrackets: []
    }));
    const carets = document.querySelectorAll('.custom-caret') as NodeListOf<HTMLDivElement>;
    carets.forEach(caret => {
      caret.style.display = 'none';
    });
    const suggestions = document.querySelectorAll('.custom-suggestion') as NodeListOf<HTMLDivElement>;
    suggestions.forEach(sug => {
      sug.style.display = 'none';
    });
    setStartTime(null);
    setElapsed(0);
    setWorkoutCompleted(false);
    setWorkoutStats(null);
    setIsPaused(false);
    setTimedEndModalOpen(false);
    setCurrentPassageIndex(0);

    if (activeAppMode === 'normal') {
      const parsed = getLessonStructure(currentLesson);
      setTargetText(buildTargetTextFromStructure(parsed));
    } else {
      setTargetText(nextText);
    }

    keystrokeTimesRef.current = [];
    setPunishedTokenIndex(null);
    setBotProgress(0);
    setBossProgress(0);
  }, [currentLesson, activeAppMode]);

  // Generate weakness practice drill
  const generateWeaknessDrill = async (bigram: string) => {
    setSentenceGenerating(true);
    try {
      let drillText = "";
      try {
        const res = await fetch("/api/generate-drill", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ bigram, script: currentScript }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.drill) drillText = data.drill;
        }
      } catch (e) {
        console.warn("Drill API unavailable, using fallback:", e);
      }

      if (!drillText) {
        const prompt = currentScript === 'hindi'
          ? `Create a short 25-word typing practice sentence in Hindi focused on character pair "${bigram}".`
          : `Create a short 25-word typing practice sentence in English with high frequency of "${bigram}".`;
        drillText = await generateText(prompt);
      }

      if (drillText) {
        setWeaknessSentence(drillText);
      }
    } catch (err) {
      console.error("Failed to generate custom drill:", err);
    } finally {
      setSentenceGenerating(false);
    }
  };

  // Analyze keystrokes after test to find the slowest bigram
  const analyzeKeystrokes = () => {
    const list = keystrokeTimesRef.current;
    if (list.length < 2) return;

    let slowestBigram: string | null = null;
    let maxDelay = 0;

    for (let i = 1; i < list.length; i++) {
      const k1 = list[i - 1];
      const k2 = list[i];

      const char1 = k1.key.toLowerCase();
      const char2 = k2.key.toLowerCase();

      // Check if both are lowercase English alphabetic characters
      if (char1.match(/^[a-z]$/) && char2.match(/^[a-z]$/)) {
        const delay = k2.ts - k1.ts;
        if (delay > maxDelay) {
          maxDelay = delay;
          slowestBigram = char1 + char2;
        }
      }
    }

    // Save aggregate bigram statistics to localStorage
    if (typeof localStorage !== "undefined") {
      try {
        const savedDelaysStr = localStorage.getItem("ribbon_bigram_delays");
        const bigramDelays: Record<string, { totalDelay: number; count: number }> = savedDelaysStr ? JSON.parse(savedDelaysStr) : {};
        for (let i = 1; i < list.length; i++) {
          const k1 = list[i - 1];
          const k2 = list[i];
          const char1 = k1.key.toLowerCase();
          const char2 = k2.key.toLowerCase();
          if (char1.match(/^[a-z]$/) && char2.match(/^[a-z]$/)) {
            const delay = k2.ts - k1.ts;
            const bigram = char1 + char2;
            if (!bigramDelays[bigram]) {
              bigramDelays[bigram] = { totalDelay: 0, count: 0 };
            }
            bigramDelays[bigram].totalDelay += delay;
            bigramDelays[bigram].count += 1;
          }
        }
        localStorage.setItem("ribbon_bigram_delays", JSON.stringify(bigramDelays));
      } catch (e) {
        console.error("Failed to save aggregate bigram delays:", e);
      }
    }

    if (slowestBigram && maxDelay > 300) {
      setWeaknessBigram(slowestBigram);
      setWeaknessDelay(maxDelay);
      generateWeaknessDrill(slowestBigram);
    } else {
      setWeaknessBigram(null);
      setWeaknessDelay(null);
      setWeaknessSentence(null);
    }
  };

  // Practice the detected weakness
  const practiceWeakness = () => {
    if (!weaknessSentence) return;
    sfx.playClick();
    const weaknessLesson: Lesson = {
      id: 8888,
      name: `🔧 Practice Weakness: '${weaknessBigram?.toUpperCase()}'`,
      keys: [weaknessBigram?.[0] || "", weaknessBigram?.[1] || ""],
      desc: `Custom drill sentence targeting the '${weaknessBigram}' bigram where your keypress delay was ${weaknessDelay}ms`,
      customText: weaknessSentence
    };
    setActiveAppMode('normal');
    setCurrentLesson(weaknessLesson);
    setTargetText(weaknessSentence.replace(/\s+/g, ' ').trim());
    setTypedText("");
    setStartTime(null);
    setElapsed(0);
    setWorkoutCompleted(false);
    setWorkoutStats(null);
    setTimedEndModalOpen(false);
    keystrokeTimesRef.current = [];
    setPunishedTokenIndex(null);
  };

  // Generate custom story from AI
  const generateAIStory = async () => {
    if (!storyTopic.trim()) return;
    setStoryGenerating(true);
    const activeDuration = testDuration ? Math.round(testDuration / 60) : storyDuration;
    sfx.playClick();
    try {
      let storyText = "";
      try {
        const res = await fetch("/api/generate-story", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ topic: storyTopic, duration: activeDuration, script: currentScript }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.story) storyText = data.story;
        }
      } catch (e) {
        console.warn("Server API unavailable, using client LLM fallback:", e);
      }

      // Client-side fallback if server API is unavailable (e.g. static host like Netlify)
      if (!storyText) {
        const langPrompt = currentScript === 'hindi'
          ? `Write a clean, inspiring story in Hindi (Devanagari script) about "${storyTopic}". Target duration: ${activeDuration} minutes typing test (~${activeDuration * 40} words). Do NOT use special symbols, smart quotes, or dashes.`
          : `Write an engaging typing practice story about "${storyTopic}". Target length: ~${activeDuration * 40} words. Use clean standard punctuation only.`;
        storyText = await generateStory(langPrompt, activeDuration * 40);
      }

      if (storyText) {
        const aiLesson: Lesson = {
          id: 9999,
          name: `🔮 AI Story: ${storyTopic} (${activeDuration}min)`,
          keys: null,
          desc: `${activeDuration}-minute AI story about "${storyTopic}"`,
          customText: storyText
        };
        // Reset auto-append guards for the fresh session
        aiPrefetchInFlightRef.current = false;
        aiPrefetchTriggeredAtRef.current = 0;
        setActiveAppMode('normal');
        setCurrentLesson(aiLesson);
        setTargetText(storyText.replace(/\s+/g, ' ').trim());
        setTypedText("");
        setStartTime(null);
        setElapsed(0);
        setWorkoutCompleted(false);
        setWorkoutStats(null);
        setTimedEndModalOpen(false);
        keystrokeTimesRef.current = [];
        setPunishedTokenIndex(null);
        setAiStoryOpen(false); // Disappear on story generation
      }
    } catch (err) {
      console.error("Failed to generate AI story:", err);
    } finally {
      setStoryGenerating(false);
    }
  };

  // Helper: Get current Monday UTC date as week id
  const getCurrentWeekId = (): string => {
    const d = new Date();
    const day = d.getUTCDay();
    const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setUTCDate(diff));
    return monday.toISOString().split('T')[0];
  };

  // Helper: Load/Seed leaderboard
  const getLeaderboardForWeek = (weekId: string): any[] => {
    const key = `ribbon_weekly_leaderboard_${weekId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved);
    }
    const competitors = [
      { name: "ApexTypist", wpm: 134, accuracy: 99 },
      { name: "NeonFinger", wpm: 121, accuracy: 98 },
      { name: "LaserKeys", wpm: 112, accuracy: 97 },
      { name: "ViperClack", wpm: 104, accuracy: 96 },
      { name: "QwertyQueen", wpm: 97, accuracy: 97 },
      { name: "SpeedySam", wpm: 89, accuracy: 95 },
      { name: "TypeTuring", wpm: 83, accuracy: 96 },
      { name: "MechanicalMage", wpm: 78, accuracy: 94 },
      { name: "TactileTactician", wpm: 74, accuracy: 93 },
      { name: "ClackMaster", wpm: 69, accuracy: 92 },
      { name: "ShiftHacker", wpm: 65, accuracy: 91 },
      { name: "KeyScribe", wpm: 61, accuracy: 90 },
      { name: "SyntaxSamurai", wpm: 56, accuracy: 91 },
      { name: "SpacebarGlider", wpm: 52, accuracy: 89 },
      { name: "CapLockKid", wpm: 48, accuracy: 88 },
      { name: "SlowSnail", wpm: 43, accuracy: 87 },
      { name: "MatrixRunner", wpm: 39, accuracy: 85 }
    ];
    localStorage.setItem(key, JSON.stringify(competitors));
    return competitors;
  };

  // Helper: Load user's personal best for specific week
  const loadWeeklyPB = (weekId: string) => {
    const saved = localStorage.getItem(`ribbon_weekly_pb_${weekId}`);
    return saved ? JSON.parse(saved) : null;
  };

  // Function to open the Weekly Challenge modal/slideout and fetch story
  const openWeeklyChallenge = async () => {
    setWeeklyChallengeOpen(true);
    setWeeklyChallengeLoading(true);
    sfx.playClick();

    const weekId = `week_${Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))}`;
    let challengeStory = "";

    try {
      const res = await fetch("/api/weekly-challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: currentScript })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.story) {
          challengeStory = data.story;
        }
      }
    } catch (e) {
      console.warn("Weekly challenge API offline, using client-side fallback:", e);
    }

    if (!challengeStory) {
      challengeStory = currentScript === 'hindi'
        ? "साहस और लगन से ही सफलता मिलती है। निरंतर अभ्यास से आप अपनी टाइपिंग गति और सटीकता को नई ऊंचाइयों पर ले जा सकते हैं।"
        : "The speed of light in a vacuum is approximately 299,792,458 meters per second. In the realm of competitive typing, mastery requires unwavering focus, steady rhythm, and deliberate practice across complex sentence structures.";
    }

    setWeeklyChallengeStory(challengeStory);
    setWeeklyChallengeWeekId(weekId);

    const pb = loadWeeklyPB(weekId);
    setWeeklyChallengePB(pb);

    const lb = getLeaderboardForWeek(weekId);
    if (pb) {
      const userIndex = lb.findIndex((item: any) => item.isUser);
      if (userIndex >= 0) {
        lb[userIndex].wpm = Math.max(lb[userIndex].wpm, pb.wpm);
        lb[userIndex].accuracy = Math.max(lb[userIndex].accuracy, pb.accuracy);
        lb[userIndex].name = username;
      } else {
        lb.push({ name: username, wpm: pb.wpm, accuracy: pb.accuracy, isUser: true });
      }
      lb.sort((a: any, b: any) => b.wpm - a.wpm || b.accuracy - a.accuracy);
      localStorage.setItem(`ribbon_weekly_leaderboard_${weekId}`, JSON.stringify(lb));
    }
    setWeeklyLeaderboard(lb);
    setWeeklyChallengeLoading(false);
  };

  // Function to start playing the Weekly Challenge
  const startWeeklyChallenge = () => {
    if (!weeklyChallengeStory) return;
    sfx.playClick();
    const challengeLesson: Lesson = {
      id: 9990,
      name: "🏆 Weekly Challenge",
      keys: null,
      desc: "Kaggle-style asynchronous global typing challenge!",
      customText: weeklyChallengeStory
    };
    setActiveAppMode('normal');
    setCurrentLesson(challengeLesson);
    setTargetText(weeklyChallengeStory.replace(/\s+/g, ' ').trim());
    setTypedText("");
    setStartTime(null);
    setElapsed(0);
    setWorkoutCompleted(false);
    setWorkoutStats(null);
    setTimedEndModalOpen(false);
    setWeeklyChallengeOpen(false);
    keystrokeTimesRef.current = [];
    setPunishedTokenIndex(null);
  };

  // Helper: Retrieve top 3 fumbles
  const getTopFumbles = () => {
    const sorted = Object.entries(fumbles)
      .filter(([char]) => char.match(/^[a-z]$/i))
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 3);
    const fallbacks = ["q", "z", "b", "p", "x"];
    while (sorted.length < 3) {
      const nextFallback = fallbacks.find(f => !sorted.some(s => s[0] === f)) || "q";
      sorted.push([nextFallback, 1]);
    }
    return sorted.map(([char, count]) => ({ char, count }));
  };

  // Helper: Retrieve top 3 slowest bigrams
  const getTopSlowestBigrams = () => {
    if (typeof localStorage === 'undefined') {
      return [
        { bigram: "th", delay: 310 },
        { bigram: "er", delay: 285 },
        { bigram: "ou", delay: 260 }
      ];
    }
    const savedDelaysStr = localStorage.getItem("ribbon_bigram_delays");
    if (!savedDelaysStr) {
      return [
        { bigram: "th", delay: 310 },
        { bigram: "er", delay: 285 },
        { bigram: "ou", delay: 260 }
      ];
    }
    try {
      const bigramDelays: Record<string, { totalDelay: number, count: number }> = JSON.parse(savedDelaysStr);
      const sorted = Object.entries(bigramDelays)
        .map(([bigram, data]) => ({ bigram, delay: Math.round(data.totalDelay / data.count) }))
        .sort((a, b) => b.delay - a.delay)
        .slice(0, 3);
      const fallbacks = ["th", "er", "ou", "re", "in", "an"];
      while (sorted.length < 3) {
        const nextFallback = fallbacks.find(f => !sorted.some(s => s.bigram === f)) || "th";
        sorted.push({ bigram: nextFallback, delay: 250 });
      }
      return sorted;
    } catch (e) {
      return [
        { bigram: "th", delay: 310 },
        { bigram: "er", delay: 285 },
        { bigram: "ou", delay: 260 }
      ];
    }
  };

  // Function to generate a Smart Drill based on top fumbles and bigrams
  const generateSmartDrill = async () => {
    setSmartDrillGenerating(true);
    sfx.playClick();
    try {
      const fumblesArr = getTopFumbles().map(f => f.char);
      const bigramsArr = getTopSlowestBigrams().map(b => b.bigram);

      let drillText = "";
      try {
        const res = await fetch("/api/generate-smart-drill", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fumbles: fumblesArr, bigrams: bigramsArr, script: currentScript })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.drill) drillText = data.drill;
        }
      } catch (e) {
        console.warn("Smart drill server API unavailable, using fallback:", e);
      }

      if (!drillText) {
        const prompt = currentScript === 'hindi'
          ? `Create a 40-word Hindi typing drill targeting key fumbles: [${fumblesArr.join(', ')}] and bigrams: [${bigramsArr.join(', ')}].`
          : `Create a 40-word English typing drill targeting key fumbles: [${fumblesArr.join(', ')}] and bigrams: [${bigramsArr.join(', ')}].`;
        drillText = await generateText(prompt);
      }

      if (drillText) {
        const drillLesson: Lesson = {
          id: 8889,
          name: "🧠 Smart Weakness Drill",
          keys: null,
          desc: `Custom lesson targeting fumbles: ${fumblesArr.join(", ")} and bigrams: ${bigramsArr.join(", ")}`,
          customText: drillText
        };
        setActiveAppMode('normal');
        setCurrentLesson(drillLesson);
        setTargetText(drillText.replace(/\s+/g, ' ').trim());
        setTypedText("");
        setStartTime(null);
        setElapsed(0);
        setWorkoutCompleted(false);
        setWorkoutStats(null);
        setTimedEndModalOpen(false);
        keystrokeTimesRef.current = [];
        setPunishedTokenIndex(null);
      }
    } catch (err) {
      console.error("Failed to generate Smart Drill:", err);
    } finally {
      setSmartDrillGenerating(false);
    }
  };

  // Legacy arcade game loop has been removed to prevent background shield expiration from closing ArcadeHub.

  // Load selected exercise
  const getFilteredStories = (duration: number | null, applyFilter: boolean = true, script: 'english' | 'hindi' = currentScript): Lesson[] => {
    const categoryName = script === 'hindi' ? 'Practice Stories (Hindi)' : 'Practice Stories';
    const matchingCustom = customStories.filter(s => s.category === categoryName);
    const stories = [...matchingCustom, ...LESSONS.filter(l => l.category === categoryName)];
    if (!applyFilter) {
      return stories;
    }
    if (duration === 900 || duration === 600 || duration === null) {
      // 10 Min, 15 Min or Unlimited -> Long (500+ words for Hindi, 1000+ for English)
      const threshold = script === 'hindi' ? 500 : 1000;
      return stories.filter(s => {
        const wc = s.customText ? s.customText.split(/\s+/).filter(Boolean).length : 0;
        return wc >= threshold;
      });
    } else if (duration === 60 || duration === 120) {
      // 1 Min or 2 Min -> Short (80-300 words for Hindi, 150-300 for English)
      const min = script === 'hindi' ? 80 : 150;
      const max = script === 'hindi' ? 200 : 300;
      return stories.filter(s => {
        const wc = s.customText ? s.customText.split(/\s+/).filter(Boolean).length : 0;
        return wc >= min && wc <= max;
      });
    } else if (duration === 300) {
      // 5 Min -> Medium (200-600 words for Hindi, 500-800 for English)
      const min = script === 'hindi' ? 200 : 500;
      const max = script === 'hindi' ? 600 : 800;
      return stories.filter(s => {
        const wc = s.customText ? s.customText.split(/\s+/).filter(Boolean).length : 0;
        return wc >= min && wc <= max;
      });
    }
    return stories;
  };

  const loadLesson = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    if (lesson.category && lesson.category.startsWith("Practice Stories")) {
      setSelectedStoryId(lesson.id);
    }
    // Fully reset session state so stale typed text / completion state
    // doesn't persist when switching to a lesson with identical text
    setTypedText("");
    setStartTime(null);
    setElapsed(0);
    setWorkoutCompleted(false);
    setWorkoutStats(null);
    keystrokeTimesRef.current = [];
    setActiveModal(null);
  };

  const getRandomStoryLesson = (duration: number | null = testDuration): Lesson => {
    const filtered = getFilteredStories(duration, true);
    const randomIndex = Math.floor(Math.random() * filtered.length);
    return filtered[randomIndex] || LESSONS.find(l => l.id === (currentScript === 'hindi' ? 500 : 101)) || LESSONS[0];
  };

  const selectStoryForDuration = (duration: number | null) => {
    const filtered = getFilteredStories(duration, true);
    if (filtered.length > 0) {
      const isCurrentStory = currentLesson.category && currentLesson.category.startsWith('Practice Stories');
      const isAlreadyInFiltered = isCurrentStory && filtered.some(l => l.id === currentLesson.id);
      if (!isAlreadyInFiltered) {
        const targetStory = filtered[0];
        setCurrentLesson(targetStory);
        setSelectedStoryId(targetStory.id);
      }
    }
  };

  const getThemeStyles = () => {
    switch (activeTheme) {
      case 'light':
        return {
          bg: '#F8F9FA',
          text: '#343A40',
          cursor: '#007BFF',
          accent: '#007BFF',
          error: '#DC3545',
          correct: '#28A745',
          rootBg: 'radial-gradient(circle at center, #FFFFFF 0%, #E9ECEF 100%)'
        };
      case 'matrix':
        return {
          bg: '#000000',
          text: '#00FF00',
          cursor: '#33FF33',
          accent: '#008000',
          error: '#FF0000',
          correct: '#33FF33',
          rootBg: 'radial-gradient(circle at center, #051A05 0%, #000000 100%)'
        };
      case 'sunset':
        return {
          bg: '#1A0B2E',
          text: '#FFD3B6',
          cursor: '#FF577F',
          accent: '#FF577F',
          error: '#D32F2F',
          correct: '#FF9F68',
          rootBg: 'radial-gradient(circle at center, #2C124D 0%, #0D0518 100%)'
        };
      case 'ocean':
        return {
          bg: '#0F1E36',
          text: '#E2F1F6',
          cursor: '#00FFFF',
          accent: '#00FFFF',
          error: '#FF6B6B',
          correct: '#4ECCA3',
          rootBg: 'radial-gradient(circle at center, #173053 0%, #07101E 100%)'
        };
      case 'custom':
        return {
          ...customThemeColors,
          rootBg: `radial-gradient(circle at center, ${customThemeColors.bg}CC 0%, ${customThemeColors.bg} 100%)`
        };
      case 'dark':
      default:
        return {
          bg: '#0B0C10',
          text: '#C5C6C7',
          cursor: '#00F0FF',
          accent: '#00F0FF',
          error: '#FF4444',
          correct: '#10B981',
          rootBg: 'radial-gradient(circle at center, #141A26 0%, #0B0C10 100%)'
        };
    }
  };

  const themeConfig = getThemeStyles();

  return (
    <div
      className="min-h-screen text-[#C5C6C7] flex items-stretch xl:overflow-hidden font-sans relative selection:bg-[#00F0FF] selection:text-[#0B0C10]"
      style={{ background: themeConfig.rootBg }}
    >
      {goalToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#141419] border-2 border-[#00F0FF] p-4 rounded-[16px] shadow-[0_0_25px_rgba(0,240,255,0.25)] max-w-sm flex items-center gap-3 animate-bounce">
          <div className="text-2xl">🏆</div>
          <p className="text-xs text-white font-mono leading-tight whitespace-pre-line">{goalToast}</p>
        </div>
      )}
      <style>{`
        :root {
          --theme-bg: ${themeConfig.bg};
          --theme-text: ${themeConfig.text};
          --theme-cursor: ${themeConfig.cursor};
          --theme-accent: ${themeConfig.accent};
          --theme-error: ${themeConfig.error};
          --theme-correct: ${themeConfig.correct};
        }
        @media (max-width: 768px) {
          .mobile-settings-bar {
            overflow: hidden !important;
            max-width: 100vw !important;
            padding-left: 4px !important;
            padding-right: 4px !important;
          }
          .mobile-pill-wrapper {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 2px !important;
            justify-content: center !important;
          }
          .mobile-pill {
            font-size: 7px !important;
            padding: 2px 4px !important;
            white-space: nowrap !important;
            flex-shrink: 0 !important;
          }
          .mobile-progress-container {
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            width: 100% !important;
            max-height: 32px !important;
            overflow: hidden !important;
          }
          .mobile-progress-circle {
            width: 100% !important;
            height: 6px !important;
            margin: 0 auto !important;
            position: relative !important;
            top: auto !important;
            left: auto !important;
            margin-top: 0 !important;
            margin-bottom: 0 !important;
          }
        }
      `}</style>

      {/* 1. RESPONSIVE SIDEBAR SYSTEM */}
      {/* Mobile backdrop overlay removed as sidebar is hidden on small screens */}

      <aside
        className={`
          hidden xl:flex
          ${sidebarExpanded ? 'w-[240px]' : 'w-[64px]'}
          flex-col justify-between items-stretch py-6 select-none bg-[#0D0F1A]/95 border-r border-zinc-800/80 shadow-2xl backdrop-blur-xl transition-all duration-300 ease-in-out shrink-0 h-screen z-45
        `}
      >
        <div className="flex flex-col items-stretch w-full">
          {/* Sidebar Header: Logo with neon shadow & Toggle */}
          <div className="flex items-center justify-between px-3 h-11 shrink-0">
            {sidebarExpanded ? (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[12px] bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-zinc-950 font-black shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                  <span className="font-sans text-base font-black italic tracking-tighter">R</span>
                </div>
                <span className="font-sans text-lg font-black bg-gradient-to-r from-amber-100 via-amber-400 to-amber-500 text-transparent bg-clip-text tracking-tighter">
                  Navigation
                </span>
              </div>
            ) : (
              <div className="w-9 h-9 rounded-[12px] mx-auto bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-zinc-950 font-black shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                <span className="font-sans text-base font-black italic tracking-tighter">R</span>
              </div>
            )}

            {/* Toggle button - only shown on desktop when expanded */}
            {sidebarExpanded && (
              <button
                onClick={() => {
                  setSidebarExpanded(false);
                  sfx.playClick();
                }}
                className="p-1.5 hover:bg-amber-500/10 rounded-lg text-zinc-400 hover:text-amber-400 transition-all cursor-pointer hidden md:block"
                title="Collapse Sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Toggle button - shown when collapsed (desktop only, no hamburger) */}
          {!sidebarExpanded && (
            <button
              onClick={() => {
                setSidebarExpanded(true);
                sfx.playClick();
              }}
              className="mx-auto p-2 hover:bg-amber-500/10 rounded-lg text-zinc-400 hover:text-amber-400 transition-all cursor-pointer mt-2 hidden md:block"
              title="Expand Sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-zinc-800 to-transparent my-4" />

          {/* Navigation Action items */}
          <nav className="flex flex-col gap-1 w-full items-stretch overflow-y-auto scrollbar-none max-h-[calc(100vh-180px)]">
            
            {/* CATEGORY 1: DRILLS & PRACTICE */}
            {sidebarExpanded && (
              <div className="px-4 pt-2 pb-1 text-[9px] font-mono font-black uppercase tracking-widest text-zinc-500 select-none">
                Drills & Practice
              </div>
            )}

            {/* 1. TYPING (returns to main) */}
            <button
              onClick={() => {
                setArcadeActive(false);
                setActiveModal(null);
                if (window.innerWidth < 768) setSidebarExpanded(false);
                sfx.playClick();
              }}
              className={`
                flex items-center ${sidebarExpanded ? 'justify-start px-4 gap-3' : 'justify-center'} 
                py-2.5 w-full transition-all duration-200 cursor-pointer border-l-4
                ${activeModal === null && !arcadeActive
                  ? 'text-amber-400 border-amber-400 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent font-extrabold shadow-[inset_0_0_12px_rgba(245,158,11,0.12)]'
                  : 'text-zinc-400 hover:text-zinc-100 border-transparent hover:bg-zinc-800/40'
                }
              `}
              title="Trainer Space"
            >
              <Keyboard className="w-4 h-4 shrink-0" />
              {sidebarExpanded && <span className="text-xs font-semibold tracking-wide">Typing</span>}
            </button>

            {/* 2. TOUCH LESSONS */}
            <button
              onClick={() => {
                setArcadeActive(false);
                setActiveModal('lessons');
                if (window.innerWidth < 768) setSidebarExpanded(false);
                sfx.playClick();
              }}
              className={`
                flex items-center ${sidebarExpanded ? 'justify-start px-4 gap-3' : 'justify-center'} 
                py-2.5 w-full transition-all duration-200 cursor-pointer border-l-4
                ${activeModal === 'lessons'
                  ? 'text-amber-400 border-amber-400 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent font-extrabold shadow-[inset_0_0_12px_rgba(245,158,11,0.12)]'
                  : 'text-zinc-400 hover:text-zinc-100 border-transparent hover:bg-zinc-800/40'
                }
              `}
              title="Lessons Directory"
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              {sidebarExpanded && (
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-semibold tracking-wide">Touch Lessons</span>
                  <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/30 font-bold">60+</span>
                </div>
              )}
            </button>

            {/* 3. PRACTICE STORIES */}
            <button
              onClick={() => {
                setArcadeActive(false);
                setActiveModal('practice');
                if (window.innerWidth < 768) setSidebarExpanded(false);
                sfx.playClick();
              }}
              className={`
                flex items-center ${sidebarExpanded ? 'justify-start px-4 gap-3' : 'justify-center'} 
                py-2.5 w-full transition-all duration-200 cursor-pointer border-l-4
                ${activeModal === 'practice'
                  ? 'text-amber-400 border-amber-400 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent font-extrabold shadow-[inset_0_0_12px_rgba(245,158,11,0.12)]'
                  : 'text-zinc-400 hover:text-zinc-100 border-transparent hover:bg-zinc-800/40'
                }
              `}
              title="Practice Passages"
            >
              <Sliders className="w-4 h-4 shrink-0" />
              {sidebarExpanded && <span className="text-xs font-semibold tracking-wide">Practice Passages</span>}
            </button>

            {/* CATEGORY 2: ARCADE & SOCIAL */}
            {sidebarExpanded && (
              <div className="px-4 pt-3 pb-1 text-[9px] font-mono font-black uppercase tracking-widest text-zinc-500 select-none">
                Arcade & Social
              </div>
            )}

            {/* 4. RETRO INVADERS */}
            <button
              onClick={() => {
                setActiveModal(null);
                setArcadeActive(true);
                setArcadeScore(0);
                setArcadeShield(100);
                setFallingLetters([]);
                if (window.innerWidth < 768) setSidebarExpanded(false);
                sfx.playClick();
              }}
              className={`
                flex items-center ${sidebarExpanded ? 'justify-start px-4 gap-3' : 'justify-center'} 
                py-2.5 w-full transition-all duration-200 cursor-pointer border-l-4
                ${arcadeActive
                  ? 'text-amber-400 border-amber-400 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent font-extrabold shadow-[inset_0_0_12px_rgba(245,158,11,0.12)]'
                  : 'text-zinc-400 hover:text-zinc-100 border-transparent hover:bg-zinc-800/40'
                }
              `}
              title="Ribbon Invaders"
            >
              <Gamepad2 className="w-4 h-4 shrink-0" />
              {sidebarExpanded && (
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-semibold tracking-wide">Retro Arcade</span>
                  <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/40 font-bold">HOT 🔥</span>
                </div>
              )}
            </button>

            {/* 6. LEADERBOARD */}
            <button
              onClick={() => {
                setArcadeActive(false);
                setActiveModal('leaderboard');
                if (window.innerWidth < 768) setSidebarExpanded(false);
                sfx.playClick();
              }}
              className={`
                flex items-center ${sidebarExpanded ? 'justify-start px-4 gap-3' : 'justify-center'} 
                py-2.5 w-full transition-all duration-200 cursor-pointer border-l-4
                ${activeModal === 'leaderboard'
                  ? 'text-amber-400 border-amber-400 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent font-extrabold shadow-[inset_0_0_12px_rgba(245,158,11,0.12)]'
                  : 'text-zinc-400 hover:text-zinc-100 border-transparent hover:bg-zinc-800/40'
                }
              `}
              title="Elite Standings"
            >
              <Trophy className="w-4 h-4 shrink-0" />
              {sidebarExpanded && (
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-semibold tracking-wide">Leaderboard</span>
                  <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>LIVE
                  </span>
                </div>
              )}
            </button>

            {/* 6.5. ACHIEVEMENTS */}
            <button
              onClick={() => {
                setArcadeActive(false);
                setActiveModal('achievements');
                if (window.innerWidth < 768) setSidebarExpanded(false);
                sfx.playClick();
              }}
              className={`
                flex items-center ${sidebarExpanded ? 'justify-start px-4 gap-3' : 'justify-center'} 
                py-2.5 w-full transition-all duration-200 cursor-pointer border-l-4
                ${activeModal === 'achievements'
                  ? 'text-amber-400 border-amber-400 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent font-extrabold shadow-[inset_0_0_12px_rgba(245,158,11,0.12)]'
                  : 'text-zinc-400 hover:text-zinc-100 border-transparent hover:bg-zinc-800/40'
                }
              `}
              title="Achievements & Badges"
            >
              <Award className="w-4 h-4 shrink-0" />
              {sidebarExpanded && <span className="text-xs font-semibold tracking-wide">Achievements</span>}
            </button>

            {/* 6.6. FRIENDS */}
            <button
              onClick={() => {
                setArcadeActive(false);
                setActiveModal('friends');
                if (window.innerWidth < 768) setSidebarExpanded(false);
                sfx.playClick();
              }}
              className={`
                flex items-center ${sidebarExpanded ? 'justify-start px-4 gap-3' : 'justify-center'} 
                py-2.5 w-full transition-all duration-200 cursor-pointer border-l-4
                ${activeModal === 'friends'
                  ? 'text-amber-400 border-amber-400 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent font-extrabold shadow-[inset_0_0_12px_rgba(245,158,11,0.12)]'
                  : 'text-zinc-400 hover:text-zinc-100 border-transparent hover:bg-zinc-800/40'
                }
              `}
              title="Friends & Social"
            >
              <Users className="w-4 h-4 shrink-0" />
              {sidebarExpanded && <span className="text-xs font-semibold tracking-wide">Friends</span>}
            </button>

            {/* CATEGORY 3: ANALYTICS & SYSTEM */}
            {sidebarExpanded && (
              <div className="px-4 pt-3 pb-1 text-[9px] font-mono font-black uppercase tracking-widest text-zinc-500 select-none">
                Analytics & System
              </div>
            )}

            {/* 5. PERFORMANCE ANALYTICS */}
            <button
              onClick={() => {
                setArcadeActive(false);
                setActiveModal('stats');
                if (window.innerWidth < 768) setSidebarExpanded(false);
                sfx.playClick();
              }}
              className={`
                flex items-center ${sidebarExpanded ? 'justify-start px-4 gap-3' : 'justify-center'} 
                py-2.5 w-full transition-all duration-200 cursor-pointer border-l-4
                ${activeModal === 'stats'
                  ? 'text-amber-400 border-amber-400 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent font-extrabold shadow-[inset_0_0_12px_rgba(245,158,11,0.12)]'
                  : 'text-zinc-400 hover:text-zinc-100 border-transparent hover:bg-zinc-800/40'
                }
              `}
              title="Analytics Hub"
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              {sidebarExpanded && (
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-semibold tracking-wide">Analytics</span>
                  <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold">PRO</span>
                </div>
              )}
            </button>

            {/* 7. COACH ADJUSTMENTS (SETTINGS) */}
            <button
              onClick={() => {
                setArcadeActive(false);
                setActiveModal('settings');
                if (window.innerWidth < 768) setSidebarExpanded(false);
                sfx.playClick();
              }}
              className={`
                flex items-center ${sidebarExpanded ? 'justify-start px-4 gap-3' : 'justify-center'} 
                py-2.5 w-full transition-all duration-200 cursor-pointer border-l-4
                ${activeModal === 'settings'
                  ? 'text-amber-400 border-amber-400 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent font-extrabold shadow-[inset_0_0_12px_rgba(245,158,11,0.12)]'
                  : 'text-zinc-400 hover:text-zinc-100 border-transparent hover:bg-zinc-800/40'
                }
              `}
              title="Coach Configuration"
            >
              <Settings className="w-4 h-4 shrink-0" />
              {sidebarExpanded && <span className="text-xs font-semibold tracking-wide">Settings</span>}
            </button>
          </nav>
        </div>

        {/* Personalized Typist Profile & Sfx Card in Bottom of Sidebar */}
        <div className="px-3 pt-2 pb-1 w-full shrink-0 border-t border-zinc-800/60 bg-[#0A0C16]/60">
          {sidebarExpanded ? (
            <div className="flex items-center justify-between bg-[#121422] border border-zinc-800/80 p-2.5 rounded-xl shadow-lg">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-zinc-950 font-black text-xs shrink-0 shadow-md">
                  YOU
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-zinc-200 truncate">Typist Rank</span>
                  <span className="text-[10px] font-mono text-amber-400 font-bold flex items-center gap-1">
                    🔥 Lv. 1 · {streak}D Streak
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setSoundEnabled(!soundEnabled);
                  sfx.playClick();
                }}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  soundEnabled ? 'text-amber-400 bg-amber-500/15 border border-amber-500/30' : 'text-zinc-500 hover:text-zinc-200 border border-transparent'
                }`}
                title={soundEnabled ? "Mute Sound Effects" : "Enable Sound Effects"}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                sfx.playClick();
              }}
              className={`w-full py-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                soundEnabled ? 'text-amber-400 bg-amber-500/15 border border-amber-500/30' : 'text-zinc-500 hover:text-zinc-200 border border-transparent'
              }`}
              title={soundEnabled ? "Mute Sound Effects" : "Enable Sound Effects"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          )}
        </div>
      </aside>

      {/* 2. CENTRE SCROLLABLE MAIN LAYOUT (Dominant center) */}
      <main className="flex-1 flex flex-col min-w-0 xl:h-screen xl:overflow-hidden overflow-y-auto relative select-none">

        {/* MOBILE COLLAPSIBLE TOP PANEL & PERSISTENT NAVBAR */}
        {!arcadeActive && (
          <div className="xl:hidden flex flex-col w-full relative z-30 select-none">
            {/* A. Persistent Top Navigation Bar */}
            <div
              className="h-10 shrink-0 flex items-center justify-between px-4 border-b border-zinc-800/60 bg-[#1F2833]/15 backdrop-blur-md"
              style={{ height: '40px' }}
            >
              <div className="flex items-center gap-2">
                {/* Hamburger Menu Button (☰) */}
                <button
                  onClick={() => {
                    setMobileDrawerOpen(true);
                    sfx.playClick();
                  }}
                  className="hover:bg-[#00F0FF]/10 active:bg-[#00F0FF]/10 text-zinc-400 hover:text-[#00F0FF] active:text-[#00F0FF] transition-all cursor-pointer flex items-center justify-center rounded-lg"
                  style={{
                    padding: '4px',
                    width: '28px',
                    height: '28px'
                  }}
                  title="Menu"
                >
                  <Menu size={18} />
                </button>

                {/* Ribbon Logo */}
                <span
                  onClick={() => {
                    setMobileDrawerOpen(true);
                    sfx.playClick();
                  }}
                  className="font-sans text-base font-black bg-gradient-to-r from-[#FF6B35] via-[#FF007F] to-[#00F0FF] text-transparent bg-clip-text tracking-tighter cursor-pointer hover:opacity-95 transition-opacity"
                >
                  Ribbon
                </span>

                {/* Live Timer (MM:SS) */}
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-[12px] bg-[#0B0C10]/60 border border-zinc-800 text-[10px] font-mono font-bold text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.1)]">
                  <span className="text-zinc-400">⏱️</span>
                  <span>{formatTimer(testDuration !== null ? Math.max(0, testDuration - elapsed) : elapsed)}</span>
                </div>

                {/* '🔥 8 Day Streak' badge */}
                <div className="flex items-center gap-1.5 bg-[#0B0C10]/60 border border-zinc-800 px-2 py-0.5 rounded-[12px] text-[10px] font-mono font-bold text-[#FF6B35] shadow-[0_0_10px_rgba(255,107,53,0.1)]">
                  <span>🔥</span>
                  <span>{streak}</span>
                </div>
              </div>

              {/* Mobile Navigation Icons */}
              <div className="flex items-center gap-1.5">
                {/* Share Button (📸) */}
                <div className="relative">
                  <button
                    onClick={handleShare}
                    className="hover:bg-[#00F0FF]/10 active:bg-[#00F0FF]/10 text-zinc-400 hover:text-[#00F0FF] active:text-[#00F0FF] transition-all cursor-pointer flex items-center justify-center rounded-lg"
                    style={{ width: '28px', height: '28px' }}
                    title="Share Badge"
                  >
                    <span className="text-sm">📸</span>
                  </button>
                  {shareFeedback && (
                    <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#00F0FF] text-zinc-950 text-[9px] font-mono font-extrabold rounded shadow-md z-50 whitespace-nowrap">
                      {shareFeedback}
                    </span>
                  )}
                </div>

                {/* Fullscreen Toggle */}
                <button
                  onClick={() => {
                    toggleFullscreen();
                    sfx.playClick();
                  }}
                  className="hover:bg-[#00F0FF]/10 active:bg-[#00F0FF]/10 text-zinc-400 hover:text-[#00F0FF] active:text-[#00F0FF] transition-all cursor-pointer flex items-center justify-center rounded-lg"
                  style={{
                    width: '28px',
                    height: '28px'
                  }}
                  title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                  {isFullscreen ? (
                    <Minimize className="w-4 h-4" />
                  ) : (
                    <Maximize className="w-4 h-4" />
                  )}
                </button>

                {/* Sound Toggle */}
                <button
                  onClick={() => {
                    setSoundEnabled(!soundEnabled);
                    sfx.playClick();
                  }}
                  className="hover:bg-[#00F0FF]/10 active:bg-[#00F0FF]/10 text-zinc-400 hover:text-[#00F0FF] active:text-[#00F0FF] transition-all cursor-pointer flex items-center justify-center rounded-lg"
                  style={{
                    width: '28px',
                    height: '28px'
                  }}
                  title={soundEnabled ? "Mute" : "Unmute"}
                >
                  {soundEnabled ? <Volume2 size={16} className="text-[#00F0FF]" /> : <VolumeX size={16} />}
                </button>
              </div>
            </div>

            {/* B. Settings/Control Panel Content */}
            <div
              className="flex flex-col w-full bg-[#1F2833]/15 backdrop-blur-md select-none transition-all duration-300 ease-in-out border-b border-zinc-800/40"
              style={{
                maxHeight: isPanelCollapsed ? '0px' : '450px',
                overflow: isPanelCollapsed ? 'hidden' : 'auto',
                opacity: isPanelCollapsed ? 0 : 1,
                borderBottomWidth: isPanelCollapsed ? '0px' : '1px'
              }}
            >
              <div className="flex-1 flex flex-col p-3 gap-3 overflow-y-auto scrollbar-none pb-12">

                {/* 2. STATS ROW (RIBBON STATS BAR) */}
                {zenMode ? (
                  <div className="w-full flex items-center justify-between p-2.5 bg-[#0F1D1A] border border-[#45A29E]/30 rounded-xl text-[10px] font-mono text-[#45A29E] animate-pulse">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#45A29E] shadow-[0_0_8px_#45A29E]" />
                      <span className="font-sans font-bold uppercase tracking-wide">🧘 ZEN MODE IN PROGRESS</span>
                    </div>
                    <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
                      NO DISTRACTIONS · FOCUS WITHIN
                    </div>
                  </div>
                ) : (
                  <div className="w-full flex flex-col gap-1.5 p-2 bg-[#1F2833]/30 border border-zinc-800 rounded-xl text-[9px] font-mono">
                    <div className="flex items-center gap-1.5 font-sans font-bold text-zinc-400 uppercase tracking-wide text-[8px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#45A29E] animate-pulse" />
                      <span className="truncate">{freestyleMode ? "📝 FREESTYLE CANVAS" : currentLesson.name}</span>
                    </div>

                    <div className="flex flex-row flex-wrap gap-1">
                      {/* Benchmark */}
                      <div className="bg-[#0B0C10]/80 border border-[#FF6B35]/30 px-2 py-0.5 rounded-full text-[#FF6B35] font-black">
                        BM: {speedTarget} WPM
                      </div>
                      {/* Live Speed */}
                      <div className="bg-[#0B0C10]/80 border border-[#00F0FF]/30 px-2 py-0.5 rounded-full text-[#00F0FF] font-black">
                        LIVE: {liveWpm} WPM
                      </div>
                      {/* Accuracy */}
                      <div className="bg-[#0B0C10]/80 border border-[#45A29E]/30 px-2 py-0.5 rounded-full text-[#45A29E] font-black">
                        ACC: {freestyleMode ? "--" : (typedText.length > 0
                          ? `${liveAccuracy}%`
                          : "100%")}
                      </div>
                      {/* PB/Ghost */}
                      <div className="bg-[#0B0C10]/80 border border-zinc-700 px-2 py-0.5 rounded-full text-zinc-400 font-black">
                        {ghostTimestamps.length > 0 ? `👻 GHOST: ${ghostPbWpm} PB` : "👻 PB: NONE"}
                      </div>
                      {/* Historical Avg */}
                      <div className="bg-[#0B0C10]/80 border border-zinc-800 px-2 py-0.5 rounded-full text-zinc-400 font-black">
                        HIST: {globalStats.avgWpm || 0} WPM
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. AI STORY GENERATOR & WEAKNESS COACHING TOGGLES & CONTAINERS */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setAiStoryOpen(!aiStoryOpen);
                        sfx.playClick();
                      }}
                      className={`flex-1 py-1 rounded-lg text-[8px] font-mono font-black uppercase tracking-wider flex items-center justify-center gap-1 border ${aiStoryOpen
                          ? 'bg-[#00F0FF]/15 border-[#00F0FF]/40 text-[#00F0FF]'
                          : 'bg-[#1F2833]/10 border-zinc-850/60 text-zinc-400'
                        }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>AI Story {aiStoryOpen ? '▲' : '▼'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setWeaknessOpen(!weaknessOpen);
                        sfx.playClick();
                      }}
                      className={`flex-1 py-1 rounded-lg text-[8px] font-mono font-black uppercase tracking-wider flex items-center justify-center gap-1 border ${weaknessOpen
                          ? 'bg-[#FF6B35]/15 border-[#FF6B35]/40 text-[#FF6B35]'
                          : 'bg-[#1F2833]/10 border-zinc-850/60 text-zinc-400'
                        }`}
                    >
                      <Activity className="w-3 h-3" />
                      <span>Weakness {weaknessOpen ? '▲' : '▼'}</span>
                    </button>
                  </div>

                  {/* AI Story input if open */}
                  {aiStoryOpen && (
                    <div className="bg-[#1F2833]/15 border border-zinc-900 rounded-lg p-2 flex flex-col gap-2">
                      <div className="flex items-center gap-1 text-zinc-300">
                        <Sparkles className="w-3 h-3 text-[#00F0FF] animate-pulse" />
                        <span className="text-[8px] font-mono uppercase tracking-widest font-black text-[#00F0FF]">AI Story Generator</span>
                      </div>
                      {/* Duration selector */}
                      <div className="flex gap-1">
                        {[2, 5, 10, 15].map(d => (
                          <button
                            key={d}
                            onClick={() => setStoryDuration(d)}
                            disabled={storyGenerating}
                            className={`flex-1 py-0.5 rounded text-[8px] font-mono font-black border transition-all ${storyDuration === d
                                ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF]'
                                : 'bg-transparent border-zinc-700 text-zinc-500 hover:border-zinc-500'
                              }`}
                          >{d}m</button>
                        ))}
                      </div>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="Enter topic..."
                          value={storyTopic}
                          onChange={(e) => setStoryTopic(e.target.value)}
                          disabled={storyGenerating}
                          className="flex-1 bg-[#0B0C10]/95 border border-zinc-850 text-[#C5C6C7] rounded px-2 py-1 text-[9px] font-mono focus:outline-none"
                        />
                        <button
                          onClick={generateAIStory}
                          disabled={storyGenerating || !storyTopic.trim()}
                          className={`px-3 py-1 rounded text-[9px] font-mono font-black uppercase transition-all border ${storyGenerating
                              ? 'bg-[#00F0FF]/10 border-[#00F0FF] text-[#00F0FF] animate-pulse'
                              : storyTopic.trim()
                                ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF]'
                                : 'bg-[#1F2833]/5 border-zinc-850 text-zinc-500 cursor-not-allowed'
                            }`}
                        >
                          {storyGenerating ? '...' : 'Gen 🔮'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Weakness Coaching if open */}
                  {weaknessOpen && (
                    <div className="bg-[#FF6B35]/5 border border-[#FF6B35]/20 rounded-lg p-3 flex flex-col gap-2.5 text-[9px] relative overflow-hidden">
                      {/* Focus Badge display if earned */}
                      {focusBadgeEarned && (
                        <div className="absolute top-2.5 right-2 px-1.5 py-0.5 rounded-full bg-[#FF6B35]/20 border border-[#FF6B35] flex items-center gap-1 shadow-[0_0_10px_rgba(255,107,53,0.3)] animate-pulse">
                          <span className="text-[7px] font-mono text-[#FF6B35] font-black tracking-widest uppercase flex items-center gap-0.5">
                            🎯 FOCUS BADGE
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5 text-[#FF6B35]" />
                        <span className="font-mono uppercase tracking-widest font-black text-[#FF6B35] text-[10px]">Weakness Analyzer</span>
                      </div>

                      {/* Proactive Analytics */}
                      <div className="grid grid-cols-2 gap-2 border-t border-b border-zinc-800/80 py-2">
                        {/* Top Fumbles */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[7px] font-mono text-zinc-500 uppercase font-bold tracking-wider">Top Fumbles</span>
                          <div className="flex flex-col gap-0.5 font-mono text-[8px] text-zinc-300">
                            {getTopFumbles().map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-[#0B0C10]/60 border border-zinc-900 px-1 py-0.5 rounded">
                                <span className="text-[#FF6B35] font-black uppercase">'{item.char}'</span>
                                <span className="text-zinc-500">{item.count} errors</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Top Slowest Bigrams */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[7px] font-mono text-zinc-500 uppercase font-bold tracking-wider">Slowest Bigrams</span>
                          <div className="flex flex-col gap-0.5 font-mono text-[8px] text-zinc-300">
                            {getTopSlowestBigrams().map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-[#0B0C10]/60 border border-zinc-900 px-1 py-0.5 rounded">
                                <span className="text-[#00F0FF] font-black uppercase">{item.bigram}</span>
                                <span className="text-zinc-500">{item.delay}ms</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Smart Drill Button */}
                      <button
                        onClick={generateSmartDrill}
                        disabled={smartDrillGenerating}
                        className={`w-full py-2 rounded font-mono font-black uppercase text-[8px] tracking-wider transition-all border shadow-lg ${smartDrillGenerating
                            ? 'bg-[#FF6B35]/10 border-[#FF6B35] text-[#FF6B35] animate-pulse'
                            : 'bg-[#FF6B35]/20 border-[#FF6B35] hover:bg-[#FF6B35]/30 text-[#FF6B35] cursor-pointer shadow-[#FF6B35]/10 hover:shadow-[#FF6B35]/20'
                          }`}
                      >
                        {smartDrillGenerating ? '🧠 Generating Smart Drill...' : '🧠 Generate Smart Drill'}
                      </button>

                      {/* Single Sentence Weakness Coaching fallback */}
                      {weaknessBigram && (
                        <div className="bg-[#0B0C10]/50 border border-zinc-900 rounded p-1.5 flex flex-col gap-1 text-[8px]">
                          <div className="flex justify-between font-mono text-[7px] text-zinc-500 uppercase font-black">
                            <span>Focus Drill ('{weaknessBigram}')</span>
                            <span>{weaknessDelay}ms delay</span>
                          </div>
                          <button
                            onClick={practiceWeakness}
                            disabled={sentenceGenerating || !weaknessSentence}
                            className="w-full py-0.5 rounded font-mono font-black text-[7px] transition-all border bg-zinc-850/50 hover:bg-zinc-800 border-zinc-700 text-zinc-300 cursor-pointer"
                          >
                            Quick Single-Sentence Drill
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 4. LESSON PROGRESS BAR */}
                <div className="w-full select-none mt-1 space-y-1.5">
                  <div>
                    <div className="flex justify-between items-center text-[8px] font-mono text-zinc-400 mb-1">
                      <span className="tracking-wider font-extrabold text-zinc-500 uppercase text-[8px]">Lesson Progress</span>
                      <span className="text-[#00F0FF] font-black">
                        {targetText.length > 0 ? Math.min(100, Math.round((typedText.length / targetText.length) * 100)) : 0}%
                      </span>
                    </div>
                    <div className="mobile-progress-container relative overflow-hidden max-h-[40px] flex-shrink-0 w-full flex justify-center items-center">
                      <div
                        className="mobile-progress-circle w-full h-1.5 bg-[#1F2833]/40 rounded-full border border-zinc-850 relative m-0 shrink-0"
                        style={{ position: 'relative', margin: '0 auto', flexShrink: 0 }}
                      >
                        <div
                          className="h-full bg-gradient-to-r from-[#00F0FF] to-[#45A29E] shadow-[0_0_8px_#00F0FF] transition-all duration-200 rounded-full relative m-0"
                          style={{ width: `${targetText.length > 0 ? Math.min(100, Math.round((typedText.length / targetText.length) * 100)) : 0}%`, position: 'relative', margin: '0 auto' }}
                        />
                      </div>
                    </div>
                  </div>

                  {(botRaceActive || adaptiveBossActive) && (
                    <div>
                      <div className="flex justify-between items-center text-[8px] font-mono text-zinc-400 mb-1">
                        <span className="tracking-wider font-extrabold text-[#FF6B35] uppercase text-[8px]">
                          {botRaceActive ? "Bot" : "Boss"} Progress
                        </span>
                        <span className="text-[#FF6B35] font-black">
                          {targetText.length > 0
                            ? Math.min(100, Math.round(((botRaceActive ? botProgress : bossProgress) / targetText.length) * 100))
                            : 0}%
                        </span>
                      </div>
                      <div className="mobile-progress-container relative overflow-hidden max-h-[40px] flex-shrink-0 w-full flex justify-center items-center">
                        <div
                          className="mobile-progress-circle w-full h-1.5 bg-[#1F2833]/40 rounded-full border border-zinc-850 relative m-0 shrink-0"
                          style={{ position: 'relative', margin: '0 auto', flexShrink: 0 }}
                        >
                          <div
                            className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FF3300] shadow-[0_0_8px_#FF6B35] transition-all duration-200 rounded-full relative m-0"
                            style={{
                              width: `${targetText.length > 0
                                ? Math.min(100, Math.round(((botRaceActive ? botProgress : bossProgress) / targetText.length) * 100))
                                : 0}%`,
                              position: 'relative',
                              margin: '0 auto'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* C. Small Toggle Handle hanging below the navbar/panel */}
            <button
              onClick={() => {
                setIsPanelCollapsed(!isPanelCollapsed);
                localStorage.setItem('ribbon-panel-collapsed', String(!isPanelCollapsed));
                sfx.playClick();
              }}
              className="absolute flex items-center justify-center w-8 h-8 rounded-lg border border-zinc-800/80 bg-[#1F2833]/95 text-[#00F0FF] transition-all hover:bg-[#00F0FF]/10 hover:shadow-[0_0_8px_rgba(0,240,255,0.2)] cursor-pointer shadow-lg z-30"
              style={{
                borderColor: 'rgba(0, 240, 255, 0.3)',
                top: isPanelCollapsed ? '44px' : 'auto',
                bottom: isPanelCollapsed ? 'auto' : '-16px',
                right: '16px',
              }}
              title={isPanelCollapsed ? "Expand Control Panel" : "Collapse Control Panel"}
            >
              <span className="text-xs">
                {isPanelCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </span>
            </button>
          </div>
        )}

        {/* COMPACT SETTINGS BAR (JUST BELOW THE NAVBAR) */}
        {!arcadeActive && (
          <div className="xl:hidden w-full overflow-x-auto scrollbar-none scroll-smooth overscroll-x-contain touch-pan-x bg-[#0D0F1A]/90 border-b border-zinc-800/80 px-4 md:px-6 py-2 flex flex-col gap-1.5 text-xs font-mono select-none backdrop-blur-xl z-10 shadow-md shrink-0 mobile-settings-bar" onWheel={handleHorizontalWheel}>
            {/* Top Row: DURATION (left) and MODES (right) */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-2 w-full">
              {/* Left side: Duration Row */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-center md:justify-start">
                {/* Left side: Duration Row (Horizontal pills with separator lines) */}
                <div className="flex flex-wrap gap-1 py-0.5 shrink-0 justify-center md:justify-start mobile-pill-wrapper" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
                  <span className="text-[8px] md:text-[9px] sm:md:text-[10px] text-zinc-400 font-bold uppercase tracking-wider shrink-0">DURATION:</span>
                  <div className="flex flex-wrap gap-1 bg-[#121422] p-1 rounded-xl border border-zinc-800/50 shrink-0 mobile-pill-wrapper" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
                    {[
                      { label: "1M", value: 60 },
                      { label: "2M", value: 120 },
                      { label: "5M", value: 300 },
                      { label: "10M", value: 600 },
                      { label: "15M", value: 900 },
                      { label: "Unlimited", value: null }
                    ].map((opt, idx) => (
                      <React.Fragment key={opt.label}>
                        {idx > 0 && <span className="text-zinc-700 text-[8px] md:text-[9px] select-none mx-0.5">|</span>}
                        <button
                          onClick={() => {
                            setTestDuration(opt.value);
                            selectStoryForDuration(opt.value);
                            handleResetSession();
                            sfx.playClick();
                          }}
                          className={`mobile-pill px-2 py-0.5 text-[8px] md:text-[9px] sm:md:text-[10px] font-mono font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 overflow-x-auto ${testDuration === opt.value
                              ? 'bg-[#F59E0B]/20 text-[#F59E0B] font-extrabold border border-[#F59E0B]/50'
                              : 'text-zinc-400 hover:text-white'
                            }`}
                        >
                          {opt.label}
                        </button>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right side: Compact Mode & Story Toolbar */}
              <div className="flex flex-wrap gap-1 justify-center md:justify-end w-full md:w-auto py-0.5 mobile-pill-wrapper" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
                <span className="text-[8px] md:text-[9px] sm:md:text-[10px] text-zinc-500 font-bold uppercase tracking-wider shrink-0 hidden lg:inline">MODE:</span>

                {/* STANDARD */}
                <button
                  onClick={() => {
                    setBotRaceActive(false);
                    setAdaptiveBossActive(false);
                    setFreestyleMode(false);
                    handleModeChange("normal");
                    setSelectedStoryId(null);
                    const defaultL = (window.innerWidth >= 768)
                      ? (LESSONS.find(l => l.id === 101) || LESSONS[0])
                      : LESSONS[0];
                    setCurrentLesson(defaultL);
                    handleResetSession();
                    sfx.playClick();
                  }}
                  className={`mobile-pill px-1.5 md:px-2.5 py-0.5 text-[8px] md:text-[9px] sm:md:text-[10px] font-mono font-black uppercase tracking-wider rounded-full border transition-all cursor-pointer whitespace-nowrap shrink-0 overflow-x-auto ${activeAppMode === 'normal' && !freestyleMode && !botRaceActive && !adaptiveBossActive && currentLesson.category !== 'Practice Stories'
                      ? 'bg-[#00F0FF]/15 border-[#00F0FF]/40 text-[#00F0FF] shadow-[0_0_8px_rgba(0,240,255,0.15)]'
                      : 'bg-[#1F2833]/10 border-zinc-850 text-zinc-400 hover:text-zinc-200'
                    }`}
                >
                  Standard
                </button>

                {/* AI STORY GENERATOR */}
                <div className="relative inline-flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      setAiStoryOpen(!aiStoryOpen);
                      sfx.playClick();
                    }}
                    className={`mobile-pill px-1.5 md:px-2.5 py-0.5 text-[8px] md:text-[9px] sm:md:text-[10px] font-mono font-black uppercase tracking-wider rounded-full border transition-all cursor-pointer whitespace-nowrap shrink-0 overflow-x-auto ${aiStoryOpen
                        ? 'bg-[#00F0FF]/25 border-[#00F0FF] text-[#00F0FF] shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                        : 'bg-[#00F0FF]/10 border-[#00F0FF]/30 text-[#00F0FF]'
                      }`}
                  >
                    ✨ AI Story {aiStoryOpen ? '▲' : '▼'}
                  </button>

                  {aiStoryOpen && (
                    <div className="flex items-center gap-1 bg-[#0D0F1A] border border-[#00F0FF]/50 p-0.5 rounded-full shadow-[0_0_12px_rgba(0,240,255,0.3)] animate-in fade-in zoom-in-95 duration-150 shrink-0">
                      <input
                        type="text"
                        placeholder="Topic..."
                        value={storyTopic}
                        onChange={(e) => setStoryTopic(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && storyTopic.trim() && !storyGenerating) {
                            generateAIStory();
                          }
                        }}
                        autoFocus
                        disabled={storyGenerating}
                        className="bg-[#141728] text-[#E8EDF5] text-[9px] font-mono px-2 py-0.5 rounded-full outline-none border border-[#252A48] focus:border-[#00F0FF] w-28 sm:w-36 placeholder:text-zinc-500 disabled:opacity-50"
                      />
                      <button
                        onClick={generateAIStory}
                        disabled={storyGenerating || !storyTopic.trim()}
                        className="bg-[#00F0FF] text-[#0D0F1A] font-black text-[8px] font-mono px-2 py-0.5 rounded-full hover:bg-[#00F0FF]/90 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
                      >
                        {storyGenerating ? '...' : 'Go 🔮'}
                      </button>
                    </div>
                  )}
                </div>

                {/* BOT RACE */}
                <button
                  onClick={() => {
                    setBotRaceActive(true);
                    setAdaptiveBossActive(false);
                    setFreestyleMode(false);
                    setZenMode(false);
                    setArcadeActive(false);
                    handleResetSession();
                    sfx.playClick();
                  }}
                  className={`mobile-pill px-1.5 md:px-2.5 py-0.5 text-[8px] md:text-[9px] sm:md:text-[10px] font-mono font-black uppercase tracking-wider rounded-full border transition-all cursor-pointer whitespace-nowrap shrink-0 overflow-x-auto ${botRaceActive
                      ? 'bg-[#00F0FF]/15 border-[#00F0FF]/40 text-[#00F0FF] shadow-[0_0_8px_rgba(0,240,255,0.15)]'
                      : 'bg-[#1F2833]/10 border-zinc-850 text-zinc-400 hover:text-zinc-200'
                    }`}
                >
                  🤖 Bot Race
                </button>

                {/* ADAPTIVE BOSS BATTLE */}
                <button
                  onClick={() => {
                    setAdaptiveBossActive(true);
                    setBotRaceActive(false);
                    setFreestyleMode(false);
                    setZenMode(false);
                    setArcadeActive(false);
                    handleResetSession();
                    sfx.playClick();
                  }}
                  className={`mobile-pill px-1.5 md:px-2.5 py-0.5 text-[8px] md:text-[9px] sm:md:text-[10px] font-mono font-black uppercase tracking-wider rounded-full border transition-all cursor-pointer whitespace-nowrap shrink-0 overflow-x-auto ${adaptiveBossActive
                      ? 'bg-[#00F0FF]/15 border-[#00F0FF]/40 text-[#00F0FF] shadow-[0_0_8px_rgba(0,240,255,0.15)]'
                      : 'bg-[#1F2833]/10 border-zinc-850 text-zinc-400 hover:text-zinc-200'
                    }`}
                >
                  💀 Boss
                </button>

                {/* RANDOM STORY */}
                <button
                  onClick={() => {
                    setFreestyleMode(false);
                    handleModeChange("normal");
                    setSelectedStoryId(null);
                    const randomStory = getRandomStoryLesson();
                    setCurrentLesson(randomStory);
                    handleResetSession();
                    sfx.playClick();
                  }}
                  className={`mobile-pill px-1.5 md:px-2.5 py-0.5 text-[8px] md:text-[9px] sm:md:text-[10px] font-mono font-black uppercase tracking-wider rounded-full border transition-all cursor-pointer whitespace-nowrap shrink-0 overflow-x-auto ${activeAppMode === 'normal' && !freestyleMode && currentLesson.category && currentLesson.category.startsWith('Practice Stories') && selectedStoryId === null
                      ? 'bg-[#00F0FF]/15 border-[#00F0FF]/40 text-[#00F0FF] shadow-[0_0_8px_rgba(0,240,255,0.15)]'
                      : 'bg-[#1F2833]/10 border-zinc-850 text-zinc-400 hover:text-zinc-200'
                    }`}
                >
                  🎲 Random Story
                </button>

                {/* PRACTICE STORIES */}
                <button
                  onClick={() => {
                    setFreestyleMode(false);
                    const filtered = getFilteredStories(testDuration);
                    const firstStory = filtered[0] || LESSONS.find(l => l.category === (currentScript === 'hindi' ? "Practice Stories (Hindi)" : "Practice Stories"));
                    if (firstStory) {
                      loadLesson(firstStory);
                      setSelectedStoryId(firstStory.id);
                    }
                    sfx.playClick();
                  }}
                  className={`mobile-pill px-1.5 md:px-2.5 py-0.5 text-[8px] md:text-[9px] sm:md:text-[10px] font-mono font-black uppercase tracking-wider rounded-full border transition-all cursor-pointer whitespace-nowrap shrink-0 overflow-x-auto ${currentLesson.category && currentLesson.category.startsWith("Practice Stories") && !freestyleMode && selectedStoryId !== null
                      ? 'bg-[#45A29E]/20 border-[#45A29E]/40 text-[#45A29E] shadow-[0_0_8px_rgba(69,162,158,0.2)]'
                      : 'bg-[#1F2833]/10 border-zinc-850 text-zinc-400 hover:text-zinc-200'
                    }`}
                >
                  📚 Practice Stories
                </button>

                {/* FREESTYLE */}
                <button
                  onClick={() => {
                    setFreestyleMode(!freestyleMode);
                    handleResetSession();
                    sfx.playClick();
                  }}
                  className={`mobile-pill px-1.5 md:px-2.5 py-0.5 text-[8px] md:text-[9px] sm:md:text-[10px] font-mono font-black uppercase tracking-wider rounded-full border transition-all cursor-pointer whitespace-nowrap shrink-0 overflow-x-auto ${freestyleMode
                      ? 'bg-[#FF6B35]/20 border-[#FF6B35]/40 text-[#FF6B35] shadow-[0_0_8px_rgba(255,107,53,0.3)]'
                      : 'bg-[#1F2833]/10 border-zinc-850 text-zinc-400 hover:text-zinc-200'
                    }`}
                >
                  📝 Freestyle
                </button>

                {/* EXAM MODE TOGGLE */}
                <button
                  onClick={() => {
                    const next = !examMode;
                    setExamMode(next);
                    localStorage.setItem('ribbon_exam_mode', next.toString());
                    handleResetSession();
                    sfx.playClick();
                  }}
                  className={`mobile-pill px-1.5 md:px-2.5 py-0.5 text-[8px] md:text-[9px] sm:md:text-[10px] font-mono font-black uppercase tracking-wider rounded-full border transition-all cursor-pointer whitespace-nowrap shrink-0 overflow-x-auto ${examMode
                      ? 'bg-red-500/20 border-red-500/50 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                      : 'bg-[#1F2833]/10 border-zinc-850 text-zinc-400 hover:text-zinc-200'
                    }`}
                  title={examMode ? 'Exam Mode ON — Backspace disabled (SSC/CHSL strict)' : 'Enable Exam Mode — disables backspace'}
                >
                  🏛️ Exam
                </button>

                {/* Profiles select as a beautiful rounded select pill - centers & places in new line on mobile/tablet */}
                <div className="flex items-center justify-center w-full md:w-auto mt-1 md:mt-0 shrink-0">
                  <select
                    value={activeAppMode}
                    onChange={(e) => {
                      const mode = e.target.value;
                      if (mode === "code" || mode === "medical") {
                        setFreestyleMode(false);
                        handleModeChange(mode as any);
                      } else {
                        handleModeChange("normal");
                      }
                      sfx.playClick();
                    }}
                    className="bg-[#0B0C10]/60 text-zinc-400 hover:text-[#00F0FF] px-2 py-0.5 rounded-full border border-zinc-850 focus:border-[#00F0FF] focus:outline-none transition-all cursor-pointer text-[8px] md:text-[9px] sm:md:text-[10px] font-mono font-black uppercase tracking-wider shrink-0"
                  >
                    <option value="normal">Profiles</option>
                    <option value="code">💻 JS Code</option>
                    <option value="medical">🏥 Medical</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bottom Row: Integrated Stats Row below the selectors */}
            <div className="flex items-center gap-1.5 flex-wrap w-full justify-center md:justify-start border-t border-zinc-850/40 pt-1.5 select-none" style={{ padding: '4px 0' }}>
              <span className="text-[9px] sm:text-[10px] text-zinc-500 font-bold uppercase tracking-wider shrink-0">METRICS:</span>

              {/* Pill 1: BENCHMARK */}
              <div className="bg-[#0B0C10]/60 border border-[#FF6B35]/30 px-2.5 py-0.5 rounded-full flex items-center shadow-[0_0_6px_rgba(255,107,53,0.08)] shrink-0">
                <span className="text-[#FF6B35] font-black tracking-wider text-[8px] sm:text-[9px] uppercase whitespace-nowrap">
                  BENCHMARK: {speedTarget} WPM
                </span>
              </div>

              {/* Pill 2: LIVE SPEED WITH RADIAL RING */}
              <div className="bg-[#0B0C10]/60 border border-[#00F0FF]/30 px-2.5 py-0.5 rounded-full flex items-center shadow-[0_0_6px_rgba(0,240,255,0.08)] shrink-0 gap-1.5">
                <div className="relative w-3.5 h-3.5 flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5 transform -rotate-90">
                    <circle cx="7" cy="7" r="5" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" fill="transparent" />
                    <circle cx="7" cy="7" r="5" stroke="#00F0FF" strokeWidth="1.5" fill="transparent"
                      strokeDasharray={2 * Math.PI * 5}
                      strokeDashoffset={2 * Math.PI * 5 * (1 - Math.min(1, liveWpm / (speedTarget || 60)))}
                      className="transition-all duration-300 ease-out"
                    />
                  </svg>
                </div>
                <span className="text-[#00F0FF] font-black tracking-wider text-[8px] sm:text-[9px] uppercase whitespace-nowrap">
                  LIVE: {liveWpm} WPM
                </span>
              </div>

              {/* Pill 3: ACCURACY */}
              <div className="bg-[#0B0C10]/60 border border-[#45A29E]/30 px-2.5 py-0.5 rounded-full flex items-center shadow-[0_0_6px_rgba(69,162,158,0.08)] shrink-0">
                <span className="text-[#45A29E] font-black tracking-wider text-[8px] sm:text-[9px] uppercase whitespace-nowrap">
                  ACC: {freestyleMode ? "--" : (typedText.length > 0
                    ? `${liveAccuracy}%`
                    : "100%")}
                </span>
              </div>

              {/* Pill 4: GHOST PB */}
              {ghostTimestamps.length > 0 ? (
                <div className="bg-[#0B0C10]/60 border border-[#45A29E]/30 px-2.5 py-0.5 rounded-full flex items-center shadow-[0_0_6px_rgba(69,162,158,0.08)] animate-pulse shrink-0">
                  <span className="text-[#45A29E] font-black tracking-wider text-[8px] sm:text-[9px] uppercase flex items-center gap-1 whitespace-nowrap">
                    👻 GHOST: {ghostPbWpm} PB
                  </span>
                </div>
              ) : (
                <div className="bg-[#0B0C10]/40 border border-zinc-800/40 px-2.5 py-0.5 rounded-full flex items-center shrink-0">
                  <span className="text-zinc-600 font-black tracking-wider text-[8px] sm:text-[9px] uppercase flex items-center gap-1 whitespace-nowrap">
                    👻 PB: NONE
                  </span>
                </div>
              )}

              {/* Pill 5: HISTORICAL AVG */}
              <div className="bg-[#0B0C10]/60 border border-zinc-800/40 px-2.5 py-0.5 rounded-full flex items-center shrink-0">
                <span className="text-zinc-400 font-black tracking-wider text-[8px] sm:text-[9px] uppercase whitespace-nowrap">
                  HISTORICAL AVG: {globalStats.avgWpm || 0} WPM
                </span>
              </div>
            </div>
          </div>
        )}

        {/* MOBILE SWIPE DOWN SHEET FOR LIVE STATS */}
        {mobileStatsOpen && (
          <div className="md:hidden absolute top-14 left-0 right-0 bg-[#0E0E11] border-b border-zinc-800/90 p-4 space-y-4 animate-in slide-in-from-top duration-300 z-30 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#FFB800] font-black uppercase tracking-wider">Live Metrics Telemetry</span>
              <button
                onClick={() => setMobileStatsOpen(false)}
                className="p-1 hover:bg-zinc-850 rounded-lg text-zinc-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-[#141419] p-3 rounded-[12px] border border-zinc-850/80">
                <span className="text-[9px] font-mono text-zinc-500 block">SPEED</span>
                <span className="text-sm font-mono font-black text-[#FFB800] block mt-0.5">
                  {liveWpm} WPM
                </span>
              </div>
              <div className="bg-[#141419] p-3 rounded-[12px] border border-zinc-850/80">
                <span className="text-[9px] font-mono text-zinc-500 block">ACCURACY</span>
                <span className="text-sm font-mono font-black text-white block mt-0.5">
                  {typedText.length > 0
                    ? liveAccuracy
                    : 100}%
                </span>
              </div>
              <div className="bg-[#141419] p-3 rounded-[12px] border border-zinc-850/80">
                <span className="text-[9px] font-mono text-zinc-500 block">TIME ELAPSED</span>
                <span className="text-sm font-mono font-black text-white block mt-0.5">
                  {elapsed.toFixed(1)}s
                </span>
              </div>
            </div>

            <div className="bg-zinc-950 p-2.5 rounded-[12px] border border-zinc-900 text-[11px] text-zinc-400 font-mono flex items-center justify-between">
              <span className="text-zinc-500">Benchmark Challenge Speed:</span>
              <span className="text-[#FFB800] font-bold">{speedTarget} WPM</span>
            </div>
          </div>
        )}

        {/* CORE WORKSPACE CONTENT PANEL */}
        <div className="xl:hidden flex-1 flex flex-col justify-between items-center px-2 sm:px-4 md:px-8 relative py-3 overflow-y-auto scrollbar-none w-full">

          {/* A. RIBBON STATS BAR (Placed just above the dominant text area) */}
          {!arcadeActive && (
            <>
              <div className="hidden md:flex w-full max-w-4xl flex-col md:flex-row items-stretch md:items-center justify-between gap-3 px-4 py-2.5 border border-zinc-800 bg-[#1F2833]/30 rounded-[12px] mb-3.5 text-xs font-mono select-none shadow-md backdrop-blur-sm">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="w-2 h-2 rounded-full bg-[#45A29E] animate-pulse" />
                  <span className="text-[#45A29E] font-black uppercase tracking-wider text-[10px] font-sans">
                    {freestyleMode ? "📝 FREESTYLE CANVAS" : currentLesson.name}
                  </span>
                  <span className="text-zinc-500 hidden sm:inline">|</span>
                  <span className="text-zinc-400 hidden sm:inline text-[9px]">
                    {freestyleMode ? "No prompt restrictions, type freely" : currentLesson.desc}
                  </span>
                </div>

                {/* Bug Fix 2 - Stats Row flat horizontal row of pills */}
                <div
                  onWheel={handleHorizontalWheel}
                  className="flex flex-row flex-wrap items-center gap-1.5 overflow-x-auto scrollbar-none scroll-smooth overscroll-x-contain touch-pan-x py-0.5 max-w-full"
                >
                  {/* Pill 1: BENCHMARK: 60 WPM (Orange) */}
                  <div className="bg-[#0B0C10]/80 border border-[#FF6B35]/30 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full flex items-center shadow-[0_0_8px_rgba(255,107,53,0.1)] shrink-0">
                    <span className="text-[#FF6B35] font-black tracking-wider text-[8px] sm:text-[9px] uppercase whitespace-nowrap">
                      BENCHMARK: {speedTarget} WPM
                    </span>
                  </div>

                  {/* Pill 2: LIVE: X WPM (Cyan) */}
                  <div className="bg-[#0B0C10]/80 border border-[#00F0FF]/30 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full flex items-center shadow-[0_0_8px_rgba(0,240,255,0.1)] shrink-0">
                    <span className="text-[#00F0FF] font-black tracking-wider text-[8px] sm:text-[9px] uppercase whitespace-nowrap">
                      LIVE: {liveWpm} WPM
                    </span>
                  </div>

                  {/* Pill 3: ACC: Y% (Mint) */}
                  <div className="bg-[#0B0C10]/80 border border-[#45A29E]/30 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full flex items-center shadow-[0_0_8px_rgba(69,162,158,0.1)] shrink-0">
                    <span className="text-[#45A29E] font-black tracking-wider text-[8px] sm:text-[9px] uppercase whitespace-nowrap">
                      ACC: {freestyleMode ? "--" : (typedText.length > 0
                        ? `${liveAccuracy}%`
                        : "100%")}
                    </span>
                  </div>

                  {/* Pill 4: GHOST: Z WPM PB (Gray) */}
                  {ghostTimestamps.length > 0 ? (
                    <div className="bg-[#0B0C10]/80 border border-zinc-700 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full flex items-center shadow-[0_0_8px_rgba(255,255,255,0.05)] animate-pulse shrink-0">
                      <span className="text-zinc-400 font-black tracking-wider text-[8px] sm:text-[9px] uppercase flex items-center gap-1 whitespace-nowrap">
                        👻 GHOST: {ghostPbWpm} PB
                      </span>
                    </div>
                  ) : (
                    <div className="bg-[#0B0C10]/40 border border-zinc-800/50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full flex items-center shrink-0">
                      <span className="text-zinc-600 font-black tracking-wider text-[8px] sm:text-[9px] uppercase flex items-center gap-1 whitespace-nowrap">
                        👻 PB: NONE
                      </span>
                    </div>
                  )}

                  {/* Pill 5: HISTORICAL AVG: X WPM (Muted Gray) */}
                  <div className="bg-[#0B0C10]/60 border border-zinc-800/50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full flex items-center shadow-sm shrink-0">
                    <span className="text-zinc-400 font-black tracking-wider text-[8px] sm:text-[9px] uppercase whitespace-nowrap">
                      HISTORICAL AVG: {globalStats.avgWpm || 0} WPM
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* WEAKNESS COACHING MODULE */}
          {!arcadeActive && !workoutCompleted && weaknessOpen && (
            <div className="flex w-full max-w-4xl flex-col gap-2.5 mb-4 select-none">

              {weaknessOpen && (
                <div className="w-full animate-in fade-in slide-in-from-top-2 duration-250">
                  {weaknessBigram ? (
                    <div className="bg-[#FF6B35]/5 border border-[#FF6B35]/20 rounded-[12px] p-3.5 backdrop-blur-sm shadow-md flex flex-col justify-between gap-3">
                      <div className="flex items-center justify-between gap-1.5 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono uppercase tracking-widest font-black text-[#FF6B35] flex items-center gap-1">
                            🎯 Weakness Coaching
                          </span>
                        </div>
                        <div className="bg-[#FF6B35]/20 border border-[#FF6B35]/40 px-2.5 py-0.5 rounded-full font-mono text-[9px] text-[#FF6B35] font-black uppercase shadow-[0_0_8px_rgba(255,107,53,0.1)]">
                          Slowest: '{weaknessBigram}' ({weaknessDelay}ms)
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                        <div className="text-[10px] text-zinc-400 font-mono italic max-w-full sm:max-w-[65%] truncate" title={weaknessSentence || ""}>
                          {sentenceGenerating ? (
                            <span className="text-zinc-500 animate-pulse">Generating custom drill...</span>
                          ) : (
                            weaknessSentence || "Reviewing keystroke delays..."
                          )}
                        </div>
                        <button
                          onClick={practiceWeakness}
                          disabled={sentenceGenerating || !weaknessSentence}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-black uppercase tracking-wider transition-all border cursor-pointer flex items-center gap-1.5 shadow-md ${sentenceGenerating || !weaknessSentence
                              ? 'bg-[#FF6B35]/5 border-zinc-850 text-zinc-600 cursor-not-allowed'
                              : 'bg-[#FF6B35]/20 border-[#FF6B35] text-[#FF6B35] hover:bg-[#FF6B35]/35 active:scale-95 shadow-[0_0_10px_rgba(255,107,53,0.2)]'
                            }`}
                        >
                          <span>Practice Weakness 🎯</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#1F2833]/15 border border-zinc-900 rounded-[12px] p-3.5 backdrop-blur-sm shadow-md flex flex-col justify-center items-center text-center">
                      <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-mono uppercase tracking-widest font-black">
                        <Activity className="w-3.5 h-3.5 text-[#FF6B35]" />
                        <span>Keystroke Analyzer</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono mt-1.5">
                        Complete a standard lesson to analyze fumbles and bi-gram delays.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* PROGRESS BAR DIRECTLY ABOVE THE TEXT BLOCK */}
          {!arcadeActive && !workoutCompleted && (
            <div className="hidden md:block w-full max-w-4xl mb-4 select-none space-y-2.5">
              <div>
                <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 mb-1.5">
                  <span className="tracking-wider font-extrabold text-zinc-500 uppercase text-[9px]">Lesson Progress</span>
                  <span className="text-[#00F0FF] font-black">
                    {targetText.length > 0 ? Math.min(100, Math.round((typedText.length / targetText.length) * 100)) : 0}%
                  </span>
                </div>
                <div className="w-full h-2 bg-[#1F2833]/40 rounded-full overflow-hidden border border-zinc-850">
                  <div
                    className="h-full bg-gradient-to-r from-[#00F0FF] to-[#45A29E] shadow-[0_0_12px_#00F0FF] transition-all duration-200 rounded-full"
                    style={{ width: `${targetText.length > 0 ? Math.min(100, Math.round((typedText.length / targetText.length) * 100)) : 0}%` }}
                  />
                </div>
              </div>

              {(botRaceActive || adaptiveBossActive) && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 mb-1.5">
                    <span className="tracking-wider font-extrabold text-[#FF6B35] uppercase text-[9px] flex items-center gap-1">
                      {botRaceActive ? "🤖 BOT OPPONENT" : "💀 BOSS OPPONENT"} Progress
                    </span>
                    <span className="text-[#FF6B35] font-black">
                      {targetText.length > 0
                        ? Math.min(100, Math.round(((botRaceActive ? botProgress : bossProgress) / targetText.length) * 100))
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#1F2833]/40 rounded-full overflow-hidden border border-zinc-850">
                    <div
                      className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FF3300] shadow-[0_0_12px_#FF6B35] transition-all duration-200 rounded-full"
                      style={{
                        width: `${targetText.length > 0
                          ? Math.min(100, Math.round(((botRaceActive ? botProgress : bossProgress) / targetText.length) * 100))
                          : 0}%`
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* B. THE STAR ELEMENT: THE TYPING TEXT AREA (With explicit min-height constraints to prevent overflow) */}
          <div className={`
            ${isPanelCollapsed
              ? 'flex-1 min-h-[220px] max-h-[65dvh] overflow-hidden'
              : 'h-[25vh] min-h-[140px] max-h-[35vh] overflow-hidden'
            } 
            md:h-[45vh] md:min-h-[300px] md:max-h-[50vh] md:overflow-hidden w-full max-w-4xl flex flex-col justify-start items-center relative bg-zinc-950/20 border border-zinc-900/40 rounded-[20px] p-3 md:p-6 mb-2
          `}>

            {/* Pause Screen Overlay */}
            {isPaused && !workoutCompleted && !arcadeActive && (
              <div className="absolute inset-0 bg-[#0F0F12]/95 backdrop-blur-md flex flex-col items-center justify-center space-y-4 z-30 animate-in fade-in duration-200">
                <div className="w-12 h-12 bg-[#FFB800]/10 rounded-full flex items-center justify-center border border-[#FFB800]/20 shadow-[0_0_20px_rgba(255,184,0,0.15)]">
                  <Pause className="w-5 h-5 text-[#FFB800] animate-pulse" />
                </div>
                <div className="text-center px-4">
                  <h4 className="text-sm font-mono text-zinc-300 uppercase tracking-widest font-black">Practice Session Paused</h4>
                  <p className="text-[11px] text-zinc-500 font-mono mt-1 max-w-xs mx-auto">Tutor timer and physical key inputs are currently frozen.</p>
                </div>
                <button
                  onClick={() => {
                    setIsPaused(false);
                    sfx.playClick();
                  }}
                  className="bg-[#FFB800] hover:bg-[#FFB800]/95 text-zinc-950 font-extrabold font-mono text-[10px] px-5 py-2.5 rounded-[10px] transition-transform active:scale-95 shadow-lg shadow-[#FFB800]/15 uppercase tracking-wider cursor-pointer"
                >
                  Resume Training
                </button>
              </div>
            )}

            {/* Timed Session Completed Overlay */}
            {timedEndModalOpen && (
              <div className="absolute inset-0 bg-[#0F0F12]/95 backdrop-blur-md flex flex-col items-center justify-center space-y-6 z-40 animate-in fade-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-[#00F0FF]/10 rounded-full flex items-center justify-center border border-[#00F0FF]/30 shadow-[0_0_25px_rgba(0,240,255,0.2)]">
                  <Timer className="w-8 h-8 text-[#00F0FF] animate-pulse" />
                </div>

                <div className="text-center">
                  <h3 className="text-lg md:text-xl font-mono text-zinc-200 uppercase tracking-widest font-black">Time's Up!</h3>
                  <p className="text-xs text-zinc-500 font-mono mt-1">Your session completed successfully.</p>
                </div>

                <div className="flex gap-4">
                  {/* WPM Card */}
                  <div className="bg-[#141A26]/80 border border-[#00F0FF]/30 px-6 py-4 rounded-xl text-center min-w-[120px] shadow-[0_0_15px_rgba(0,240,255,0.1)]">
                    <span className="text-[10px] font-mono text-zinc-500 block uppercase font-bold">Final WPM</span>
                    <span className="text-2xl font-mono font-black text-[#00F0FF]">
                      {testDuration ? Math.round((typedText.length / 5) / (testDuration / 60)) : 0}
                    </span>
                  </div>

                  {/* Accuracy Card */}
                  <div className="bg-[#141A26]/80 border border-[#45A29E]/30 px-6 py-4 rounded-xl text-center min-w-[120px] shadow-[0_0_15px_rgba(69,162,158,0.1)]">
                    <span className="text-[10px] font-mono text-zinc-500 block uppercase font-bold">Accuracy</span>
                    <span className="text-2xl font-mono font-black text-[#45A29E]">
                      {freestyleMode ? "N/A" : (() => {
                        let correctsCount = 0;
                        for (let i = 0; i < typedText.length; i++) {
                          if (typedText[i] === targetText[i]) correctsCount++;
                        }
                        return typedText.length > 0 ? `${Math.round((correctsCount / typedText.length) * 100)}%` : "100%";
                      })()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    handleResetSession();
                    sfx.playClick();
                  }}
                  className="bg-[#00F0FF] hover:bg-[#00F0FF]/90 text-zinc-950 font-black font-mono text-xs px-8 py-3 rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#00F0FF]/20 uppercase tracking-widest cursor-pointer"
                >
                  Retry Test
                </button>
              </div>
            )}

            {/* Race Outcome Completed Overlay */}
            {raceEndModalOpen && (
              <div className="absolute inset-0 bg-[#0F0F12]/95 backdrop-blur-md flex flex-col items-center justify-center space-y-6 z-40 animate-in fade-in zoom-in-95 duration-200">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center border shadow-lg ${raceWinner === 'user'
                    ? 'bg-[#45A29E]/10 border-[#45A29E]/30 text-[#45A29E] shadow-[#45A29E]/20'
                    : 'bg-[#FF6B35]/10 border-[#FF6B35]/30 text-[#FF6B35] shadow-[#FF6B35]/20'
                  }`}>
                  {raceWinner === 'user' ? (
                    <Trophy className="w-8 h-8 animate-bounce" />
                  ) : (
                    <X className="w-8 h-8 animate-pulse" />
                  )}
                </div>

                <div className="text-center">
                  <h3 className={`text-xl font-mono uppercase tracking-widest font-black ${raceWinner === 'user' ? 'text-[#45A29E]' : 'text-[#FF6B35]'
                    }`}>
                    {raceWinner === 'user' ? '🏆 VICTORY!' : '💀 DEFEAT!'}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 font-mono">
                    {raceWinner === 'user'
                      ? 'You dominated the race with superior keystroke speed!'
                      : `The ${raceWinner === 'bot' ? '🤖 AI Bot' : '💀 Adaptive Boss'} overtook your position.`}
                  </p>
                </div>

                {/* Compare Metrics */}
                <div className="grid grid-cols-2 gap-4 w-full max-w-sm px-6">
                  {/* User stats */}
                  <div className="bg-[#141A26]/80 border border-zinc-800 p-4 rounded-xl text-center">
                    <span className="text-[9px] font-mono text-zinc-500 block uppercase font-bold">YOU (PLAYER)</span>
                    <span className="text-xl font-mono font-black text-white mt-1 block">
                      {raceMetrics?.userWpm || 0} <span className="text-[10px] font-normal text-zinc-500">WPM</span>
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400 block mt-0.5">
                      {raceMetrics?.userAcc || 0}% ACC
                    </span>
                  </div>

                  {/* Opponent stats */}
                  <div className="bg-[#141A26]/80 border border-zinc-800 p-4 rounded-xl text-center">
                    <span className="text-[9px] font-mono text-zinc-500 block uppercase font-bold">
                      {raceWinner === 'bot' || botRaceActive ? '🤖 AI BOT' : '💀 ADAPTIVE BOSS'}
                    </span>
                    <span className="text-xl font-mono font-black text-[#00F0FF] mt-1 block">
                      {raceMetrics?.opponentWpm || 0} <span className="text-[10px] font-normal text-zinc-500">WPM</span>
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400 block mt-0.5">
                      100% ACC
                    </span>
                  </div>
                </div>

                {/* Extra Streak/Wins Info */}
                {adaptiveBossActive && (
                  <div className="text-center">
                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                      🔥 BOSS WIN STREAK: <strong className="text-[#FF6B35] font-black">{bossWinStreak}</strong>
                    </p>
                  </div>
                )}
                {botRaceActive && (
                  <div className="text-center flex gap-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                    <span>🏆 USER WINS: <strong className="text-[#45A29E] font-black">{userWins}</strong></span>
                    <span>🤖 BOT WINS: <strong className="text-zinc-400 font-black">{botWins}</strong></span>
                  </div>
                )}

                <div className="flex gap-3 w-full max-w-sm px-6">
                  <button
                    onClick={() => {
                      setRaceEndModalOpen(false);
                      handleResetSession();
                      sfx.playClick();
                    }}
                    className="flex-1 bg-[#00F0FF] hover:bg-[#00F0FF]/90 text-zinc-950 font-black font-mono text-xs py-3 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#00F0FF]/20 uppercase tracking-widest cursor-pointer"
                  >
                    Rematch
                  </button>
                  <button
                    onClick={() => {
                      setRaceEndModalOpen(false);
                      setBotRaceActive(false);
                      setAdaptiveBossActive(false);
                      handleResetSession();
                      sfx.playClick();
                    }}
                    className="flex-1 bg-zinc-900 hover:bg-zinc-850 text-white font-semibold font-mono text-xs py-3 rounded-xl border border-zinc-800 transition-all cursor-pointer uppercase tracking-widest"
                  >
                    Exit Mode
                  </button>
                </div>
              </div>
            )}

            {arcadeActive ? (
              /* ARCADE HUB — 4 mini-games */
              <ArcadeHub
                sfx={sfx}
                onClose={() => { setArcadeActive(false); sfx.playClick(); }}
              />
            ) : workoutCompleted ? (
              /* WORKOUT COMPLETED STATS OVERLAY CARD */
              <div className="flex flex-col items-center justify-center text-center space-y-4 max-w-md w-full py-6 select-none animate-in fade-in zoom-in-95 duration-300">
                <div className="w-14 h-14 bg-[#FFB800]/10 rounded-full flex items-center justify-center text-[#FFB800] border border-[#FFB800]/20 shadow-[0_0_20px_rgba(255,184,0,0.15)]">
                  <Award className="w-7 h-7 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Lesson Success!</h3>
                  <p className="text-xs text-zinc-500 mt-1 font-mono">Telemetry metrics synced to your analytics database</p>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full my-2">
                  <div className="bg-[#141419] p-4 rounded-[12px] border border-zinc-850 text-center shadow-inner">
                    <span className="text-[10px] font-mono text-zinc-500 block uppercase">TYPING SPEED</span>
                    <span className="text-2xl font-mono font-black text-[#FFB800] block mt-1">
                      {workoutStats?.wpm} <span className="text-xs font-normal text-zinc-500">WPM</span>
                    </span>
                  </div>
                  <div className="bg-[#141419] p-4 rounded-[12px] border border-zinc-850 text-center shadow-inner">
                    <span className="text-[10px] font-mono text-zinc-500 block uppercase">ACCURACY</span>
                    <span className="text-2xl font-mono font-black text-white block mt-1">
                      {workoutStats?.accuracy}%
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 w-full pt-1">
                  <button
                    onClick={handleResetSession}
                    className="flex-1 bg-zinc-900 hover:bg-zinc-850 text-white font-semibold text-xs py-3 rounded-[12px] border border-zinc-800 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Retry Drills
                  </button>
                  <button
                    onClick={() => {
                      // Load next lesson or reset
                      const nextId = currentLesson.id + 1;
                      const nextL = LESSONS.find(l => l.id === nextId) || LESSONS[0];
                      loadLesson(nextL);
                    }}
                    className="flex-1 bg-[#FFB800] hover:bg-[#FFB800]/90 text-zinc-950 font-extrabold text-xs py-3 rounded-[12px] transition-all cursor-pointer shadow-lg shadow-[#FFB800]/20"
                  >
                    Next Stage
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full flex-1 flex flex-col items-center justify-start overflow-hidden -mt-3 md:-mt-6">
                {/* Ribbon focus helper */}
                <div
                  className="w-full text-center select-none shrink-0"
                  style={{
                    marginBottom: '8px',
                    padding: '4px 0',
                    opacity: (typedText.length === 0 && !freestyleMode) ? 1 : 0,
                    transition: 'opacity 0.3s',
                    color: '#45A29E',
                    fontSize: '13px',
                    letterSpacing: '0.5px'
                  }}
                >
                  <span className="font-mono uppercase font-black flex items-center justify-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#45A29E] shadow-[0_0_8px_#45A29E]" />
                    Ribbon Auto-Focused · Press any key to begin training
                  </span>
                </div>

                {/* TYPING FOCUS AREA — uses mobileContainerRef so getActiveContainer()
                     correctly returns this element on mobile (containerRef = desktop panel).
                     min-h-0 is critical: without it flex min-height:auto makes the element
                     expand to fit all content, so clientHeight===scrollHeight and scrollTop
                     is always a no-op. min-h-0 lets flex constrain it to allocated space. */}
                <div
                  ref={mobileContainerRef}
                  className="typing-area w-full flex-1 min-h-0 xl:flex-none xl:h-[62vh] xl:max-h-[62vh] overflow-y-auto scrollbar-none relative flex flex-col justify-start items-start select-none"
                >
                  {freestyleMode ? (
                    <div
                      className="w-full text-left font-mono text-[15px] sm:text-[16px] md:text-[17px] lg:text-[18px] leading-[1.65] tracking-wide text-[#45A29E] flex flex-wrap gap-y-1"
                      style={{ paddingBottom: '20px' }}
                    >
                      <span className="break-all whitespace-pre-wrap">{typedText}</span>
                      <span
                        ref={activeCharRef}
                        className="text-[#00F0FF] font-black scale-110 relative z-10 transition-transform animate-pulse border-b-2 border-[#00F0FF] inline-block min-w-[12px] h-[28px] text-center"
                        style={{ textShadow: "0 0 10px #00F0FF, 0 0 20px #00F0FF" }}
                      >
                        &nbsp;
                      </span>
                      {typedText.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="text-[10px] font-mono text-[#00F0FF] uppercase tracking-widest font-black animate-pulse flex items-center justify-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#00F0FF] shadow-[0_0_8px_#00F0FF]" />
                            Freestyle Mode Active · Type anything you wish
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className="w-full text-left font-mono text-[15px] sm:text-[16px] md:text-[17px] lg:text-[18px] leading-[1.65] tracking-wide text-zinc-400"
                      style={{ paddingBottom: '20px' }}
                    >
                      <TypingText
                        typedText={typedText}
                        targetText={targetText}
                        activeAppMode={activeAppMode}
                        punishedTokenIndex={punishedTokenIndex}
                        parsedParagraphs={parsedParagraphs}
                        activeCharRef={activeCharRef}
                        mistypedNewlineIndices={mistypedNewlineIndices}
                        autoInsertedBrackets={autoInsertedBrackets}
                        ghostIndex={ghostIndex}
                        zenMode={zenMode}
                        opponentIndex={botRaceActive ? Math.floor(botProgress) : (adaptiveBossActive ? Math.floor(bossProgress) : -1)}
                        opponentType={botRaceActive ? 'bot' : (adaptiveBossActive ? 'boss' : null)}
                      />
                    </div>
                  )}

                  {/* Absolutely positioned cursor caret inside the container */}
                  <div
                    className="custom-caret absolute bg-[#00F0FF]/25 border-b-2 border-[#00F0FF] pointer-events-none select-none animate-pulse hidden"
                    style={{
                      boxShadow: "0 0 10px rgba(0, 240, 255, 0.5)",
                      zIndex: 10,
                    }}
                  />

                </div>
              </div>
            )}
          </div>

          {/* BOTTOM SECTION COMPACT WRAPPER (SQUASHES GAPS TO 2px) */}
          <div className="w-full flex flex-col items-center justify-center" style={{ gap: '2px', paddingBottom: '8px' }}>
            {/* D. VIRTUAL KEYBOARD SECTION */}
            <div className="w-full max-w-2xl shrink-0 mt-2">
              {/* Keyboard layout cycle indicator */}
              <div className="w-full flex items-center justify-between select-none font-mono" style={{ marginBottom: '4px', fontSize: '11px' }}>
                <button
                  onClick={() => {
                    const nextLayout = keyboardLayout === 'qwerty' ? 'dvorak' : keyboardLayout === 'dvorak' ? 'colemak' : 'qwerty';
                    setKeyboardLayout(nextLayout);
                    sfx.playClick();
                  }}
                  className="px-2.5 py-1 rounded-lg border border-zinc-800 bg-[#0B0C10]/60 hover:bg-zinc-850 text-[11px] font-mono uppercase tracking-wider cursor-pointer flex items-center gap-1 group select-none transition-all hover:border-[#00F0FF]/30 hover:text-white"
                  title="Click to cycle layout (QWERTY -> DVORAK -> COLEMAK)"
                >
                  <span className="text-zinc-500">LAYOUT:</span>
                  <span className="text-[#00F0FF] font-black group-hover:animate-pulse">{keyboardLayout}</span>
                  <span className="text-zinc-650 text-[8px] sm:inline hidden">(Click to cycle)</span>
                </button>

                <div className="flex items-center gap-2">
                  {mostFumbledKey && (
                    <button
                      onClick={() => generateFumbleDrill(mostFumbledKey)}
                      className="px-2.5 py-0.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-300 font-mono text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer shadow-[0_0_10px_rgba(244,63,94,0.3)] animate-pulse"
                      title={`Click to launch a targeted repair drill for key '${mostFumbledKey.toUpperCase()}'`}
                    >
                      <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                      <span>Mistyped: '{mostFumbledKey.toUpperCase()}' (Click to Repair ⚡)</span>
                    </button>
                  )}

                  <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider hidden sm:inline">
                    🧠 INTERACTIVE HEAT MAP
                  </span>
                </div>
              </div>

              <div className="w-full" style={{ marginBottom: '0px', paddingBottom: '0px' }}>
                <VirtualKeyboard
                  currentScript={currentScript}
                  nextExpectedChar={arcadeActive ? null : nextExpectedChar}
                  layout={keyboardLayout}
                  physicalKeyPresses={deferredPhysicalKeyPresses}
                  physicalKeyErrors={deferredPhysicalKeyErrors}
                  onKeyClick={(charKey) => generateFumbleDrill(charKey)}
                />
              </div>
            </div>



            {/* C. THE BOTTOM BUTTONS CONTAINER (Centered with justify-center and padding-bottom: 8px) */}
            <div className="w-full shrink-0 flex items-center justify-center gap-2" style={{ marginTop: '0px', paddingTop: '0px', paddingBottom: '8px' }}>
              {/* Quick action button within gap space */}
              {!workoutCompleted && !arcadeActive && (
                <>
                  <button
                    onClick={() => {
                      setIsPaused(!isPaused);
                      sfx.playClick();
                    }}
                    className={`px-4 py-1.5 border rounded-full text-[10px] font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${isPaused
                        ? 'bg-[#00F0FF]/10 border-[#00F0FF] text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                        : 'bg-transparent border-[#00F0FF] text-[#00F0FF] hover:bg-[#00F0FF]/10 shadow-[0_0_5px_rgba(0,240,255,0.15)]'
                      }`}
                    title={isPaused ? "Resume training clock" : "Pause training clock"}
                  >
                    {isPaused ? <Play className="w-3 h-3 text-[#00F0FF]" /> : <Pause className="w-3 h-3 text-[#00F0FF]" />}
                    <span>{isPaused ? 'RESUME PRACTICE' : 'PAUSE TUTOR'}</span>
                  </button>

                  <button
                    onClick={handleResetSession}
                    className="px-4 py-1.5 text-[#FF6B35] bg-transparent border border-[#FF6B35] hover:bg-[#FF6B35]/10 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Restart workout timer and text"
                  >
                    <RefreshCw className="w-3 h-3 text-[#FF6B35]" />
                    <span>RESTART (ESC)</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* FLOATING GHOST PAUSE BUTTON (BOTTOM-RIGHT CORNER) */}


        </div>

        {/* TWO-COLUMN WORKSPACE LAYOUT (Desktop & Laptop >= 1280px) */}
        <div className="hidden xl:flex flex-1 flex-row w-full h-full overflow-hidden relative">

          {/* Main Workspace Column */}
          <div className={`${sidebarCollapsed ? 'w-full' : 'w-[74%]'} h-full flex flex-col justify-between p-6 overflow-hidden transition-[width,padding,margin] duration-500 ease-in-out will-change-[width]`}>
            {/* TopBar Redesign — Sleek Linear Premium Glassmorphism Top Header */}
            <div className="flex flex-wrap min-h-14 py-2.5 shrink-0 items-center justify-between px-5 z-10 select-none bg-[#0D0F1A]/85 border border-zinc-800/80 border-t-amber-500/30 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] mb-3.5 max-w-full overflow-hidden gap-3 backdrop-blur-xl transition-all">
              <div className="flex flex-wrap items-center gap-3">
                {/* Logo & Version Badge */}
                <div className="flex items-center gap-2">
                  <span className="font-sans text-xl sm:text-2xl font-black bg-gradient-to-r from-amber-100 via-amber-400 to-amber-500 text-transparent bg-clip-text tracking-tighter select-none flex items-center gap-1.5">
                    <span className="text-amber-400 text-lg">🎀</span> Ribbon
                  </span>
                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 text-[9px] font-mono font-bold rounded-md uppercase tracking-wide hidden sm:inline-block">
                    PRO
                  </span>
                </div>

                <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

                {/* 3-COLOR SYSTEM STATS BAR */}
                <div className="flex items-center gap-2.5 text-xs font-mono select-none">
                  {/* Accuracy: Green Success Color */}
                  <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl text-emerald-400 font-bold shadow-[0_0_10px_rgba(74,222,128,0.1)]">
                    <Target className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{liveAccuracy}% ACC</span>
                  </div>

                  {/* WPM Speed: Green Success Color */}
                  <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl text-emerald-400 font-bold shadow-[0_0_10px_rgba(74,222,128,0.1)]">
                    <Zap className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{liveWpm} WPM</span>
                  </div>

                  {/* Secondary Stats (Streak, Timer, Shield, Level, XP): Clean, elegant 75% opacity */}
                  <div className="hidden xl:flex items-center gap-2.5 text-zinc-300 opacity-80 font-medium pl-1">
                    <span className="text-zinc-700">·</span>
                    <span className="hover:text-white transition-colors">🔥 {streak}D Streak</span>
                    <span className="text-zinc-700">·</span>
                    <span className="hover:text-white transition-colors">⏱️ {formatTimer(testDuration !== null ? Math.max(0, testDuration - elapsed) : elapsed)}</span>
                    <span className="text-zinc-700">·</span>
                    <span className="flex items-center gap-1 hover:text-white transition-colors"><Shield className="w-3 h-3 text-zinc-400" /> 10 Shield</span>
                    <span className="text-zinc-700">·</span>
                    <span className="hover:text-white transition-colors">🏅 Lv.{userLevel}</span>
                    <span className="text-zinc-700">·</span>
                    <span className="flex items-center gap-1 hover:text-white transition-colors">
                      <span>⭐</span>
                      <span className="text-zinc-300 font-semibold">{userXp % 500}/500 XP</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Single Language Dropdown Switch */}
                <div className="relative">
                  <select
                    value={currentScript}
                    onChange={(e) => {
                      setCurrentScript(e.target.value as 'english' | 'hindi');
                      sfx.playClick();
                    }}
                    className="px-3 py-1.5 rounded-xl border border-zinc-800 bg-[#121422] text-xs font-mono font-bold text-zinc-300 focus:outline-none focus:border-amber-500/50 cursor-pointer hover:border-zinc-700 hover:bg-zinc-850 transition-all shadow-inner appearance-none pr-7"
                    title="Select Language"
                  >
                    <option value="english">🇬🇧 EN</option>
                    <option value="hindi">🇮🇳 हिंदी</option>
                  </select>
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-zinc-400 pointer-events-none">▼</span>
                </div>

                {/* Weekly Challenge Button */}
                <button
                  onClick={openWeeklyChallenge}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-400 transition-all cursor-pointer flex items-center justify-center gap-1.5 font-mono font-bold text-xs shadow-[0_0_12px_rgba(245,158,11,0.15)] active:scale-95"
                  title="Weekly Challenge Competition"
                >
                  <span className="animate-bounce">🏆</span>
                  <span className="hidden sm:inline">Challenge</span>
                </button>

                {/* Collapsible Sidebar Toggle Button */}
                <button
                  onClick={() => {
                    setSidebarCollapsed(!sidebarCollapsed);
                    sfx.playClick();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#121422] border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all cursor-pointer font-mono font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95"
                  title={sidebarCollapsed ? "Show Sidebar Telemetry" : "Hide Sidebar for Focus"}
                >
                  <Activity className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{sidebarCollapsed ? "Telemetry ◀" : "Focus ▶"}</span>
                </button>

                {/* Share Button (📸) */}
                <div className="relative">
                  <button
                    onClick={handleShare}
                    className="w-8 h-8 rounded-xl text-[#8899AA] hover:text-[#00FF88] hover:bg-[#00FF88]/10 border border-zinc-800 transition-all cursor-pointer flex items-center justify-center text-sm shadow-sm active:scale-95"
                    title="Share Performance"
                  >
                    📸
                  </button>
                  {shareFeedback && (
                    <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#00FF88] text-[#0D0F1A] text-[9px] font-mono font-extrabold rounded shadow-md z-50 whitespace-nowrap">
                      {shareFeedback}
                    </span>
                  )}
                </div>

                {/* Sound mute button */}
                <button
                  onClick={() => {
                    setSoundEnabled(!soundEnabled);
                    sfx.playClick();
                  }}
                  className="w-8 h-8 rounded-xl text-[#8899AA] hover:text-[#00E5FF] hover:bg-[#00E5FF]/10 border border-zinc-800 transition-all cursor-pointer flex items-center justify-center active:scale-95 shadow-sm"
                  title={soundEnabled ? "Mute Click Sound" : "Unmute Click Sound"}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4 text-[#00E5FF] animate-pulse" /> : <VolumeX className="w-4 h-4 text-[#8899AA]" />}
                </button>

                {/* Fullscreen button */}
                <button
                  onClick={() => {
                    toggleFullscreen();
                    sfx.playClick();
                  }}
                  className="w-8 h-8 rounded-xl text-[#8899AA] hover:text-[#00E5FF] transition-all cursor-pointer flex items-center justify-center border border-zinc-800 hover:border-[#00E5FF]/30 hover:bg-[#00E5FF]/10 active:scale-95 shadow-sm"
                  title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                  {isFullscreen ? (
                    <Minimize className="w-4 h-4" />
                  ) : (
                    <Maximize className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Fix #2 — Mode/Difficulty Selector Row (Neutral Default, Gold Accent Active Highlight) */}
            <div
              onWheel={handleHorizontalWheel}
              className="w-full flex items-center gap-1.5 overflow-x-auto scrollbar-none scroll-smooth overscroll-x-contain touch-pan-x bg-[#0A0C16]/90 border border-zinc-800/80 rounded-2xl px-3 py-1.5 shrink-0 mb-3.5 backdrop-blur-xl select-none shadow-xl"
            >
              {/* Duration Pills Group */}
              <div className="flex items-center gap-1 bg-[#121422] p-1 rounded-xl border border-zinc-800/50 shrink-0">
                {[
                  { label: "1M", value: 60 },
                  { label: "2M", value: 120 },
                  { label: "5M", value: 300 },
                  { label: "10M", value: 600 },
                  { label: "∞", value: null }
                ].map((opt) => (
                  <button
                    key={String(opt.label)}
                    onClick={() => {
                      setTestDuration(opt.value);
                      selectStoryForDuration(opt.value);
                      handleResetSession();
                      sfx.playClick();
                    }}
                    className={`px-2.5 py-1 text-[10px] font-mono rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 border ${
                      testDuration === opt.value
                        ? 'bg-[#F59E0B]/20 border-[#F59E0B]/70 text-[#F59E0B] font-extrabold shadow-[0_0_10px_rgba(245,158,11,0.2)] scale-[1.02]'
                        : 'border-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Gradient Divider */}
              <div className="w-px h-4 bg-gradient-to-b from-transparent via-zinc-700 to-transparent shrink-0 mx-1" />

              {/* Mode Pills — All Neutral Default, Gold Active Only */}
              <button
                onClick={() => { setBotRaceActive(false); setAdaptiveBossActive(false); setFreestyleMode(false); setZenMode(false); handleModeChange("normal"); setSelectedStoryId(null); const defaultL = LESSONS.find(l => l.id === 101) || LESSONS[0]; setCurrentLesson(defaultL); setArcadeActive(false); handleResetSession(); sfx.playClick(); }}
                className={`px-2.5 py-1 text-[10px] font-mono rounded-xl border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  !freestyleMode && !arcadeActive && !botRaceActive && !adaptiveBossActive && activeModal !== 'practice'
                    ? 'bg-[#F59E0B]/20 border-[#F59E0B]/70 text-[#F59E0B] font-extrabold shadow-[0_0_10px_rgba(245,158,11,0.2)] scale-[1.02]'
                    : 'border-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                }`}
              >Standard</button>

              <button
                onClick={() => {
                  setArcadeActive(false);
                  setActiveModal('practice');
                  sfx.playClick();
                }}
                className={`px-2.5 py-1 text-[10px] font-mono rounded-xl border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeModal === 'practice' || (currentLesson.category && currentLesson.category.startsWith("Practice Stories") && !freestyleMode)
                    ? 'bg-[#F59E0B]/20 border-[#F59E0B]/70 text-[#F59E0B] font-extrabold shadow-[0_0_10px_rgba(245,158,11,0.2)] scale-[1.02]'
                    : 'border-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                }`}
              >📚 Practice Stories</button>

              <div className="relative inline-flex items-center gap-1 shrink-0">
                <button
                  onClick={() => { setAiStoryOpen(!aiStoryOpen); sfx.playClick(); }}
                  className={`px-2.5 py-1 text-[10px] font-mono rounded-xl border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    aiStoryOpen
                      ? 'bg-[#F59E0B]/20 border-[#F59E0B]/70 text-[#F59E0B] font-extrabold shadow-[0_0_10px_rgba(245,158,11,0.2)] scale-[1.02]'
                      : 'border-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                  }`}
                >✨ AI Story {aiStoryOpen ? '▲' : '▼'}</button>

                {aiStoryOpen && (
                  <div className="flex items-center gap-1.5 bg-[#0C0E18] border border-amber-500/40 p-1.5 rounded-xl animate-in fade-in zoom-in-95 duration-150 shrink-0 shadow-2xl">
                    <input
                      type="text"
                      placeholder="Enter topic (e.g. Cyberpunk)..."
                      value={storyTopic}
                      onChange={(e) => setStoryTopic(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && storyTopic.trim() && !storyGenerating) {
                          generateAIStory();
                        }
                      }}
                      autoFocus
                      disabled={storyGenerating}
                      className="bg-zinc-900 text-zinc-200 text-[10px] font-mono px-2.5 py-1 rounded-lg outline-none border border-zinc-800 focus:border-[#F59E0B] w-36 sm:w-48 placeholder:text-zinc-600 disabled:opacity-50"
                    />
                    <button
                      onClick={generateAIStory}
                      disabled={storyGenerating || !storyTopic.trim()}
                      className="bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-zinc-950 font-extrabold text-[10px] font-mono px-3 py-1 rounded-lg transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap shadow-md active:scale-95"
                    >
                      {storyGenerating ? '...' : 'Generate'}
                    </button>
                    <button
                      onClick={() => setAiStoryOpen(false)}
                      className="text-zinc-500 hover:text-white text-[10px] px-1 cursor-pointer"
                      title="Close"
                    >✕</button>
                  </div>
                )}
              </div>

              <button
                onClick={() => { setBotRaceActive(true); setAdaptiveBossActive(false); setFreestyleMode(false); setZenMode(false); setArcadeActive(false); handleResetSession(); sfx.playClick(); }}
                className={`px-2.5 py-1 text-[10px] font-mono rounded-xl border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  botRaceActive
                    ? 'bg-[#F59E0B]/20 border-[#F59E0B]/70 text-[#F59E0B] font-extrabold shadow-[0_0_10px_rgba(245,158,11,0.2)] scale-[1.02]'
                    : 'border-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                }`}
              >🤖 Bot</button>

              <button
                onClick={() => { setAdaptiveBossActive(true); setBotRaceActive(false); setFreestyleMode(false); setZenMode(false); setArcadeActive(false); handleResetSession(); sfx.playClick(); }}
                className={`px-2.5 py-1 text-[10px] font-mono rounded-xl border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  adaptiveBossActive
                    ? 'bg-[#F59E0B]/20 border-[#F59E0B]/70 text-[#F59E0B] font-extrabold shadow-[0_0_10px_rgba(245,158,11,0.2)] scale-[1.02]'
                    : 'border-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                }`}
              >💀 Boss</button>

              <button
                onClick={() => { setBotRaceActive(false); setAdaptiveBossActive(false); setActiveModal(null); setArcadeActive(true); setFreestyleMode(false); setZenMode(false); setArcadeScore(0); setArcadeShield(100); setFallingLetters([]); sfx.playClick(); }}
                className={`px-2.5 py-1 text-[10px] font-mono rounded-xl border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  arcadeActive
                    ? 'bg-[#F59E0B]/20 border-[#F59E0B]/70 text-[#F59E0B] font-extrabold shadow-[0_0_10px_rgba(245,158,11,0.2)] scale-[1.02]'
                    : 'border-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                }`}
              >🕹️ Arcade</button>

              <button
                onClick={() => { setBotRaceActive(false); setAdaptiveBossActive(false); setFreestyleMode(true); setZenMode(false); setArcadeActive(false); handleResetSession(); sfx.playClick(); }}
                className={`px-2.5 py-1 text-[10px] font-mono rounded-xl border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  freestyleMode && !zenMode && !arcadeActive
                    ? 'bg-[#F59E0B]/20 border-[#F59E0B]/70 text-[#F59E0B] font-extrabold shadow-[0_0_10px_rgba(245,158,11,0.2)] scale-[1.02]'
                    : 'border-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                }`}
              >✍️ Free</button>

              <button
                onClick={() => { const next = !examMode; setExamMode(next); localStorage.setItem('ribbon_exam_mode', next.toString()); handleResetSession(); sfx.playClick(); }}
                className={`px-2.5 py-1 text-[10px] font-mono rounded-xl border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  examMode
                    ? 'bg-[#F59E0B]/20 border-[#F59E0B]/70 text-[#F59E0B] font-extrabold shadow-[0_0_10px_rgba(245,158,11,0.2)] scale-[1.02]'
                    : 'border-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                }`}
                title={examMode ? 'Exam Mode ON — Backspace disabled' : 'Enable Strict Exam Mode'}
              >🏛️ {examMode ? 'Exam ✓' : 'Exam'}</button>

              <button
                onClick={() => { setBotRaceActive(false); setAdaptiveBossActive(false); setFreestyleMode(true); setZenMode(true); setArcadeActive(false); handleResetSession(); sfx.playClick(); }}
                className={`px-2.5 py-1 text-[10px] font-mono rounded-xl border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  freestyleMode && zenMode && !arcadeActive
                    ? 'bg-[#F59E0B]/20 border-[#F59E0B]/70 text-[#F59E0B] font-extrabold shadow-[0_0_10px_rgba(245,158,11,0.2)] scale-[1.02]'
                    : 'border-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                }`}
              >🧘 Zen</button>

              {/* Gradient Divider */}
              <div className="w-px h-4 bg-gradient-to-b from-transparent via-zinc-700 to-transparent shrink-0 mx-1" />

              {/* Content type dropdown */}
              <select
                value={activeAppMode}
                onChange={(e) => {
                  const mode = e.target.value;
                  if (mode === "code" || mode === "medical") {
                    setFreestyleMode(false);
                    handleModeChange(mode as any);
                  } else {
                    handleModeChange("normal");
                  }
                  sfx.playClick();
                }}
                className="bg-transparent text-[#4A5070] hover:text-[#F0F2FF] py-0.5 rounded-full border-none focus:outline-none transition-all cursor-pointer text-[9px] font-mono font-black uppercase tracking-wider shrink-0"
              >
                <option value="normal">📝 Normal</option>
                <option value="code">💻 Code</option>
                <option value="medical">🏥 Medical</option>
              </select>
            </div>

            {/* Fix #3 — Story Info Stats Row (Plain text separated by simple dividers ·, no colored background pills) */}
            {!arcadeActive && (
              <div className="w-full bg-[#11131E] border border-zinc-800/60 px-4 py-2 rounded-xl flex items-center justify-between gap-3 text-xs font-mono select-none mb-3 shrink-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-zinc-300 font-bold uppercase tracking-wider text-[11px] font-sans">
                    {freestyleMode ? "FREESTYLE CANVAS" : currentLesson.name}
                  </span>
                </div>

                <div className="flex flex-row flex-wrap items-center gap-2 text-[11px] text-zinc-400">
                  {/* Benchmark */}
                  <span>BENCHMARK: {speedTarget} WPM</span>

                  <span className="text-zinc-700">·</span>

                  {/* Live Speed */}
                  <span className="font-bold text-emerald-400">
                    ⚡ {liveWpm} WPM
                  </span>

                  <span className="text-zinc-700">·</span>

                  {/* Accuracy (turns red if warning < 90%) */}
                  <span className={`font-bold ${typedText.length > 0 && liveAccuracy < 90 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                    ACC: {freestyleMode ? "--" : (typedText.length > 0 ? `${liveAccuracy}%` : "100%")}
                  </span>

                  {/* Ghost PB if available */}
                  {ghostTimestamps.length > 0 && (
                    <>
                      <span className="text-zinc-700">·</span>
                      <span>👻 GHOST: {ghostPbWpm} PB</span>
                    </>
                  )}

                  {/* Bot Race Difficulty selector (plain text neutral pills, gold highlight for selected) */}
                  {botRaceActive && (
                    <>
                      <span className="text-zinc-700">·</span>
                      <div className="flex items-center gap-1 font-mono text-[10px]">
                        <span className="text-zinc-500 font-bold">DIFF:</span>
                        {[
                          { label: "25", value: 25 },
                          { label: "40", value: 40 },
                          { label: "60", value: 60 },
                          { label: "80", value: 80 },
                          { label: "100", value: 100 }
                        ].map((pill) => (
                          <button
                            key={pill.value}
                            onClick={() => {
                              setBotWpm(pill.value);
                              setBotProgress(0);
                              handleResetSession();
                              sfx.playClick();
                            }}
                            className={`px-1.5 py-0.5 rounded transition-all cursor-pointer font-bold ${
                              botWpm === pill.value
                                ? 'bg-[#F59E0B]/20 text-[#F59E0B]'
                                : 'text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            {pill.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Ghost PB / BOT wins / BOSS streak (Plain text with dividers) */}
                  {botRaceActive ? (
                    <>
                      <span className="text-zinc-700">·</span>
                      <span className="text-zinc-400 font-mono text-[11px]">🤖 BOT: {botWpm} WPM</span>
                      <span className="text-zinc-700">·</span>
                      <span className="text-zinc-400 font-mono text-[11px]">🏆 Wins: {userWins} / 🤖 Bot: {botWins}</span>
                    </>
                  ) : adaptiveBossActive ? (
                    <>
                      <span className="text-zinc-700">·</span>
                      <span className="text-rose-400 font-mono text-[11px] font-bold">💀 BOSS: {bossWpm} WPM</span>
                      <span className="text-zinc-700">·</span>
                      <span className="text-zinc-400 font-mono text-[11px]">🔥 STREAK: {bossWinStreak}</span>
                    </>
                  ) : ghostTimestamps.length > 0 ? (
                    <div className="bg-[#0B0C10]/80 border border-[#45A29E]/30 px-2.5 py-0.5 rounded-full flex items-center shadow-[0_0_6px_rgba(69,162,158,0.08)] animate-pulse shrink-0">
                      <span className="text-zinc-400 font-black tracking-wider text-[8px] sm:text-[9px] uppercase flex items-center gap-1 whitespace-nowrap">
                        👻 GHOST: {ghostPbWpm} PB
                      </span>
                    </div>
                  ) : (
                    <div className="bg-[#0B0C10]/40 border border-zinc-800/40 px-2.5 py-0.5 rounded-full flex items-center shrink-0">
                      <span className="text-zinc-600 font-black tracking-wider text-[8px] sm:text-[9px] uppercase flex items-center gap-1 whitespace-nowrap">
                        👻 PB: NONE
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Typing Text Area – taking up the remaining height */}
            <div className="flex-1 w-full flex flex-col justify-start items-center relative bg-[#0B0C10]/40 border border-zinc-800/60 rounded-[20px] p-6 mb-4 min-h-[300px] shadow-[inset_0_0_40px_rgba(0,0,0,0.3)] overflow-visible">

              {/* Pause Screen Overlay */}
              {isPaused && !workoutCompleted && !arcadeActive && (
                <div className="absolute inset-0 bg-[#0F0F12]/95 backdrop-blur-md flex flex-col items-center justify-center space-y-4 z-30 animate-in fade-in duration-200">
                  <div className="w-12 h-12 bg-[#FFB800]/10 rounded-full flex items-center justify-center border border-[#FFB800]/20 shadow-[0_0_20px_rgba(255,184,0,0.15)]">
                    <Pause className="w-5 h-5 text-[#FFB800] animate-pulse" />
                  </div>
                  <div className="text-center px-4">
                    <h4 className="text-sm font-mono text-zinc-300 uppercase tracking-widest font-black">Practice Session Paused</h4>
                    <p className="text-[11px] text-zinc-500 font-mono mt-1 max-w-xs mx-auto">Tutor timer and physical key inputs are currently frozen.</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsPaused(false);
                      sfx.playClick();
                    }}
                    className="bg-[#FFB800] hover:bg-[#FFB800]/95 text-zinc-950 font-extrabold font-mono text-[10px] px-5 py-2.5 rounded-[10px] transition-transform active:scale-95 shadow-lg shadow-[#FFB800]/15 uppercase tracking-wider cursor-pointer"
                  >
                    Resume Training
                  </button>
                </div>
              )}

              {/* Timed Session Completed Overlay */}
              {timedEndModalOpen && (
                <div className="absolute inset-0 bg-[#0F0F12]/95 backdrop-blur-md flex flex-col items-center justify-center space-y-6 z-40 animate-in fade-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 bg-[#00F0FF]/10 rounded-full flex flex-col items-center justify-center border border-[#00F0FF]/30 shadow-[0_0_25px_rgba(0,240,255,0.2)]">
                    <Timer className="w-8 h-8 text-[#00F0FF] animate-pulse" />
                  </div>

                  <div className="text-center">
                    <h3 className="text-lg font-mono text-zinc-200 uppercase tracking-widest font-black">Time's Up!</h3>
                    <p className="text-xs text-zinc-500 font-mono mt-1">Your session completed successfully.</p>
                  </div>

                  <div className="flex gap-4">
                    {/* WPM Card */}
                    <div className="bg-[#141A26]/80 border border-[#00F0FF]/30 px-6 py-4 rounded-xl text-center min-w-[120px] shadow-[0_0_15px_rgba(0,240,255,0.1)]">
                      <span className="text-[10px] font-mono text-zinc-500 block uppercase font-bold">Final WPM</span>
                      <span className="text-2xl font-mono font-black text-[#00F0FF]">
                        {testDuration ? Math.round((typedText.length / 5) / (testDuration / 60)) : 0}
                      </span>
                    </div>

                    {/* Accuracy Card */}
                    <div className="bg-[#141A26]/80 border border-[#45A29E]/30 px-6 py-4 rounded-xl text-center min-w-[120px] shadow-[0_0_15px_rgba(69,162,158,0.1)]">
                      <span className="text-[10px] font-mono text-zinc-500 block uppercase font-bold">Accuracy</span>
                      <span className="text-2xl font-mono font-black text-[#45A29E]">
                        {freestyleMode ? "N/A" : (() => {
                          let correctsCount = 0;
                          for (let i = 0; i < typedText.length; i++) {
                            if (typedText[i] === targetText[i]) correctsCount++;
                          }
                          return typedText.length > 0 ? `${Math.round((correctsCount / typedText.length) * 100)}%` : "100%";
                        })()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      handleResetSession();
                      sfx.playClick();
                    }}
                    className="bg-[#00F0FF] hover:bg-[#00F0FF]/90 text-zinc-950 font-black font-mono text-xs px-8 py-3 rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#00F0FF]/20 uppercase tracking-widest cursor-pointer"
                  >
                    Retry Test
                  </button>
                </div>
              )}

              {arcadeActive ? (
                /* ARCADE HUB — 4 mini-games */
                <ArcadeHub
                  sfx={sfx}
                  onClose={() => { setArcadeActive(false); sfx.playClick(); }}
                />
              ) : workoutCompleted ? (
                /* WORKOUT COMPLETED */
                <div className="flex flex-col items-center justify-center text-center space-y-4 max-w-md w-full py-6 select-none animate-in fade-in zoom-in-95 duration-300">
                  <div className="w-14 h-14 bg-[#FFB800]/10 rounded-full flex items-center justify-center text-[#FFB800] border border-[#FFB800]/20 shadow-[0_0_20px_rgba(255,184,0,0.15)]">
                    <Award className="w-7 h-7 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">Lesson Success!</h3>
                    <p className="text-xs text-zinc-500 mt-1 font-mono">Telemetry metrics synced to your analytics database</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 w-full my-2">
                    <div className="bg-[#141419] p-4 rounded-[12px] border border-zinc-850 text-center shadow-inner">
                      <span className="text-[10px] font-mono text-zinc-500 block uppercase">TYPING SPEED</span>
                      <span className="text-2xl font-mono font-black text-[#FFB800] block mt-1">
                        {workoutStats?.wpm} <span className="text-xs font-normal text-zinc-500">WPM</span>
                      </span>
                    </div>
                    <div className="bg-[#141419] p-4 rounded-[12px] border border-zinc-850 text-center shadow-inner">
                      <span className="text-[10px] font-mono text-zinc-500 block uppercase">ACCURACY</span>
                      <span className="text-2xl font-mono font-black text-white block mt-1">
                        {workoutStats?.accuracy}%
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 w-full pt-1">
                    <button
                      onClick={handleResetSession}
                      className="flex-1 bg-zinc-900 hover:bg-zinc-850 text-white font-semibold text-xs py-3 rounded-[12px] border border-zinc-800 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Retry Drills
                    </button>
                    <button
                      onClick={() => {
                        const nextId = currentLesson.id + 1;
                        const nextL = LESSONS.find(l => l.id === nextId) || LESSONS[0];
                        loadLesson(nextL);
                      }}
                      className="flex-1 bg-[#FFB800] hover:bg-[#FFB800]/90 text-zinc-950 font-extrabold text-xs py-3 rounded-[12px] transition-all cursor-pointer shadow-lg shadow-[#FFB800]/20"
                    >
                      Next Stage
                    </button>
                  </div>
                </div>
              ) : (
                /* STANDARD ACTIVE TEXT AREA */
                <div className="w-full h-full flex flex-col items-center justify-start overflow-hidden relative scroll-smooth">
                  {/* Start typing hint */}
                  {typedText.length === 0 && !freestyleMode && !arcadeActive && (
                    <div className="mb-2 shrink-0 text-center">
                      <span className="text-[10px] font-mono text-[#00E5FF] italic bg-[#00E5FF]/10 border border-[#00E5FF]/30 px-3 py-1 rounded-full">
                        ← Start typing to begin drill
                      </span>
                    </div>
                  )}

                  {/* Visual Progress Bar with Gold Accent */}
                  <div className="w-full mb-2.5 select-none shrink-0">
                    <div className="flex justify-between items-center text-[9px] font-mono mb-1">
                      <span className="tracking-wider uppercase font-bold text-zinc-400">Progress</span>
                      <span className="text-[#F59E0B] font-black">
                        {targetText.length > 0 ? Math.min(100, Math.round((typedText.length / targetText.length) * 100)) : 0}%
                        {' · '}
                        {typedText.split(' ').filter(Boolean).length} / {targetText.split(' ').filter(Boolean).length} words
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                      <div
                        className="h-full bg-[#F59E0B] transition-all duration-300 rounded-full"
                        style={{ width: `${targetText.length > 0 ? Math.min(100, Math.round((typedText.length / targetText.length) * 100)) : 0}%` }}
                      />
                    </div>
                  </div>

                  <div
                    ref={containerRef}
                    className="typing-area w-full flex-1 overflow-y-auto scrollbar-none relative flex flex-col justify-start items-start select-none"
                  >
                    {freestyleMode ? (
                      <div className="w-full text-left font-mono text-[18px] md:text-[20px] lg:text-[21px] leading-[1.8] tracking-wide text-[#45A29E] flex flex-wrap gap-y-1">
                        <span className="break-all whitespace-pre-wrap">{typedText}</span>
                        <span
                          ref={activeCharRef}
                          className="text-[#00F0FF] font-black scale-110 relative z-10 transition-transform animate-pulse border-b-2 border-[#00F0FF] inline-block min-w-[12px] h-[28px] text-center"
                          style={{ textShadow: "0 0 10px #00F0FF, 0 0 20px #00F0FF" }}
                        >
                          &nbsp;
                        </span>
                        {typedText.length === 0 && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-[10px] font-mono text-[#00F0FF] uppercase tracking-widest font-black animate-pulse flex items-center justify-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#00F0FF] shadow-[0_0_8px_#00F0FF]" />
                              Freestyle Mode Active · Type anything you wish
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full text-left font-mono text-[18px] md:text-[20px] lg:text-[21px] leading-[1.8] tracking-wide text-zinc-400">
                        <TypingText
                          typedText={typedText}
                          targetText={targetText}
                          activeAppMode={activeAppMode}
                          punishedTokenIndex={punishedTokenIndex}
                          parsedParagraphs={parsedParagraphs}
                          activeCharRef={activeCharRef}
                          mistypedNewlineIndices={mistypedNewlineIndices}
                          autoInsertedBrackets={autoInsertedBrackets}
                          ghostIndex={ghostIndex}
                          zenMode={zenMode}
                          opponentIndex={botRaceActive ? Math.floor(botProgress) : (adaptiveBossActive ? Math.floor(bossProgress) : -1)}
                          opponentType={botRaceActive ? 'bot' : (adaptiveBossActive ? 'boss' : null)}
                        />
                      </div>
                    )}

                    <div
                      className="custom-caret absolute bg-[#00F0FF]/25 border-b-2 border-[#00F0FF] pointer-events-none select-none animate-pulse hidden"
                      style={{
                        boxShadow: "0 0 10px rgba(0, 240, 255, 0.5)",
                        zIndex: 10,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Controls — Large, High-Contrast Gold Accent Buttons */}
            <div className="w-full shrink-0 flex items-center justify-start gap-3 pt-2">
              {!workoutCompleted && !arcadeActive && (
                <>
                  <button
                    onClick={() => {
                      setIsPaused(!isPaused);
                      sfx.playClick();
                    }}
                    className={`px-5 py-2.5 rounded-xl text-xs font-mono font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg hover:scale-[1.02] active:scale-95 ${
                      isPaused
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20'
                        : 'bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-zinc-950 shadow-amber-500/20'
                    }`}
                    title={isPaused ? "Resume training clock" : "Pause training clock"}
                  >
                    {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
                    <span>{isPaused ? 'RESUME PRACTICE' : 'PAUSE TUTOR'}</span>
                  </button>

                  <button
                    onClick={handleResetSession}
                    className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-amber-500/30 hover:border-amber-500/60 text-amber-400 rounded-xl text-xs font-mono font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-95 shadow-md"
                    title="Restart workout timer and text"
                  >
                    <RefreshCw className="w-4 h-4 text-amber-400" />
                    <span>RESTART (ESC)</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Right Column (Sidebar) — Collapsible for 100% Distraction-Free Focus */}
          {!sidebarCollapsed && (
            <div className="w-[26%] h-full flex flex-col justify-start gap-4 p-5 overflow-y-auto border-l border-zinc-800/40 select-none bg-[#11131E]/90 backdrop-blur-xl transition-all duration-300">
              <RightSidebarWidgets
                currentScript={currentScript}
                onScriptToggle={(script) => {
                  setCurrentScript(script);
                  sfx.playClick();
                }}
                liveWpm={liveWpm}
                liveAccuracy={liveAccuracy}
                errorCount={fumbles ? Object.values(fumbles as Record<string, number>).reduce((a: number, b: number) => a + b, 0) : 0}
                streak={streak}
                xp={userXp}
                level={userLevel}
                keyboardLayout={keyboardLayout}
                onLayoutToggle={() => {
                  const nextLayout = keyboardLayout === 'qwerty' ? 'dvorak' : keyboardLayout === 'dvorak' ? 'colemak' : 'qwerty';
                  setKeyboardLayout(nextLayout);
                  sfx.playClick();
                }}
                physicalKeyPresses={deferredPhysicalKeyPresses}
                physicalKeyErrors={deferredPhysicalKeyErrors}
                onOpenLeaderboard={() => {
                  setActiveModal('leaderboard');
                  sfx.playClick();
                }}
                onOpenAchievements={() => {
                  setActiveModal('achievements');
                  sfx.playClick();
                }}
              />
            </div>
          )}

        </div>

      </main>

      {/* MOBILE & DESKTOP SLIDE-OUT NAVIGATION DRAWER */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 flex select-none">
            {/* Overlay backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => {
                setMobileDrawerOpen(false);
                sfx.playClick();
              }}
            />

            {/* Drawer content panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="relative flex flex-col w-full max-w-[280px] h-full bg-[#0E0E11] border-r border-[#00F0FF]/15 p-5 shadow-[0_0_30px_rgba(0,240,255,0.15)] z-10"
              style={{
                background: 'linear-gradient(to bottom, #0E0E11 0%, #0B0C10 100%)',
              }}
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-5 border-b border-zinc-800/80 mb-6 animate-pulse">
                <span className="font-sans text-xl font-black bg-gradient-to-r from-[#FF6B35] via-[#FF007F] to-[#00F0FF] text-transparent bg-clip-text tracking-tighter">
                  Ribbon Menu
                </span>
                <button
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    sfx.playClick();
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-[#00F0FF] hover:bg-[#00F0FF]/10 transition-all cursor-pointer border border-transparent hover:border-[#00F0FF]/20"
                  style={{ fontSize: '18px' }}
                  title="Close Menu"
                >
                  ✕
                </button>
              </div>

              {/* Drawer Links */}
              <nav className="flex flex-col gap-2 flex-1 overflow-y-auto">

                {/* 1. TYPING */}
                <button
                  onClick={() => {
                    setArcadeActive(false);
                    setActiveModal(null);
                    setMobileDrawerOpen(false);
                    sfx.playClick();
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer text-left w-full ${activeModal === null && !arcadeActive
                      ? 'text-[#00F0FF] border-[#00F0FF]/30 bg-[#00F0FF]/10 shadow-[0_0_15px_rgba(0,240,255,0.15)] font-bold'
                      : 'text-[#C5C6C7] border-transparent hover:text-white hover:bg-zinc-800/40'
                    }`}
                >
                  <span className="text-base">⌨️</span>
                  <span className="text-xs font-semibold tracking-wide uppercase">Typing</span>
                </button>

                {/* 2. TOUCH LESSONS */}
                <button
                  onClick={() => {
                    setArcadeActive(false);
                    setActiveModal('lessons');
                    setMobileDrawerOpen(false);
                    sfx.playClick();
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer text-left w-full ${activeModal === 'lessons'
                      ? 'text-[#00F0FF] border-[#00F0FF]/30 bg-[#00F0FF]/10 shadow-[0_0_15px_rgba(0,240,255,0.15)] font-bold'
                      : 'text-[#C5C6C7] border-transparent hover:text-white hover:bg-zinc-800/40'
                    }`}
                >
                  <span className="text-base">📖</span>
                  <span className="text-xs font-semibold tracking-wide uppercase">Touch Lessons</span>
                </button>

                {/* 3. PRACTICE PASSAGES */}
                <button
                  onClick={() => {
                    setArcadeActive(false);
                    setActiveModal('practice');
                    setMobileDrawerOpen(false);
                    sfx.playClick();
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer text-left w-full ${activeModal === 'practice'
                      ? 'text-[#00F0FF] border-[#00F0FF]/30 bg-[#00F0FF]/10 shadow-[0_0_15px_rgba(0,240,255,0.15)] font-bold'
                      : 'text-[#C5C6C7] border-transparent hover:text-white hover:bg-zinc-800/40'
                    }`}
                >
                  <span className="text-base">📚</span>
                  <span className="text-xs font-semibold tracking-wide uppercase">Practice Passages</span>
                </button>

                {/* 4. RETRO ARCADE */}
                <button
                  onClick={() => {
                    setActiveModal(null);
                    setArcadeActive(true);
                    setArcadeScore(0);
                    setArcadeShield(100);
                    setFallingLetters([]);
                    setMobileDrawerOpen(false);
                    sfx.playClick();
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer text-left w-full ${arcadeActive
                      ? 'text-[#00F0FF] border-[#00F0FF]/30 bg-[#00F0FF]/10 shadow-[0_0_15px_rgba(0,240,255,0.15)] font-bold'
                      : 'text-[#C5C6C7] border-transparent hover:text-white hover:bg-zinc-800/40'
                    }`}
                >
                  <span className="text-base">🎮</span>
                  <span className="text-xs font-semibold tracking-wide uppercase">Retro Arcade</span>
                </button>

                {/* 5. ANALYTICS */}
                <button
                  onClick={() => {
                    setArcadeActive(false);
                    setActiveModal('stats');
                    setMobileDrawerOpen(false);
                    sfx.playClick();
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer text-left w-full ${activeModal === 'stats'
                      ? 'text-[#00F0FF] border-[#00F0FF]/30 bg-[#00F0FF]/10 shadow-[0_0_15px_rgba(0,240,255,0.15)] font-bold'
                      : 'text-[#C5C6C7] border-transparent hover:text-white hover:bg-zinc-800/40'
                    }`}
                >
                  <span className="text-base">📊</span>
                  <span className="text-xs font-semibold tracking-wide uppercase">Analytics</span>
                </button>

                {/* 6. LEADERBOARD */}
                <button
                  onClick={() => {
                    setArcadeActive(false);
                    setActiveModal('leaderboard');
                    setMobileDrawerOpen(false);
                    sfx.playClick();
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer text-left w-full ${activeModal === 'leaderboard'
                      ? 'text-[#00F0FF] border-[#00F0FF]/30 bg-[#00F0FF]/10 shadow-[0_0_15px_rgba(0,240,255,0.15)] font-bold'
                      : 'text-[#C5C6C7] border-transparent hover:text-white hover:bg-zinc-800/40'
                    }`}
                >
                  <span className="text-base">🏆</span>
                  <span className="text-xs font-semibold tracking-wide uppercase">Leaderboard</span>
                </button>

                {/* 7. ACHIEVEMENTS */}
                <button
                  onClick={() => {
                    setArcadeActive(false);
                    setActiveModal('achievements');
                    setMobileDrawerOpen(false);
                    sfx.playClick();
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer text-left w-full ${activeModal === 'achievements'
                      ? 'text-[#00F0FF] border-[#00F0FF]/30 bg-[#00F0FF]/10 shadow-[0_0_15px_rgba(0,240,255,0.15)] font-bold'
                      : 'text-[#C5C6C7] border-transparent hover:text-white hover:bg-zinc-800/40'
                    }`}
                >
                  <span className="text-base">🥇</span>
                  <span className="text-xs font-semibold tracking-wide uppercase">Achievements</span>
                </button>

                {/* 8. FRIENDS */}
                <button
                  onClick={() => {
                    setArcadeActive(false);
                    setActiveModal('friends');
                    setMobileDrawerOpen(false);
                    sfx.playClick();
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer text-left w-full ${activeModal === 'friends'
                      ? 'text-[#00F0FF] border-[#00F0FF]/30 bg-[#00F0FF]/10 shadow-[0_0_15px_rgba(0,240,255,0.15)] font-bold'
                      : 'text-[#C5C6C7] border-transparent hover:text-white hover:bg-zinc-800/40'
                    }`}
                >
                  <span className="text-base">👥</span>
                  <span className="text-xs font-semibold tracking-wide uppercase">Friends</span>
                </button>

                {/* 9. CALENDAR */}
                <button
                  onClick={() => {
                    setArcadeActive(false);
                    setActiveModal('calendar');
                    setMobileDrawerOpen(false);
                    sfx.playClick();
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer text-left w-full ${activeModal === 'calendar'
                      ? 'text-[#00F0FF] border-[#00F0FF]/30 bg-[#00F0FF]/10 shadow-[0_0_15px_rgba(0,240,255,0.15)] font-bold'
                      : 'text-[#C5C6C7] border-transparent hover:text-white hover:bg-zinc-800/40'
                    }`}
                >
                  <span className="text-base">📅</span>
                  <span className="text-xs font-semibold tracking-wide uppercase">Calendar</span>
                </button>

                {/* 10. SETTINGS */}
                <button
                  onClick={() => {
                    setArcadeActive(false);
                    setActiveModal('settings');
                    setMobileDrawerOpen(false);
                    sfx.playClick();
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer text-left w-full ${activeModal === 'settings'
                      ? 'text-[#00F0FF] border-[#00F0FF]/30 bg-[#00F0FF]/10 shadow-[0_0_15px_rgba(0,240,255,0.15)] font-bold'
                      : 'text-[#C5C6C7] border-transparent hover:text-white hover:bg-zinc-800/40'
                    }`}
                >
                  <span className="text-base">⚙️</span>
                  <span className="text-xs font-semibold tracking-wide uppercase">Settings</span>
                </button>

              </nav>

              {/* Footer: Sound Toggle + Brand Info */}
              <div className="pt-4 border-t border-zinc-800/80 flex flex-col gap-3">
                <button
                  onClick={() => {
                    setSoundEnabled(!soundEnabled);
                    sfx.playClick();
                  }}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border w-full transition-all cursor-pointer ${soundEnabled
                      ? 'text-[#FFB800] bg-[#FFB800]/10 border-[#FFB800]/25'
                      : 'text-zinc-500 border-transparent hover:text-zinc-200 hover:bg-zinc-800/40'
                    }`}
                  title={soundEnabled ? 'Mute click sounds' : 'Enable click sounds'}
                >
                  <span className="text-base">{soundEnabled ? '🔊' : '🔇'}</span>
                  <span className="text-xs font-semibold tracking-wide uppercase">
                    {soundEnabled ? 'Sound On' : 'Sound Off'}
                  </span>
                </button>
                <div className="text-center text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                  Ribbon Engine v2.0
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>



      {/* 4. PREMIUM COMPREHENSIVE SLIDE-OUT PANEL SYSTEM (PINS TO RIGHT SIDE OF SCREEN) */}
      {activeModal !== null && (
        <div className="absolute inset-y-0 right-0 z-45 flex justify-end select-none w-full pointer-events-none">
          {/* Backdrop (semi-transparent overlay on left, dismissed on click) */}
          <div
            className="absolute inset-0 bg-[#0F0F12]/60 backdrop-blur-xs transition-opacity duration-300 pointer-events-auto"
            onClick={() => {
              setActiveModal(null);
              sfx.playClick();
            }}
          />

          {/* Slide-out Panel container */}
          <div className="relative bg-[#0D0F1A]/95 backdrop-blur-xl border-l border-amber-500/20 w-full max-w-xl md:max-w-2xl h-full flex flex-col shadow-[-15px_0_50px_rgba(0,0,0,0.8)] z-10 pointer-events-auto transition-all duration-300">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-zinc-800/80 bg-[#121424]/90">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_#f59e0b] animate-pulse" />
                <h3 className="font-extrabold text-white tracking-wider uppercase text-xs font-mono">
                  {activeModal === 'lessons' && "Lessons Directory"}
                  {activeModal === 'practice' && "Practice Passages & Exams"}
                  {activeModal === 'stats' && "Analytics Dashboard"}
                  {activeModal === 'leaderboard' && "Global Standings"}
                  {activeModal === 'settings' && "Coach Configurations"}
                  {activeModal === 'calendar' && "Activity Calendar"}
                  {activeModal === 'achievements' && "Achievements & Milestones"}
                  {activeModal === 'friends' && "Friends & Follow Social Feed"}
                  {activeModal === 'themes' && "🎨 Themes & Custom Color Schemes"}
                  {activeModal === 'history' && "📊 Full Session History Analytics"}
                  {activeModal === 'goals' && "🎯 Daily Habits & Practice Goals"}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-block text-[9px] font-mono text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-lg border border-zinc-700/60 font-bold uppercase tracking-wider">ESC</span>
                <button
                  onClick={() => {
                    setActiveModal(null);
                    sfx.playClick();
                  }}
                  className="p-1.5 hover:bg-amber-500/10 hover:border-amber-500/30 border border-transparent rounded-xl text-zinc-400 hover:text-amber-400 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 scrollbar-none">

              {/* A. LESSONS DIRECTORY MODAL CONTENT */}
              {activeModal === 'lessons' && (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <p className="text-xs text-amber-300 font-mono flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-amber-400 shrink-0" />
                      Select a progressive training course below to load muscle memory triggers into the text viewport.
                    </p>
                  </div>

                  {/* AI Smart Weakness Generator Banner Card */}
                  <div className="p-4 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-left shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-extrabold text-base shrink-0 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                        🧠
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white font-mono uppercase tracking-wider">AI Weakness Drill Generator</h4>
                        <p className="text-[10px] text-zinc-400 font-mono mt-0.5">Scans recent typing errors & generates a custom targeted exercise automatically.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setActiveModal(null);
                        generateSmartDrill();
                      }}
                      disabled={smartDrillGenerating}
                      className="px-4 py-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-zinc-950 font-black text-xs font-mono rounded-xl transition-all shadow-[0_0_12px_rgba(245,158,11,0.2)] flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{smartDrillGenerating ? "Generating..." : "⚡ Generate Drill"}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {LESSONS.filter(l => l.category === (currentScript === 'hindi' ? 'Touch Typing Basics (Hindi)' : 'Touch Typing Basics')).map((lesson) => {
                      const isSelected = currentLesson.id === lesson.id;
                      return (
                        <div
                          key={lesson.id}
                          onClick={() => {
                            loadLesson(lesson);
                            sfx.playClick();
                          }}
                          className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer text-left flex flex-col justify-between min-h-[115px] group ${
                            isSelected
                              ? 'bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-transparent border-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                              : 'bg-[#141628]/90 border-zinc-800/80 hover:border-amber-500/40 hover:bg-[#181A32]'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className={`text-[9px] font-mono uppercase font-black px-2 py-0.5 rounded-md ${
                                isSelected ? 'bg-amber-400 text-zinc-950' : 'bg-zinc-800/80 text-amber-400'
                              }`}>
                                {currentScript === 'hindi' ? `Stage ${lesson.id - 499}` : `Stage ${lesson.id + 1}`}
                              </span>
                              {isSelected && <span className="text-[9px] font-mono font-bold text-amber-400 animate-pulse">ACTIVE ●</span>}
                            </div>
                            <h4 className="text-xs font-extrabold text-white mt-2 group-hover:text-amber-300 transition-colors">{lesson.name}</h4>
                          </div>
                          <span className="text-[10px] text-zinc-400 font-mono block line-clamp-1 truncate mt-2 group-hover:text-zinc-300">{lesson.desc}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Custom drill creator */}
                  <CustomPracticePlayground loadLesson={loadLesson} sfx={sfx} />
                </div>
              )}

              {/* B. PRACTICE PASSAGES MODAL CONTENT */}
              {activeModal === 'practice' && (
                <div className="space-y-6">

                  {/* Practice Stories Section */}
                  <div className="space-y-3 bg-[#121422]/90 p-4 rounded-2xl border border-zinc-800/80 shadow-md">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block font-extrabold flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        {filterStoriesByDuration
                          ? (testDuration === 900 || testDuration === 600 || testDuration === null
                            ? "Long Practice Stories (10M/15M/∞)"
                            : testDuration === 60 || testDuration === 120
                              ? "Short Practice Stories (1M/2M)"
                              : "Medium Practice Stories (5M)")
                          : "All Practice Stories"}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setCustomStoryModalOpen(true);
                            sfx.playClick();
                          }}
                          className="px-2.5 py-1 rounded-xl border border-amber-500/40 hover:border-amber-400 bg-amber-500/10 text-[9px] font-mono font-extrabold uppercase text-amber-300 cursor-pointer transition-all duration-150 flex items-center gap-1 shadow-sm"
                        >
                          <Plus className="w-3 h-3" /> Custom Story
                        </button>
                        <button
                          onClick={() => {
                            setFilterStoriesByDuration(prev => !prev);
                            sfx.playClick();
                          }}
                          className="px-2.5 py-1 rounded-xl border border-zinc-700/80 hover:border-cyan-400/60 bg-zinc-800/80 text-[9px] font-mono font-bold uppercase text-cyan-400 cursor-pointer transition-all duration-150"
                        >
                          {filterStoriesByDuration ? "Show All Stories" : "Filter Duration"}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1 scrollbar-none">
                      {getFilteredStories(testDuration, filterStoriesByDuration).map((lesson) => {
                        const wc = lesson.customText ? lesson.customText.split(/\s+/).filter(Boolean).length : 0;
                        const isSelected = currentLesson.id === lesson.id;
                        return (
                          <div
                            key={lesson.id}
                            onClick={() => {
                              loadLesson(lesson);
                              sfx.playClick();
                            }}
                            className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer text-left group ${
                              isSelected
                                ? 'bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-transparent border-amber-400/80 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                                : 'bg-[#161828] border-zinc-800/80 hover:border-amber-500/40 hover:bg-[#1A1D32]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-extrabold text-white group-hover:text-amber-300 transition-colors">{lesson.name}</h4>
                              <span className="text-[8px] font-mono font-bold text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">{wc} wds</span>
                            </div>
                            <span className="text-[9px] text-zinc-400 font-mono block mt-1 line-clamp-1 group-hover:text-zinc-300">
                              {lesson.desc}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Clerical exams Section */}
                  <div className="space-y-3 bg-[#121422]/90 p-4 rounded-2xl border border-zinc-800/80 shadow-md">
                    <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block font-extrabold flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5" /> Government Clerical Civil Exams
                    </span>
                    <div className="space-y-2.5">
                      {LESSONS.filter(l => l.category === (currentScript === 'hindi' ? 'Clerical Civil Exams (Hindi)' : 'Clerical Civil Exams')).map((lesson) => {
                        const isSelected = currentLesson.id === lesson.id;
                        return (
                          <div
                            key={lesson.id}
                            onClick={() => {
                              loadLesson(lesson);
                              sfx.playClick();
                            }}
                            className={`p-4 rounded-2xl border flex items-center justify-between transition-all duration-200 cursor-pointer text-left group ${
                              isSelected
                                ? 'bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border-amber-400/80 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                                : 'bg-[#161828] border-zinc-800/80 hover:border-amber-500/40 hover:bg-[#1A1D32]'
                            }`}
                          >
                            <div>
                              <h4 className="text-xs font-extrabold text-white group-hover:text-amber-300 transition-colors">{lesson.name}</h4>
                              <span className="text-[10px] text-zinc-400 font-mono block mt-0.5 group-hover:text-zinc-300">{lesson.desc}</span>
                            </div>
                            <span className="text-[9px] font-mono font-black bg-gradient-to-r from-amber-500/20 to-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-xl shadow-sm">EXAM FORMAT</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* C. ANALYTICS HUB MODAL CONTENT */}
              {activeModal === 'stats' && (() => {
                const filteredHistory = history.filter(run => {
                  if (analyticsScriptFilter === 'english') return !run.script || run.script === 'english';
                  if (analyticsScriptFilter === 'hindi') return run.script === 'hindi';
                  return true;
                });

                const displayBestWpm = filteredHistory.length > 0 ? Math.max(...filteredHistory.map(h => h.wpm)) : globalStats.bestWpm;
                const displayAvgWpm = filteredHistory.length > 0 ? Math.round(filteredHistory.reduce((a, b) => a + b.wpm, 0) / filteredHistory.length) : globalStats.avgWpm;
                const displayAcc = filteredHistory.length > 0 ? parseFloat((filteredHistory.reduce((a, b) => a + b.accuracy, 0) / filteredHistory.length).toFixed(1)) : globalStats.accuracy;
                const displayTests = filteredHistory.length > 0 ? filteredHistory.length : globalStats.totalTests;

                return (
                  <div className="space-y-6">
                    {/* Script Filter Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between bg-[#121422]/90 p-2 rounded-2xl border border-zinc-800/80 gap-2 shadow-inner">
                      <span className="text-[10px] font-mono text-zinc-400 font-bold px-3 uppercase tracking-wider flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-amber-400" /> Analytics Filter:
                      </span>
                      <div className="flex gap-1.5 font-mono text-xs w-full sm:w-auto">
                        <button
                          onClick={() => setAnalyticsScriptFilter('all')}
                          className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl font-bold transition-all duration-200 cursor-pointer ${analyticsScriptFilter === 'all'
                              ? 'bg-gradient-to-r from-amber-500/20 to-amber-500/10 text-amber-400 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50 border border-transparent'
                            }`}
                        >
                          All Languages
                        </button>
                        <button
                          onClick={() => setAnalyticsScriptFilter('english')}
                          className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl font-bold transition-all duration-200 cursor-pointer ${analyticsScriptFilter === 'english'
                              ? 'bg-gradient-to-r from-cyan-500/20 to-cyan-500/10 text-cyan-400 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50 border border-transparent'
                            }`}
                        >
                          🇬🇧 English
                        </button>
                        <button
                          onClick={() => setAnalyticsScriptFilter('hindi')}
                          className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl font-bold transition-all duration-200 cursor-pointer ${analyticsScriptFilter === 'hindi'
                              ? 'bg-gradient-to-r from-amber-500/20 to-amber-500/10 text-amber-400 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50 border border-transparent'
                            }`}
                        >
                          🇮🇳 Hindi
                        </button>
                      </div>
                    </div>

                    {/* Summary row - 4 Glassmorphic Metric Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {/* 1. Best Speed Card */}
                      <div className="bg-gradient-to-b from-[#181B30] to-[#121424] p-3.5 rounded-2xl border border-amber-500/30 hover:border-amber-500/60 transition-all duration-300 shadow-lg group">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono text-amber-400/90 font-bold uppercase tracking-wider">PEAK SPEED</span>
                          <Trophy className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="mt-2 flex items-baseline gap-1">
                          <span className="text-2xl font-mono font-black text-amber-400 tracking-tight">{displayBestWpm}</span>
                          <span className="text-[10px] font-mono font-bold text-amber-400/80">WPM</span>
                        </div>
                        <span className="text-[9px] text-zinc-500 font-mono block mt-1">All-time record</span>
                      </div>

                      {/* 2. Avg Speed Card */}
                      <div className="bg-gradient-to-b from-[#181B30] to-[#121424] p-3.5 rounded-2xl border border-cyan-500/30 hover:border-cyan-500/60 transition-all duration-300 shadow-lg group">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono text-cyan-400/90 font-bold uppercase tracking-wider">AVG SPEED</span>
                          <Zap className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="mt-2 flex items-baseline gap-1">
                          <span className="text-2xl font-mono font-black text-white tracking-tight">{displayAvgWpm}</span>
                          <span className="text-[10px] font-mono font-bold text-zinc-400">WPM</span>
                        </div>
                        <span className="text-[9px] text-zinc-500 font-mono block mt-1">Sustained pace</span>
                      </div>

                      {/* 3. Accuracy Card */}
                      <div className="bg-gradient-to-b from-[#181B30] to-[#121424] p-3.5 rounded-2xl border border-emerald-500/30 hover:border-emerald-500/60 transition-all duration-300 shadow-lg group">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono text-emerald-400/90 font-bold uppercase tracking-wider">ACCURACY</span>
                          <Target className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="mt-2 flex items-baseline gap-0.5">
                          <span className="text-2xl font-mono font-black text-emerald-400 tracking-tight">{displayAcc}</span>
                          <span className="text-[10px] font-mono font-bold text-emerald-400/80">%</span>
                        </div>
                        <span className="text-[9px] text-zinc-500 font-mono block mt-1">Precision rate</span>
                      </div>

                      {/* 4. Drills Run Card */}
                      <div className="bg-gradient-to-b from-[#181B30] to-[#121424] p-3.5 rounded-2xl border border-purple-500/30 hover:border-purple-500/60 transition-all duration-300 shadow-lg group">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono text-purple-400/90 font-bold uppercase tracking-wider">DRILLS RUN</span>
                          <Activity className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="mt-2 flex items-baseline gap-1">
                          <span className="text-2xl font-mono font-black text-purple-300 tracking-tight">{displayTests}</span>
                          <span className="text-[10px] font-mono font-bold text-purple-400/80">runs</span>
                        </div>
                        <span className="text-[9px] text-zinc-500 font-mono block mt-1">Completed tests</span>
                      </div>
                    </div>

                    {/* Detailed Session History & Charts Button */}
                    <div className="pt-1">
                      <button
                        onClick={() => {
                          setActiveModal('history');
                          sfx.playClick();
                        }}
                        className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-purple-500/10 to-cyan-500/15 border border-zinc-800 hover:border-amber-400/70 hover:from-amber-500/25 hover:to-cyan-500/25 text-center transition-all duration-300 cursor-pointer flex items-center justify-between group shadow-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:rotate-12 transition-transform">
                            <History className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col text-left">
                            <span className="text-xs font-extrabold text-zinc-100 group-hover:text-amber-400 transition-colors">
                              📊 View Detailed Session History & Live Charts
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              Detailed performance breakdown & timeline logs
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-zinc-800/80 border border-zinc-700/60 text-amber-400">
                          {filteredHistory.length} runs recorded
                        </span>
                      </button>
                    </div>

                    {/* Heatmap Key Fumbles Section */}
                    <div className="space-y-3 bg-[#121422]/90 p-4 rounded-2xl border border-zinc-800/80 shadow-md">
                      {(() => {
                        const sortedFumbles = Object.entries(fumbles).sort((a, b) => b[1] - a[1]);
                        const maxFumbleCount = sortedFumbles.length > 0 ? Math.max(...sortedFumbles.map(f => f[1])) : 1;
                        return (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-extrabold flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                                Coordinate Key Fumbles (Mistyped characters)
                              </span>
                              <span className="text-[9px] font-mono text-zinc-500">Sorted by error rate</span>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-1 font-mono max-h-48 overflow-y-auto scrollbar-none pr-1">
                              {sortedFumbles.length === 0 ? (
                                <div className="w-full py-4 text-center">
                                  <p className="text-xs text-emerald-400 font-mono font-semibold">✨ No failures registered! Flawless accuracy performance.</p>
                                </div>
                              ) : (
                                sortedFumbles.map(([char, count]) => {
                                  const isHighError = count > maxFumbleCount * 0.5;
                                  const isMedError = count > maxFumbleCount * 0.2;
                                  return (
                                    <div
                                      key={char}
                                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
                                        isHighError
                                          ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.15)] font-black'
                                          : isMedError
                                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-bold'
                                          : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-300'
                                      }`}
                                    >
                                      <span className="uppercase font-mono text-xs">{char === ' ' ? 'SPACE' : char}</span>
                                      <span className="opacity-40 text-[9px]">•</span>
                                      <span className="text-[10px] font-mono font-bold">{count}x errors</span>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {/* AI Weakness Analyzer & Custom Targeted Drill Generator */}
                    <div className="space-y-3 bg-gradient-to-r from-[#181B30] to-[#121424] p-5 rounded-2xl border border-amber-500/30 shadow-xl text-left">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-sm shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                            🧠
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">AI Weakness Analyzer</h4>
                            <p className="text-[10px] text-zinc-400 font-mono mt-0.5">Real-time telemetry breakdown & automated custom drill generator</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setActiveModal(null);
                            generateSmartDrill();
                          }}
                          disabled={smartDrillGenerating}
                          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-50 text-zinc-950 font-black text-xs font-mono rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.25)] flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{smartDrillGenerating ? "Generating Custom Drill..." : "⚡ Generate AI Weakness Drill"}</span>
                        </button>
                      </div>

                      {/* Detected Telemetry Metrics */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div className="bg-[#141628]/90 p-3 rounded-xl border border-zinc-800/80 space-y-1">
                          <span className="text-[9px] font-mono text-zinc-400 uppercase font-black tracking-wider block">Target Key Fumbles</span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {getTopFumbles().length > 0 ? (
                              getTopFumbles().map(f => (
                                <span key={f.char} className="px-2 py-0.5 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] font-mono font-black rounded-lg">
                                  '{f.char === ' ' ? 'SPACE' : f.char}' ({f.count}x)
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] font-mono text-emerald-400 italic">No key fumbles detected yet</span>
                            )}
                          </div>
                        </div>

                        <div className="bg-[#141628]/90 p-3 rounded-xl border border-zinc-800/80 space-y-1">
                          <span className="text-[9px] font-mono text-zinc-400 uppercase font-black tracking-wider block">Slowest Bigram Delay</span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {getTopSlowestBigrams().length > 0 ? (
                              getTopSlowestBigrams().map(b => (
                                <span key={b.bigram} className="px-2 py-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-black rounded-lg">
                                  '{b.bigram.toUpperCase()}' ({b.delay}ms)
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] font-mono text-emerald-400 italic">No bigram delays detected</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SVG speed velocity line graph (DYNAMIC) */}
                    <div className="space-y-3 bg-[#121422]/90 p-4 rounded-2xl border border-zinc-800/80 shadow-md">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-extrabold flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-amber-400" />
                          Speed Velocity Curve (Recent Exercises)
                        </span>
                        <span className="text-[9px] font-mono text-amber-400 font-bold">WPM Trajectory</span>
                      </div>

                      {(() => {
                        if (filteredHistory.length < 2) {
                          return (
                            <div className="bg-[#181B30]/60 p-6 rounded-xl border border-zinc-800 text-center">
                              <p className="text-xs text-zinc-400 font-mono italic">
                                Complete at least 2 practice sessions in this category to render your live speed velocity curve graph.
                              </p>
                            </div>
                          );
                        }

                        // We take up to 10 latest entries and reverse them for correct chronological left-to-right order
                        const chronologicalHistory = [...filteredHistory].slice(0, 10).reverse();
                        const wpms = chronologicalHistory.map(h => h.wpm);
                        const minWpm = Math.max(0, Math.min(...wpms) - 5);
                        const maxWpm = Math.max(minWpm + 15, Math.max(...wpms) + 5);
                        const range = maxWpm - minWpm || 10;

                        const width = 500;
                        const height = 130;
                        const paddingX = 40;
                        const paddingY = 25;

                        const getX = (index: number) => {
                          if (chronologicalHistory.length <= 1) return paddingX;
                          return paddingX + (index / (chronologicalHistory.length - 1)) * (width - paddingX * 2);
                        };

                        const getY = (wpm: number) => {
                          return height - paddingY - ((wpm - minWpm) / range) * (height - paddingY * 2);
                        };

                        const points = chronologicalHistory.map((h, idx) => ({
                          x: getX(idx),
                          y: getY(h.wpm),
                          wpm: h.wpm
                        }));

                        const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                        const areaPath = linePath ? `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z` : '';

                        return (
                          <div className="bg-[#161828] p-4 rounded-xl border border-zinc-800 shadow-inner">
                            <div className="h-[130px] w-full">
                              <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                                <defs>
                                  <linearGradient id="curve-gradient-dynamic" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.35" />
                                    <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                                  </linearGradient>
                                </defs>

                                {/* Horizontal grid helper lines */}
                                <line x1={paddingX} y1={getY(minWpm + range * 0.25)} x2={width - paddingX} y2={getY(minWpm + range * 0.25)} stroke="#26293D" strokeDasharray="4 4" />
                                <line x1={paddingX} y1={getY(minWpm + range * 0.5)} x2={width - paddingX} y2={getY(minWpm + range * 0.5)} stroke="#26293D" strokeDasharray="4 4" />
                                <line x1={paddingX} y1={getY(minWpm + range * 0.75)} x2={width - paddingX} y2={getY(minWpm + range * 0.75)} stroke="#26293D" strokeDasharray="4 4" />

                                {/* Solid line & gradient fill */}
                                {areaPath && <path d={areaPath} fill="url(#curve-gradient-dynamic)" />}
                                {linePath && <path d={linePath} fill="none" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}

                                {/* Data node markers */}
                                {points.map((p, idx) => (
                                  <g key={idx}>
                                    <circle
                                      cx={p.x}
                                      cy={p.y}
                                      r="4.5"
                                      fill="#F59E0B"
                                      stroke="#0D0F1A"
                                      strokeWidth="2"
                                    />
                                    <text
                                      x={p.x}
                                      y={p.y - 8}
                                      fill="#FDE68A"
                                      fontSize="9"
                                      fontFamily="monospace"
                                      fontWeight="900"
                                      textAnchor="middle"
                                    >
                                      {p.wpm}
                                    </text>
                                  </g>
                                ))}

                                {/* Y-Axis Labels */}
                                <text x={paddingX - 10} y={getY(minWpm + range * 0.25) + 3} fill="#71717A" fontSize="8" fontFamily="monospace" textAnchor="end">
                                  {Math.round(minWpm + range * 0.25)}
                                </text>
                                <text x={paddingX - 10} y={getY(minWpm + range * 0.5) + 3} fill="#71717A" fontSize="8" fontFamily="monospace" textAnchor="end">
                                  {Math.round(minWpm + range * 0.5)}
                                </text>
                                <text x={paddingX - 10} y={getY(minWpm + range * 0.75) + 3} fill="#71717A" fontSize="8" fontFamily="monospace" textAnchor="end">
                                  {Math.round(minWpm + range * 0.75)}
                                </text>
                              </svg>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* PREDICTION FEATURE BLOCK */}
                    {(() => {
                      // Let's compute prediction parameters
                      const chronologicalHistory = [...filteredHistory].reverse();
                      const n = chronologicalHistory.length;

                      if (n === 0) return null;

                      let slope = 0;
                      let intercept = 0;

                      if (n === 1) {
                        slope = 1.0; // conservative default progress rate
                        intercept = chronologicalHistory[0].wpm;
                      } else {
                        let sumX = 0;
                        let sumY = 0;
                        let sumXY = 0;
                        let sumXX = 0;

                        for (let i = 0; i < n; i++) {
                          sumX += i;
                          sumY += chronologicalHistory[i].wpm;
                          sumXY += i * chronologicalHistory[i].wpm;
                          sumXX += i * i;
                        }

                        const denominator = (n * sumXX - sumX * sumX);
                        slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
                        intercept = (sumY - slope * sumX) / n;
                      }

                      // Project speed after 10 more drills
                      const targetIndex = n + 10;
                      const projectedWpm = Math.max(15, Math.min(150, Math.round(slope * targetIndex + intercept)));

                      // Calculate sessions needed to reach the target speed WPM
                      let sessionsNeeded = 10;
                      const currentAvg = displayAvgWpm;

                      if (currentAvg >= speedTarget) {
                        sessionsNeeded = 0;
                      } else {
                        const speedGap = speedTarget - currentAvg;
                        const growthRate = slope > 0.1 ? slope : 1.2; // default to a safe 1.2 if slope is flat or negative
                        sessionsNeeded = Math.max(1, Math.min(100, Math.ceil(speedGap / growthRate)));
                      }

                      const confidenceLevel = n < 3 ? "Low (Collect more data)" : n < 6 ? "Medium" : "High (Stable Trend)";
                      const isImproving = slope > 0.1;

                      return (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[#FFB800]" />
                            <span className="text-[10px] font-mono text-zinc-300 uppercase tracking-wider block font-bold">WPM Prediction Engine & Learning Projection</span>
                          </div>

                          <div className="bg-zinc-900/50 border border-zinc-800/80 p-4 rounded-[12px] space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {/* Forecast WPM Box */}
                              <div className="bg-[#181822] p-3 rounded-[8px] border border-zinc-850 flex flex-col justify-between">
                                <div>
                                  <span className="text-[9px] font-mono text-zinc-500 uppercase block">10-Session Forecast</span>
                                  <span className="text-xl font-mono font-black text-[#FFB800] block mt-1">
                                    {projectedWpm} WPM
                                  </span>
                                </div>
                                <span className="text-[9px] text-zinc-400 font-mono mt-1">
                                  Expected velocity in 10 practices
                                </span>
                              </div>

                              {/* Estimated sessions to target */}
                              <div className="bg-[#181822] p-3 rounded-[8px] border border-[#FFB800]/20 flex flex-col justify-between">
                                <div>
                                  <span className="text-[9px] font-mono text-zinc-500 uppercase block">Drills to reach {speedTarget} WPM</span>
                                  <span className="text-xl font-mono font-black text-white block mt-1">
                                    {sessionsNeeded === 0 ? "ACHIEVED" : `~${sessionsNeeded} drills`}
                                  </span>
                                </div>
                                <span className="text-[9px] text-zinc-400 font-mono mt-1">
                                  Target Benchmark: {speedTarget} WPM
                                </span>
                              </div>
                            </div>

                            {/* Detail summary callout */}
                            <div className="p-3 bg-[#FFB800]/5 border border-[#FFB800]/10 rounded-[8px] text-[11px] font-mono leading-relaxed text-zinc-300">
                              <div className="flex items-center gap-1.5 text-[#FFB800] font-bold text-[10px] uppercase tracking-wide mb-1">
                                <span>LEARNING PROGRESS PROFILE</span>
                                <span className="text-zinc-600">•</span>
                                <span className="text-zinc-400">Confidence: {confidenceLevel}</span>
                              </div>
                              {sessionsNeeded === 0 ? (
                                <p>Excellent capability! Your current historical average is already above your selected target of {speedTarget} WPM. The forecasting engine projects you to safely sustain a highly competent speed of around {projectedWpm} WPM with continued practice.</p>
                              ) : isImproving ? (
                                <p>The statistical trendline suggests a positive learning curve of <span className="text-[#FFB800] font-bold">+{slope.toFixed(2)} WPM</span> per practice drill. Keeping this up, you should cross your current benchmark of {speedTarget} WPM within approximately {sessionsNeeded} further drills.</p>
                              ) : (
                                <p>Your current speed trends are holding stable. Focus on typing accuracy (aim for &gt;97%) during your next 5 sessions. Accuracy builds fluid muscle transitions, which is mathematically projected to boost your speed past the {speedTarget} WPM benchmark within ~{sessionsNeeded} trials.</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })()}

              {/* E. LEADERBOARD PANEL CONTENT */}
              {activeModal === 'leaderboard' && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-gradient-to-r from-amber-500/15 via-purple-500/10 to-cyan-500/15 border border-zinc-800 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-amber-400 font-extrabold uppercase tracking-wider block">Global Leaderboard</span>
                      <p className="text-xs text-zinc-300 font-mono mt-0.5">Real-time standings of elite clackers.</p>
                    </div>
                    <span className="text-[9px] font-mono font-bold px-2.5 py-1 rounded-lg bg-zinc-800/80 border border-zinc-700/60 text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> LIVE
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {/* Rank 1 */}
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.15)] group hover:scale-[1.01] transition-transform">
                      <div className="flex items-center gap-3.5">
                        <span className="w-9 h-9 rounded-xl bg-amber-400 text-zinc-950 font-black font-mono text-xs flex items-center justify-center shadow-lg shadow-amber-500/20">
                          🥇 1
                        </span>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-white group-hover:text-amber-300 transition-colors">SpeedTypist</span>
                          <span className="text-[9px] font-mono text-zinc-400">Tactile Blue Switch • Rank #1</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-mono font-black text-amber-400 block tracking-tight">98 WPM</span>
                        <span className="text-[9px] font-mono text-emerald-400 font-bold block">99.8% Acc</span>
                      </div>
                    </div>

                    {/* Rank 2 */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-cyan-500/15 via-cyan-500/5 to-transparent border border-cyan-500/30 group hover:scale-[1.01] transition-transform">
                      <div className="flex items-center gap-3.5">
                        <span className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-black font-mono text-xs flex items-center justify-center">
                          🥈 2
                        </span>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-zinc-100 group-hover:text-cyan-300 transition-colors">ClackMaster</span>
                          <span className="text-[9px] font-mono text-zinc-400">Linear Red Preset • Rank #2</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-mono font-black text-cyan-300 block">87 WPM</span>
                        <span className="text-[9px] font-mono text-emerald-400 font-bold block">99.2% Acc</span>
                      </div>
                    </div>

                    {/* Rank 3 */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-amber-700/15 via-amber-700/5 to-transparent border border-amber-700/30 group hover:scale-[1.01] transition-transform">
                      <div className="flex items-center gap-3.5">
                        <span className="w-8 h-8 rounded-xl bg-amber-700/20 border border-amber-700/40 text-amber-500 font-black font-mono text-xs flex items-center justify-center">
                          🥉 3
                        </span>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-zinc-100 group-hover:text-amber-400 transition-colors">CyberFingers</span>
                          <span className="text-[9px] font-mono text-zinc-400">Silent Brown Switch • Rank #3</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-mono font-black text-amber-400 block">82 WPM</span>
                        <span className="text-[9px] font-mono text-emerald-400 font-bold block">98.5% Acc</span>
                      </div>
                    </div>

                    {/* Rank 4 */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#141628]/90 border border-zinc-800/80 hover:border-zinc-700">
                      <div className="flex items-center gap-3.5">
                        <span className="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-400 font-bold font-mono text-xs flex items-center justify-center">
                          4
                        </span>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-zinc-200">TypingTornado</span>
                          <span className="text-[9px] font-mono text-zinc-400">Retro Arcade Presets</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-zinc-300 block">76 WPM</span>
                        <span className="text-[9px] font-mono text-zinc-400 block">97.9% Acc</span>
                      </div>
                    </div>

                    {/* Rank 5 */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#141628]/90 border border-zinc-800/80 hover:border-zinc-700">
                      <div className="flex items-center gap-3.5">
                        <span className="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-400 font-bold font-mono text-xs flex items-center justify-center">
                          5
                        </span>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-zinc-200">KeyClacker</span>
                          <span className="text-[9px] font-mono text-zinc-400">Tactile Blue Switch</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-zinc-300 block">71 WPM</span>
                        <span className="text-[9px] font-mono text-zinc-400 block">98.1% Acc</span>
                      </div>
                    </div>
                  </div>

                  {/* Your Personal Best Rank Banner */}
                  <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-purple-500/15 to-cyan-500/20 border border-amber-500/40 flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md">
                        <Trophy className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-white block">Your Standing Position</span>
                        <span className="text-[9px] font-mono text-zinc-300">Based on personal best speed</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-mono font-black text-amber-400 block">
                        {globalStats.bestWpm > 0 ? `${globalStats.bestWpm} WPM` : 'Unranked'}
                      </span>
                      <span className="text-[9px] font-mono text-cyan-300 font-bold block">
                        {globalStats.bestWpm > 0 ? `Rank ~ #${globalStats.bestWpm >= 98 ? 1 : globalStats.bestWpm >= 87 ? 2 : globalStats.bestWpm >= 82 ? 3 : globalStats.bestWpm >= 76 ? 4 : globalStats.bestWpm >= 71 ? 5 : 6}` : 'No test runs recorded'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* D. SETTINGS MODAL CONTENT */}
              {activeModal === 'settings' && (
                <div className="space-y-6">

                  {/* Tactile Audio Volume control */}
                  <div className="space-y-3 text-left">
                    <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block font-extrabold flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-amber-400" /> Tactile Keypress Sounds & Haptics
                    </span>
                    <div className="bg-[#121422]/90 p-4 rounded-2xl border border-zinc-800/80 shadow-md flex flex-col gap-4">
                      <div className="flex justify-between items-center bg-[#181B30]/60 p-3 rounded-xl border border-zinc-800">
                        <div>
                          <span className="text-xs font-bold text-white block">Mechanical Click Acoustics</span>
                          <span className="text-[9px] font-mono text-zinc-400">Play real-time audio on keypress</span>
                        </div>
                        <button
                          onClick={() => setSoundEnabled(!soundEnabled)}
                          className={`px-4 py-2 rounded-xl text-xs font-mono font-extrabold transition-all cursor-pointer shadow-md ${
                            soundEnabled
                              ? 'bg-amber-400 text-zinc-950 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}
                        >
                          {soundEnabled ? 'SOUND: ON 🔊' : 'SOUND: OFF 🔇'}
                        </button>
                      </div>

                      <div className="space-y-1.5 px-1">
                        <div className="flex justify-between text-[11px] text-zinc-300 font-mono font-bold">
                          <span>Keyboard Acoustic Volume</span>
                          <span className="text-amber-400">{Math.round(soundVolume * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={soundVolume}
                          onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                        />
                      </div>

                      {soundEnabled && (
                        <div className="space-y-2.5 pt-3 border-t border-zinc-800/80">
                          <span className="text-[10px] font-mono text-zinc-400 font-extrabold uppercase tracking-wider block">Keyswitch Sound Profile</span>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { id: 'blue', name: '🔵 Blue Switches', desc: 'Tactile & clicky mechanical clack' },
                              { id: 'red', name: '🔴 Red Switches', desc: 'Linear thuds with deeper profile' },
                              { id: 'brown', name: '🟤 Brown Switches', desc: 'Dampened tactile feedback' },
                              { id: 'silent', name: '🤫 Silent Switches', desc: 'Almost fully quiet, subtle puff' },
                              { id: 'typewriter', name: '📜 Typewriter', desc: 'Retro bell and metallic clack' },
                              { id: 'arcade', name: '👾 Retro Arcade', desc: 'Classic 8-bit synthesizer blips' }
                            ].map((preset) => {
                              const isSelected = soundPreset === preset.id;
                              return (
                                <button
                                  key={preset.id}
                                  onClick={() => {
                                    setSoundPreset(preset.id as any);
                                    sfx.preset = preset.id as any;
                                    sfx.playClick(false, false);
                                  }}
                                  className={`py-2.5 px-3 rounded-xl border font-mono text-[10px] text-left transition-all duration-200 cursor-pointer flex flex-col justify-between h-15 ${
                                    isSelected
                                      ? 'bg-gradient-to-r from-amber-500/25 to-amber-500/10 text-amber-300 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.2)] font-black'
                                      : 'bg-[#161828] border-zinc-800/80 hover:border-zinc-700 hover:bg-[#1A1D32] text-zinc-400'
                                  }`}
                                >
                                  <span className="font-extrabold text-white">{preset.name}</span>
                                  <span className={`text-[8px] font-normal leading-tight mt-0.5 ${isSelected ? 'text-amber-400 font-semibold' : 'text-zinc-500'}`}>{preset.desc}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Aesthetic & Habit building settings */}
                  <div className="space-y-3 text-left">
                    <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block font-extrabold flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-amber-400" /> Customization & Habits
                    </span>
                    <div className="bg-[#121422]/90 p-4 rounded-2xl border border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 shadow-md">
                      <button
                        onClick={() => {
                          setActiveModal('themes');
                          sfx.playClick();
                        }}
                        className="py-3 px-4 rounded-xl bg-[#161828] border border-zinc-800 hover:border-cyan-400/60 hover:bg-[#1A1D32] text-left transition-all duration-200 cursor-pointer flex items-center gap-3 group shadow-sm"
                      >
                        <Palette className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                        <div>
                          <span className="text-xs font-bold text-zinc-100 block group-hover:text-cyan-300 transition-colors">🎨 Themes Editor</span>
                          <span className="text-[9px] text-zinc-400 font-mono mt-0.5 block">Create custom color schemes</span>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setActiveModal('goals');
                          sfx.playClick();
                        }}
                        className="py-3 px-4 rounded-xl bg-[#161828] border border-zinc-800 hover:border-emerald-400/60 hover:bg-[#1A1D32] text-left transition-all duration-200 cursor-pointer flex items-center gap-3 group shadow-sm"
                      >
                        <Target className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                        <div>
                          <span className="text-xs font-bold text-zinc-100 block group-hover:text-emerald-300 transition-colors">🎯 Daily Goals</span>
                          <span className="text-[9px] text-zinc-400 font-mono mt-0.5 block">WPM & words target tracker</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Speed benchmark selector */}
                  <div className="space-y-3 text-left">
                    <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block font-extrabold flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" /> Speed Target Adjustments
                    </span>
                    <div className="bg-[#121422]/90 p-4 rounded-2xl border border-zinc-800/80 space-y-3 shadow-md">
                      <p className="text-[11px] text-zinc-300 font-mono">Target benchmark WPM determines speed meter goals on your primary telemetry display.</p>
                      <div className="grid grid-cols-4 gap-2.5">
                        {[30, 45, 60, 80].map((speed) => {
                          const isSelected = speedTarget === speed;
                          return (
                            <button
                              key={speed}
                              onClick={() => {
                                setSpeedTarget(speed);
                                sfx.playClick();
                              }}
                              className={`py-2.5 rounded-xl font-mono font-black text-xs border transition-all duration-200 cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-400 text-zinc-950 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                                  : 'bg-[#161828] border-zinc-800 hover:border-amber-400/40 text-zinc-400'
                              }`}
                            >
                              {speed} WPM
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Reset statistics block */}
                  <div className="space-y-3 text-left">
                    <span className="text-[10px] font-mono text-red-500 uppercase tracking-wider block font-bold">Destructive Area</span>
                    <div className="bg-red-500/5 p-4 rounded-[12px] border border-red-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-bold text-red-400">Clear Telemetry Profiles</h4>
                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Delete all recorded session fumbles and speed metrics.</p>
                      </div>
                      <button
                        onClick={() => {
                          setFumbles({});
                          setHistory([]);
                          setGlobalStats({ avgWpm: 50, bestWpm: 50, accuracy: 100, totalTests: 0, timeSpentMin: 0 });
                          setStreak(1);
                          setPhysicalKeyPresses({});
                          setPhysicalKeyErrors({});
                          localStorage.removeItem("ghost_pb_wpm");
                          localStorage.removeItem("ghost_pb_timestamps");
                          localStorage.removeItem("global_stats");
                          localStorage.removeItem("fumbles");
                          localStorage.removeItem("history");
                          localStorage.removeItem("streak");
                          localStorage.removeItem("ranked_title");
                          localStorage.removeItem("physicalKeyPresses");
                          localStorage.removeItem("physicalKeyErrors");
                          setGhostPbWpm(0);
                          setGhostTimestamps([]);
                          sfx.playClick(false, true);
                          setResetMessage("All user telemetry and ghost files have been safely reset.");
                          setTimeout(() => {
                            setResetMessage(null);
                          }, 3500);
                        }}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-[8px] text-[10px] font-mono font-bold transition-all cursor-pointer self-start sm:self-center"
                      >
                        Wipe Telemetry
                      </button>
                    </div>

                    {resetMessage && (
                      <div className="bg-[#FFB800]/10 border border-[#FFB800]/30 rounded-[10px] p-3 text-center text-xs text-[#FFB800] font-mono animate-in fade-in zoom-in-95 duration-200">
                        {resetMessage}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* F. ACTIVITY CALENDAR MODAL CONTENT */}
              {activeModal === 'calendar' && (
                <div className="space-y-6">
                  <div className="bg-[#181822] p-4 rounded-[12px] border border-zinc-850 space-y-4">
                    {/* Month/Year selector header */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => {
                          sfx.playClick();
                          if (calendarMonth === 0) {
                            setCalendarMonth(11);
                            setCalendarYear(prev => prev - 1);
                          } else {
                            setCalendarMonth(prev => prev - 1);
                          }
                        }}
                        className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-[#00F0FF] transition-all cursor-pointer font-bold font-mono"
                      >
                        ◀
                      </button>
                      <span className="font-mono font-black text-white text-sm tracking-widest uppercase">
                        {new Date(calendarYear, calendarMonth).toLocaleString('default', { month: 'long' })} {calendarYear}
                      </span>
                      <button
                        onClick={() => {
                          sfx.playClick();
                          if (calendarMonth === 11) {
                            setCalendarMonth(0);
                            setCalendarYear(prev => prev + 1);
                          } else {
                            setCalendarMonth(prev => prev + 1);
                          }
                        }}
                        className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-[#00F0FF] transition-all cursor-pointer font-bold font-mono"
                      >
                        ▶
                      </button>
                    </div>

                    {/* Weekdays row */}
                    <div className="grid grid-cols-7 gap-1 text-center border-b border-zinc-800/80 pb-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <span key={d} className="text-[10px] font-mono font-bold text-zinc-500 uppercase">{d}</span>
                      ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-1 text-center font-mono">
                      {(() => {
                        const weeks = getCalendarWeeks(calendarYear, calendarMonth);
                        return weeks.flat().map((dayDate, idx) => {
                          if (dayDate === null) {
                            return <div key={`empty-${idx}`} className="aspect-square opacity-0" />;
                          }

                          const sessions = getSessionsForDate(dayDate);
                          const sessionCount = sessions.length;
                          const isTodayObj = dayDate.toDateString() === new Date().toDateString();

                          // Determine color based on session count
                          let bgClass = "bg-zinc-900/40 border border-zinc-900";
                          let textClass = "text-zinc-600";
                          let glowClass = "";

                          if (sessionCount > 0) {
                            textClass = "text-white font-bold";
                            if (sessionCount === 1 || sessionCount === 2) {
                              bgClass = "bg-[#00F0FF]/10 border border-[#00F0FF]/30";
                            } else if (sessionCount >= 3 && sessionCount <= 5) {
                              bgClass = "bg-[#00F0FF]/25 border border-[#00F0FF]/55";
                              glowClass = "shadow-[0_0_8px_rgba(0,240,255,0.15)]";
                            } else {
                              bgClass = "bg-[#00F0FF]/40 border border-[#00F0FF]";
                              glowClass = "shadow-[0_0_12px_rgba(0,240,255,0.35)]";
                            }
                          }

                          if (isTodayObj) {
                            bgClass += " border-2 border-[#FFB800]";
                          }

                          return (
                            <div
                              key={dayDate.getTime()}
                              className={`aspect-square rounded-[8px] flex flex-col items-center justify-between p-1 transition-all ${bgClass} ${glowClass} relative group cursor-pointer`}
                              title={`${dayDate.toDateString()}: ${sessionCount} drills`}
                            >
                              <span className={`text-[10px] ${textClass}`}>{dayDate.getDate()}</span>
                              {sessionCount > 0 && (
                                <span className="text-[7px] text-[#00F0FF] font-black">{sessionCount}x</span>
                              )}

                              {/* Hover details tooltip */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-50 bg-[#0B0C10] border border-zinc-800 p-2 rounded-lg shadow-xl w-36 pointer-events-none text-left">
                                <p className="text-[9px] text-[#FFB800] font-bold">{dayDate.toLocaleDateString()}</p>
                                <p className="text-[9px] text-zinc-300 mt-0.5">{sessionCount} completed drills</p>
                                {sessionCount > 0 && (
                                  <p className="text-[8px] text-zinc-400 mt-0.5">
                                    Best: {Math.max(...sessions.map(s => s.wpm))} WPM
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Summary/Coaching box in calendar */}
                  <div className="bg-[#141A26]/40 border border-zinc-800/80 rounded-[16px] p-4 space-y-3">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block font-bold">🎯 Streak Tracker & Habit Analytics</span>
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="bg-[#0B0C10]/60 p-3 rounded-xl border border-zinc-850">
                        <span className="text-[9px] font-mono text-zinc-500 block">CURRENT STREAK</span>
                        <span className="text-lg font-mono font-black text-[#FF6B35] mt-1 block">🔥 {streak} Days</span>
                      </div>
                      <div className="bg-[#0B0C10]/60 p-3 rounded-xl border border-zinc-850">
                        <span className="text-[9px] font-mono text-zinc-500 block">TOTAL PRACTICE DAYS</span>
                        <span className="text-lg font-mono font-black text-[#00F0FF] mt-1 block">
                          {(() => {
                            const activeDays = new Set(history.map(item => new Date(item.ts).toDateString()));
                            return activeDays.size;
                          })()} Days
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-[#0B0C10]/40 rounded-xl border border-zinc-900/60 text-center">
                      <p className="text-[10px] text-zinc-400 font-mono leading-relaxed">
                        Consistency builds muscle memory. Keep up the flame to secure daily progress toward your <strong className="text-[#00F0FF]">{speedTarget} WPM</strong> speed target!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* G. ACHIEVEMENTS SYSTEM MODAL CONTENT */}
              {activeModal === 'achievements' && (
                <div className="space-y-6">
                  {(() => {
                    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem("ribbon_unlocked_achievements") : null;
                    const unlockedList: string[] = saved ? JSON.parse(saved) : [];

                    const allAchievements = [
                      {
                        id: "speed_30",
                        title: "🥉 Bronze Speedster",
                        desc: "Achieved 30 WPM speed target!",
                        icon: "🥉",
                        category: "Speed",
                        progress: globalStats.bestWpm,
                        target: 30,
                        unit: "WPM"
                      },
                      {
                        id: "speed_50",
                        title: "🥈 Silver Speedster",
                        desc: "Achieved 50 WPM speed target!",
                        icon: "🥈",
                        category: "Speed",
                        progress: globalStats.bestWpm,
                        target: 50,
                        unit: "WPM"
                      },
                      {
                        id: "speed_70",
                        title: "🥇 Gold Speedster",
                        desc: "Achieved 70 WPM speed target!",
                        icon: "🥇",
                        category: "Speed",
                        progress: globalStats.bestWpm,
                        target: 70,
                        unit: "WPM"
                      },
                      {
                        id: "speed_100",
                        title: "💎 Diamond Speedster",
                        desc: "Achieved 100 WPM speed target!",
                        icon: "💎",
                        category: "Speed",
                        progress: globalStats.bestWpm,
                        target: 100,
                        unit: "WPM"
                      },
                      {
                        id: "practice_10",
                        title: "📚 Bookworm",
                        desc: "Completed 10 typing exercises!",
                        icon: "📚",
                        category: "Practice",
                        progress: globalStats.totalTests,
                        target: 10,
                        unit: "Drills"
                      },
                      {
                        id: "practice_50",
                        title: "🎓 Scholar",
                        desc: "Completed 50 typing exercises!",
                        icon: "🎓",
                        category: "Practice",
                        progress: globalStats.totalTests,
                        target: 50,
                        unit: "Drills"
                      },
                      {
                        id: "practice_100",
                        title: "🏆 Master Scholar",
                        desc: "Completed 100 typing exercises!",
                        icon: "🏆",
                        category: "Practice",
                        progress: globalStats.totalTests,
                        target: 100,
                        unit: "Drills"
                      },
                      {
                        id: "streak_7",
                        title: "🔥 On Fire",
                        desc: "Maintained a 7-day practice streak!",
                        icon: "🔥",
                        category: "Streak",
                        progress: streak,
                        target: 7,
                        unit: "Days"
                      },
                      {
                        id: "streak_30",
                        title: "🔥 Unstoppable",
                        desc: "Maintained a 30-day practice streak!",
                        icon: "🔥",
                        category: "Streak",
                        progress: streak,
                        target: 30,
                        unit: "Days"
                      },
                      {
                        id: "streak_100",
                        title: "🔥 Legendary",
                        desc: "Maintained a 100-day practice streak!",
                        icon: "🔥",
                        category: "Streak",
                        progress: streak,
                        target: 100,
                        unit: "Days"
                      },
                      {
                        id: "bot_1",
                        title: "🤖 Rookie Racer",
                        desc: "Won your first 🤖 Bot Race!",
                        icon: "🤖",
                        category: "Racing",
                        progress: userWins,
                        target: 1,
                        unit: "Wins"
                      },
                      {
                        id: "bot_10",
                        title: "🤖 Veteran Racer",
                        desc: "Won 10 🤖 Bot Races!",
                        icon: "⚡",
                        category: "Racing",
                        progress: userWins,
                        target: 10,
                        unit: "Wins"
                      },
                      {
                        id: "bot_50",
                        title: "🤖 Master Racer",
                        desc: "Won 50 🤖 Bot Races!",
                        icon: "👑",
                        category: "Racing",
                        progress: userWins,
                        target: 50,
                        unit: "Wins"
                      },
                      {
                        id: "boss_1",
                        title: "💀 Giant Slayer",
                        desc: "Defeated the adaptive 💀 Boss!",
                        icon: "⚔️",
                        category: "Racing",
                        progress: bossWinStreak,
                        target: 1,
                        unit: "Streak"
                      },
                      {
                        id: "boss_5",
                        title: "💀 Boss Nemesis",
                        desc: "Defeated the adaptive 💀 Boss 5 times in a row!",
                        icon: "🔥",
                        category: "Racing",
                        progress: bossWinStreak,
                        target: 5,
                        unit: "Streak"
                      }
                    ];

                    const totalCount = allAchievements.length;
                    const unlockedCount = allAchievements.filter(a => unlockedList.includes(a.id)).length;
                    const percent = Math.round((unlockedCount / totalCount) * 100) || 0;

                    return (
                      <div className="space-y-6">
                        {/* Progress Overview Card */}
                        <div className="bg-gradient-to-r from-[#181B30] to-[#121424] p-5 rounded-2xl border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
                          <div className="text-center md:text-left">
                            <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block font-black">MILESTONE TRACKER</span>
                            <h4 className="text-lg font-black text-white mt-1">Unlock Dashboard</h4>
                            <p className="text-[11px] text-zinc-300 mt-1 font-mono">You've unlocked {unlockedCount} of {totalCount} total achievements.</p>
                          </div>

                          <div className="flex items-center gap-4 bg-[#141628]/90 p-3.5 rounded-2xl border border-zinc-800 shadow-inner">
                            {/* Radial Progress Circle */}
                            <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                              <svg className="w-14 h-14 transform -rotate-90">
                                <circle cx="28" cy="28" r="24" stroke="rgba(255,255,255,0.05)" strokeWidth="4" fill="transparent" />
                                <circle cx="28" cy="28" r="24" stroke="#F59E0B" strokeWidth="4" fill="transparent"
                                  strokeDasharray={2 * Math.PI * 24}
                                  strokeDashoffset={2 * Math.PI * 24 * (1 - percent / 100)}
                                  className="transition-all duration-1000 ease-out"
                                />
                              </svg>
                              <span className="absolute text-xs font-mono font-black text-amber-400">{percent}%</span>
                            </div>
                            <div className="text-left">
                              <p className="text-[9px] font-mono text-zinc-400 uppercase font-bold">CURRENT STATUS</p>
                              <p className="text-xs font-black text-amber-400 font-mono mt-0.5">
                                {percent === 100 ? "👑 FULLY UNLOCKED" : "🚀 MOUNTING STREAKS"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* List of achievements grouped by Category */}
                        {["Speed", "Practice", "Streak", "Racing"].map(categoryName => {
                          const catAchievements = allAchievements.filter(a => a.category === categoryName);
                          return (
                            <div key={categoryName} className="space-y-3">
                              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block font-black border-b border-zinc-800/80 pb-1.5 flex items-center gap-2">
                                {categoryName === "Speed" && "⚡ Speed Targets"}
                                {categoryName === "Practice" && "📚 Practice Milestones"}
                                {categoryName === "Streak" && "🔥 Daily Streak Milestones"}
                                {categoryName === "Racing" && "🤖 Bot & Boss Race Standings"}
                              </span>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {catAchievements.map(ach => {
                                  const isUnlocked = unlockedList.includes(ach.id);
                                  const rawProgress = ach.progress;
                                  const progressPercent = Math.min(100, Math.round((rawProgress / ach.target) * 100)) || 0;

                                  return (
                                    <div
                                      key={ach.id}
                                      className={`p-4 rounded-2xl border flex flex-col justify-between transition-all duration-200 relative overflow-hidden group ${
                                        isUnlocked
                                          ? 'bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                                          : 'bg-[#141628]/60 border-zinc-800/80 opacity-70 hover:opacity-100'
                                      }`}
                                    >
                                      <div className="flex items-start gap-3">
                                        <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-lg shadow-md ${
                                          isUnlocked
                                            ? 'bg-amber-400/20 text-white border border-amber-400/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                                            : 'bg-zinc-800 text-zinc-600 border border-zinc-700'
                                        }`}>
                                          {isUnlocked ? ach.icon : "🔒"}
                                        </div>
                                        <div className="text-left min-w-0">
                                          <h5 className={`text-xs font-extrabold truncate ${isUnlocked ? 'text-white group-hover:text-amber-300' : 'text-zinc-400'}`}>
                                            {ach.title}
                                          </h5>
                                          <p className="text-[10px] text-zinc-400 leading-tight mt-1 font-mono">
                                            {ach.desc}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Mini progress bar for locked achievements */}
                                      {!isUnlocked && (
                                        <div className="mt-3.5 space-y-1">
                                          <div className="flex justify-between items-center text-[8px] font-mono text-zinc-400">
                                            <span>PROGRESS</span>
                                            <span className="font-bold text-amber-400">{rawProgress} / {ach.target} {ach.unit}</span>
                                          </div>
                                          <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                                            <div
                                              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500 rounded-full"
                                              style={{ width: `${progressPercent}%` }}
                                            />
                                          </div>
                                        </div>
                                      )}

                                      {/* Unlocked green tick decoration */}
                                      {isUnlocked && (
                                        <div className="absolute top-2 right-2 text-emerald-400 font-black text-[9px] font-mono tracking-widest bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-lg uppercase shadow-xs">
                                          UNLOCKED ✨
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* FEATURE 1: SOCIAL FEATURES MODAL */}
              {activeModal === 'friends' && (
                <div className="space-y-6">
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <p className="text-xs text-amber-300 font-mono flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-400 shrink-0" />
                      Follow other clackers, challenge them to a Bot Race, and monitor real-time muscle memory telemetry!
                    </p>
                  </div>

                  {/* Search/Follow Bar */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Find username (e.g., ClackSpeed, CodeNinja)..."
                      value={searchFriendQuery}
                      onChange={(e) => setSearchFriendQuery(e.target.value)}
                      className="bg-[#141628] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono flex-1 focus:outline-none focus:border-amber-400/80 placeholder:text-zinc-500 shadow-inner"
                    />
                    <button
                      onClick={() => {
                        if (!searchFriendQuery.trim()) return;
                        const username = searchFriendQuery.trim();
                        if (friendsList.includes(username)) {
                          setSearchFriendQuery("");
                          return;
                        }
                        setFriendsList(prev => [...prev, username]);
                        setActivities(prev => [
                          {
                            user: username,
                            action: "joined your clacking circle!",
                            timestamp: new Date().toISOString()
                          },
                          ...prev
                        ]);
                        setSearchFriendQuery("");
                        sfx.playClick();
                      }}
                      className="bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-black font-mono px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.2)] active:scale-95"
                    >
                      Follow +
                    </button>
                  </div>

                  {/* Friends list */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block font-extrabold flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-amber-400" /> People You Follow ({friendsList.length})
                    </span>
                    <div className="bg-[#121422]/90 border border-zinc-800/80 rounded-2xl overflow-hidden divide-y divide-zinc-800/60 shadow-md">
                      {friendsList.length === 0 ? (
                        <p className="p-4 text-xs text-zinc-400 font-mono italic text-center">You are currently typing in solo queue. Search and follow above!</p>
                      ) : (
                        friendsList.map(friend => (
                          <div key={friend} className="p-3.5 flex items-center justify-between gap-3 text-left hover:bg-[#181B30]/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="relative flex items-center justify-center">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
                              </div>
                              <div>
                                <span className="text-xs font-black text-white font-mono block">{friend}</span>
                                <span className="text-[9px] text-zinc-400 font-mono block">Status: Online • Clacking</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  // Challenge friend to Bot Race: open bot race page/modal
                                  setActiveModal(null);
                                  setBotRaceActive(true);
                                  setAdaptiveBossActive(false);
                                  setFreestyleMode(false);
                                  setZenMode(false);
                                  setArcadeActive(false);
                                  setWorkoutCompleted(false);
                                  setTypedText("");
                                  setStartTime(null);
                                  setBotWpm(Math.round(60 + Math.random() * 25));
                                  handleResetSession();
                                  sfx.playClick();
                                }}
                                className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-400 hover:text-zinc-950 text-amber-300 text-[10px] font-mono font-black rounded-xl border border-amber-500/30 transition-all cursor-pointer shadow-xs flex items-center gap-1"
                              >
                                ⚔️ Challenge
                              </button>
                              <button
                                onClick={() => {
                                  setFriendsList(prev => prev.filter(f => f !== friend));
                                  sfx.playClick();
                                }}
                                className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400 text-[10px] font-mono rounded-xl border border-rose-500/20 transition-all cursor-pointer"
                              >
                                Unfollow
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Activity Feed */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block font-extrabold flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-amber-400" /> Dynamic Activity Feed
                    </span>
                    <div className="bg-[#121422]/90 border border-zinc-800/80 p-4 rounded-2xl space-y-3 max-h-56 overflow-y-auto text-left scrollbar-none shadow-md">
                      {activities.length === 0 ? (
                        <p className="text-xs text-zinc-500 italic text-center">No social activity registered yet.</p>
                      ) : (
                        activities.map((act, i) => (
                          <div key={i} className="text-xs flex items-start gap-2.5">
                            <span className="text-[#00F0FF] font-mono">👤</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-zinc-300 font-mono">
                                <strong className="text-white font-bold">{act.user}</strong> {act.action}
                              </p>
                              <span className="text-[9px] text-zinc-500 block mt-0.5 font-mono">
                                {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* FEATURE 2: CUSTOM THEMES MODAL */}
              {activeModal === 'themes' && (
                <div className="space-y-6">
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <p className="text-xs text-amber-300 font-mono flex items-center gap-2">
                      <Palette className="w-4 h-4 text-amber-400 shrink-0" />
                      Create, import, or apply beautifully tailored color palettes to fully customize your typing viewport.
                    </p>
                  </div>

                  {/* Theme Gallery */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block font-extrabold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Theme Preset Gallery
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'dark', name: '🖤 PRO Amber Slate', colors: ['#0D0F1A', '#F59E0B', '#00F0FF', '#10B981'], config: { bg: '#0D0F1A', text: '#A1A1AA', cursor: '#F59E0B', accent: '#F59E0B', error: '#EF4444', correct: '#10B981' } },
                        { id: 'cyberpunk', name: '🩵 Cyberpunk Neon', colors: ['#0D0914', '#FF007F', '#00F0FF', '#FFE600'], config: { bg: '#0D0914', text: '#94A3B8', cursor: '#00F0FF', accent: '#FF007F', error: '#FF0055', correct: '#00F0FF' } },
                        { id: 'matrix', name: '🟢 Digital Matrix', colors: ['#05100A', '#00FF66', '#00E5FF', '#00FF00'], config: { bg: '#05100A', text: '#4ADE80', cursor: '#00FF66', accent: '#00FF66', error: '#F87171', correct: '#22C55E' } },
                        { id: 'violet', name: '🪻 Deep Violet', colors: ['#0F0C1B', '#A855F7', '#EC4899', '#3B82F6'], config: { bg: '#0F0C1B', text: '#C084FC', cursor: '#EC4899', accent: '#A855F7', error: '#F43F5E', correct: '#3B82F6' } },
                        { id: 'sunset', name: '🌅 Sunset Glow', colors: ['#1A0B2E', '#FFD3B6', '#FF577F', '#FF9F68'], config: { bg: '#1A0B2E', text: '#FFD3B6', cursor: '#FF577F', accent: '#FF9F68', error: '#E11D48', correct: '#10B981' } }
                      ].map(preset => {
                        const isSelected = activeTheme === preset.id;
                        return (
                          <button
                            key={preset.id}
                            onClick={() => {
                              setActiveTheme(preset.id);
                              if (preset.config) setCustomThemeColors(preset.config);
                              sfx.playClick();
                            }}
                            className={`p-3.5 rounded-2xl border font-mono text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[90px] ${
                              isSelected
                                ? 'bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-transparent border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                                : 'bg-[#141628] border-zinc-800/80 hover:border-amber-500/40 hover:bg-[#181A32]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-white">{preset.name}</span>
                              {isSelected && <span className="text-[8px] font-mono font-bold text-amber-400 animate-pulse">ACTIVE ●</span>}
                            </div>
                            <div className="flex gap-1.5 mt-3">
                              {preset.colors.map((c, idx) => (
                                <div key={idx} className="w-5 h-5 rounded-full border border-zinc-900 shadow-xs" style={{ backgroundColor: c }} />
                              ))}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Theme Editor */}
                  <div className="space-y-3 pt-3 border-t border-zinc-800/80">
                    <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block font-extrabold flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-amber-400" /> Interactive Theme Color Pickers
                    </span>
                    <div className="bg-[#121422]/90 border border-zinc-800/80 p-4 rounded-2xl grid grid-cols-2 gap-4 text-left shadow-md">
                      {[
                        { key: 'bg', label: 'Background Color', color: customThemeColors.bg },
                        { key: 'text', label: 'Untyped Text Color', color: customThemeColors.text },
                        { key: 'cursor', label: 'Cursor Color', color: customThemeColors.cursor },
                        { key: 'accent', label: 'Accent Theme Color', color: customThemeColors.accent },
                        { key: 'error', label: 'Incorrect Key Color', color: customThemeColors.error },
                        { key: 'correct', label: 'Correct Key Color', color: customThemeColors.correct }
                      ].map(field => (
                        <div key={field.key} className="space-y-1">
                          <label className="text-[10px] text-zinc-400 font-mono font-extrabold uppercase block">{field.label}</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={field.color}
                              onChange={(e) => {
                                setActiveTheme('custom');
                                setCustomThemeColors(prev => ({
                                  ...prev,
                                  [field.key]: e.target.value
                                }));
                              }}
                              className="w-8 h-8 rounded-lg border-0 bg-transparent cursor-pointer"
                            />
                            <input
                              type="text"
                              value={field.color}
                              onChange={(e) => {
                                setActiveTheme('custom');
                                setCustomThemeColors(prev => ({
                                  ...prev,
                                  [field.key]: e.target.value
                                }));
                              }}
                              className="bg-[#161828] border border-zinc-800 rounded-lg px-2.5 py-1 text-[11px] text-white font-mono w-24 focus:outline-none focus:border-amber-400/80"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Export / Import JSON */}
                  <div className="space-y-3 pt-3 border-t border-zinc-800/80">
                    <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block font-extrabold flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5 text-amber-400" /> JSON Data Import & Export
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const json = JSON.stringify(customThemeColors, null, 2);
                          navigator.clipboard.writeText(json);
                          alert("Theme JSON configuration copied to clipboard!");
                        }}
                        className="flex-1 py-2.5 px-3 bg-[#141628] border border-zinc-800 rounded-xl hover:border-amber-400/60 font-mono text-[11px] font-bold text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Download className="w-4 h-4 text-amber-400" /> Export Theme
                      </button>
                      <button
                        onClick={() => {
                          const customJSON = prompt("Paste your custom theme JSON config:");
                          if (customJSON) {
                            try {
                              const parsed = JSON.parse(customJSON);
                              if (parsed.bg && parsed.text && parsed.cursor && parsed.accent && parsed.error && parsed.correct) {
                                setCustomThemeColors(parsed);
                                setActiveTheme('custom');
                                alert("Theme loaded successfully!");
                              } else {
                                alert("Invalid custom theme format.");
                              }
                            } catch (e) {
                              alert("Failed to parse JSON schema.");
                            }
                          }
                        }}
                        className="flex-1 py-2 px-3 bg-zinc-900 border border-zinc-800 rounded-[8px] hover:border-[#45A29E] font-mono text-[11px] text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Upload className="w-4 h-4 text-[#45A29E]" /> Import Theme
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* FEATURE 3: TYPING HISTORY MODAL */}
              {activeModal === 'history' && (() => {
                const filteredHistory = history.filter(run => {
                  if (analyticsScriptFilter === 'english') return !run.script || run.script === 'english';
                  if (analyticsScriptFilter === 'hindi') return run.script === 'hindi';
                  return true;
                });

                return (
                  <div className="space-y-6">
                    <p className="text-xs text-zinc-400 font-mono">Full analytic ledger of previous practice records, performance statistics, and historical trends.</p>

                    {/* Script Filter Bar */}
                    <div className="flex items-center justify-between bg-[#181822] p-1.5 rounded-[12px] border border-zinc-850">
                      <span className="text-[10px] font-mono text-zinc-400 font-bold px-2 uppercase tracking-wider">Filter Ledger:</span>
                      <div className="flex gap-1 font-mono text-xs">
                        <button
                          onClick={() => setAnalyticsScriptFilter('all')}
                          className={`px-3 py-1 rounded-[8px] font-semibold transition-all ${analyticsScriptFilter === 'all'
                              ? 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30'
                              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                            }`}
                        >
                          All Languages
                        </button>
                        <button
                          onClick={() => setAnalyticsScriptFilter('english')}
                          className={`px-3 py-1 rounded-[8px] font-semibold transition-all ${analyticsScriptFilter === 'english'
                              ? 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30'
                              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                            }`}
                        >
                          🇬🇧 English
                        </button>
                        <button
                          onClick={() => setAnalyticsScriptFilter('hindi')}
                          className={`px-3 py-1 rounded-[8px] font-semibold transition-all ${analyticsScriptFilter === 'hindi'
                              ? 'bg-[#FF6B35]/15 text-[#FF6B35] border border-[#FF6B35]/30'
                              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                            }`}
                        >
                          🇮🇳 Hindi
                        </button>
                      </div>
                    </div>

                    {/* Performance Summary Grid */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-[#181822] p-3 rounded-[12px] border border-zinc-850 text-center">
                        <span className="text-[9px] font-mono text-zinc-500 block">RECORD WPM</span>
                        <span className="text-base font-mono font-black text-[#00F0FF] block mt-1">
                          {filteredHistory.length > 0 ? Math.max(...filteredHistory.map(h => h.wpm)) : 0} WPM
                        </span>
                      </div>
                      <div className="bg-[#181822] p-3 rounded-[12px] border border-zinc-850 text-center">
                        <span className="text-[9px] font-mono text-zinc-500 block">AVERAGE WPM</span>
                        <span className="text-base font-mono font-black text-white block mt-1">
                          {filteredHistory.length > 0 ? Math.round(filteredHistory.reduce((a, b) => a + b.wpm, 0) / filteredHistory.length) : 0} WPM
                        </span>
                      </div>
                      <div className="bg-[#181822] p-3 rounded-[12px] border border-zinc-850 text-center">
                        <span className="text-[9px] font-mono text-zinc-500 block">STABILITY RATIO</span>
                        <span className="text-base font-mono font-black text-[#FF6B35] block mt-1">
                          {filteredHistory.length > 0 ? `${Math.round((Math.min(...filteredHistory.map(h => h.wpm)) / Math.max(...filteredHistory.map(h => h.wpm))) * 100)}%` : '100%'}
                        </span>
                      </div>
                    </div>

                    {/* Pagination list */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block font-bold">Session History Ledger</span>
                      <div className="bg-[#181822] border border-zinc-850 rounded-[12px] overflow-hidden divide-y divide-zinc-800/60 max-h-[300px] overflow-y-auto">
                        {filteredHistory.length === 0 ? (
                          <p className="p-4 text-xs text-zinc-500 italic text-center">No recorded runs for this language yet.</p>
                        ) : (
                          filteredHistory.map((run, i) => (
                            <div key={i} className="p-3 flex items-center justify-between text-left">
                              <div className="flex items-center gap-2.5">
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ${run.script === 'hindi' ? 'bg-[#FF6B35]/15 text-[#FF6B35] border border-[#FF6B35]/30' : 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30'
                                  }`}>
                                  {run.script === 'hindi' ? 'HI' : 'EN'}
                                </span>
                                <div>
                                  <span className="text-xs font-bold text-white font-mono">{run.wpm} WPM</span>
                                  <span className="text-[9px] text-zinc-500 block mt-0.5 font-mono">
                                    {new Date(run.ts).toLocaleDateString()} @ {new Date(run.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="px-2.5 py-0.5 bg-[#45A29E]/10 border border-[#45A29E]/20 text-[#45A29E] text-[10px] font-bold font-mono rounded">
                                  {run.accuracy}% Acc
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Graphic Trends SVG */}
                    <div className="space-y-3 pt-2 border-t border-zinc-800/80">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block font-bold">Chronological Speed Progress Curve</span>
                      {filteredHistory.length < 2 ? (
                        <div className="p-6 bg-zinc-900/50 border border-zinc-850 rounded-[12px] text-center font-mono text-xs text-zinc-500 italic">
                          Need at least 2 sessions in this language to render live progression curves.
                        </div>
                      ) : (
                        <div className="bg-[#181822] p-4 rounded-[12px] border border-zinc-850 flex items-center justify-center">
                          {(() => {
                            const graphHistory = [...filteredHistory].slice(0, 15).reverse();
                            const wpms = graphHistory.map(h => h.wpm);
                            const min = Math.max(0, Math.min(...wpms) - 10);
                            const max = Math.max(min + 20, Math.max(...wpms) + 10);
                            const range = max - min;
                            const width = 450;
                            const height = 110;
                            const points = graphHistory.map((run, index) => {
                              const x = (index / (graphHistory.length - 1)) * (width - 40) + 20;
                              const y = height - ((run.wpm - min) / range) * (height - 30) - 15;
                              return `${x},${y}`;
                            }).join(' ');

                            return (
                              <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible font-mono">
                                <polyline fill="none" stroke="url(#historyGrad)" strokeWidth="3" points={points} strokeLinecap="round" strokeLinejoin="round" />
                                <defs>
                                  <linearGradient id="historyGrad" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#00F0FF" />
                                    <stop offset="100%" stopColor="#FFB800" />
                                  </linearGradient>
                                </defs>
                                {graphHistory.map((run, index) => {
                                  const x = (index / (graphHistory.length - 1)) * (width - 40) + 20;
                                  const y = height - ((run.wpm - min) / range) * (height - 30) - 15;
                                  return (
                                    <g key={index} className="group/dot cursor-pointer">
                                      <circle cx={x} cy={y} r="4" fill="#141419" stroke="#00F0FF" strokeWidth="2" className="hover:scale-155 transition-transform" />
                                      <text x={x} y={y - 8} textAnchor="middle" fontSize="8" fill="#C5C6C7" className="opacity-0 group-hover/dot:opacity-100 transition-opacity font-bold">
                                        {run.wpm}
                                      </text>
                                    </g>
                                  );
                                })}
                              </svg>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* FEATURE 4: DAILY GOALS MODAL */}
              {activeModal === 'goals' && (
                <div className="space-y-6 text-left">
                  <p className="text-xs text-zinc-400 font-mono">Establish structured speed objectives and typing routines to cultivate continuous habits and streaks.</p>

                  {/* Goal streak header */}
                  <div className="bg-[#181822] border border-zinc-850 p-4 rounded-[12px] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-[#45A29E] uppercase tracking-widest block font-black">Habit Consistency Streak</span>
                      <h4 className="text-base font-black text-white mt-1">Goal Streak: {goalsStreak} Days 🔥</h4>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Complete all daily targets before midnight to compound your streak!</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-[#FF6B35]/10 border border-[#FF6B35]/20 flex items-center justify-center text-xl shadow-[0_0_12px_rgba(255,107,53,0.1)]">
                      ⚡
                    </div>
                  </div>

                  {/* Goal progress cards */}
                  <div className="space-y-4">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block font-bold">Today's Progress Checklist</span>

                    {/* Goal 1: Practice Minutes */}
                    {(() => {
                      const percent = Math.min(100, Math.round((dailyGoalsProgress.practiceMin / dailyGoals.practiceMin) * 100));
                      const isMet = dailyGoalsProgress.practiceMin >= dailyGoals.practiceMin;
                      return (
                        <div className="bg-[#181822] p-3.5 rounded-[12px] border border-zinc-850 space-y-2">
                          <div className="flex justify-between items-center text-xs font-mono">
                            <span className="text-zinc-200 font-semibold flex items-center gap-2">
                              🕒 Practice Time Goal {isMet ? '✅' : '⏳'}
                            </span>
                            <span className="text-zinc-400 font-bold">{dailyGoalsProgress.practiceMin} / {dailyGoals.practiceMin} mins</span>
                          </div>
                          <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-500 ${isMet ? 'bg-emerald-500' : 'bg-[#00F0FF]'}`} style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      );
                    })()}

                    {/* Goal 2: Words Typed */}
                    {(() => {
                      const percent = Math.min(100, Math.round((dailyGoalsProgress.wordsTyped / dailyGoals.wordsTyped) * 100));
                      const isMet = dailyGoalsProgress.wordsTyped >= dailyGoals.wordsTyped;
                      return (
                        <div className="bg-[#181822] p-3.5 rounded-[12px] border border-zinc-850 space-y-2">
                          <div className="flex justify-between items-center text-xs font-mono">
                            <span className="text-zinc-200 font-semibold flex items-center gap-2">
                              📝 Words Typed Goal {isMet ? '✅' : '⏳'}
                            </span>
                            <span className="text-zinc-400 font-bold">{dailyGoalsProgress.wordsTyped} / {dailyGoals.wordsTyped} words</span>
                          </div>
                          <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-500 ${isMet ? 'bg-emerald-500' : 'bg-[#FFB800]'}`} style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      );
                    })()}

                    {/* Goal 3: Target WPM */}
                    {(() => {
                      const percent = Math.min(100, Math.round((dailyGoalsProgress.bestWpmToday / dailyGoals.targetWpm) * 100));
                      const isMet = dailyGoalsProgress.bestWpmToday >= dailyGoals.targetWpm;
                      return (
                        <div className="bg-[#181822] p-3.5 rounded-[12px] border border-zinc-850 space-y-2">
                          <div className="flex justify-between items-center text-xs font-mono">
                            <span className="text-zinc-200 font-semibold flex items-center gap-2">
                              ⚡ Speed Target Goal {isMet ? '✅' : '⏳'}
                            </span>
                            <span className="text-zinc-400 font-bold">{dailyGoalsProgress.bestWpmToday} / {dailyGoals.targetWpm} WPM</span>
                          </div>
                          <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-500 ${isMet ? 'bg-emerald-500' : 'bg-[#FF6B35]'}`} style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Goal Editor Form */}
                  <div className="space-y-3 pt-2 border-t border-zinc-800/80">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block font-bold">Configure Goal Benchmarks</span>
                    <div className="bg-[#181822] border border-zinc-850 p-4 rounded-[12px] space-y-3 text-xs">
                      <div className="flex justify-between items-center gap-4">
                        <span className="text-zinc-300 font-mono">Minutes practiced/day</span>
                        <input
                          type="number"
                          value={dailyGoals.practiceMin}
                          onChange={(e) => setDailyGoals(prev => ({ ...prev, practiceMin: parseInt(e.target.value) || 10 }))}
                          className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-white font-mono w-20 text-center focus:outline-none focus:border-[#00F0FF]"
                        />
                      </div>
                      <div className="flex justify-between items-center gap-4">
                        <span className="text-zinc-300 font-mono">Words typed/day</span>
                        <input
                          type="number"
                          value={dailyGoals.wordsTyped}
                          onChange={(e) => setDailyGoals(prev => ({ ...prev, wordsTyped: parseInt(e.target.value) || 100 }))}
                          className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-white font-mono w-20 text-center focus:outline-none focus:border-[#00F0FF]"
                        />
                      </div>
                      <div className="flex justify-between items-center gap-4">
                        <span className="text-zinc-300 font-mono">Target velocity speed (WPM)</span>
                        <input
                          type="number"
                          value={dailyGoals.targetWpm}
                          onChange={(e) => setDailyGoals(prev => ({ ...prev, targetWpm: parseInt(e.target.value) || 30 }))}
                          className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-white font-mono w-20 text-center focus:outline-none focus:border-[#00F0FF]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-zinc-950 border-t border-zinc-850 flex justify-end rounded-b-[16px]">
              <button
                onClick={() => {
                  setActiveModal(null);
                  sfx.playClick();
                }}
                className="bg-[#FFB800] text-zinc-950 font-bold font-sans text-xs px-5 py-2 rounded-[10px] transition-transform active:scale-95 cursor-pointer shadow-lg shadow-[#FFB800]/15"
              >
                Close Panel
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 5. WEEKLY CHALLENGE MODAL SYSTEM (SLIDE-OUT OVERLAY) */}
      {weeklyChallengeOpen && (
        <div className="absolute inset-y-0 right-0 z-45 flex justify-end select-none w-full pointer-events-none">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[#0F0F12]/60 backdrop-blur-xs transition-opacity duration-300 pointer-events-auto"
            onClick={() => {
              setWeeklyChallengeOpen(false);
              sfx.playClick();
            }}
          />

          {/* Slide-out Panel container */}
          <div className="relative bg-[#141419] border-l border-zinc-850 w-full max-w-xl md:max-w-2xl h-full flex flex-col shadow-[-10px_0_40px_rgba(0,0,0,0.6)] z-10 pointer-events-auto transition-all duration-300">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00F0FF] shadow-[0_0_8px_#00F0FF]" />
                <h3 className="font-bold text-white tracking-tight uppercase text-xs font-mono">
                  🏆 Weekly Challenge Competition
                </h3>
              </div>
              <button
                onClick={() => {
                  setWeeklyChallengeOpen(false);
                  sfx.playClick();
                }}
                className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* Countdown & Info Card */}
              <div className="bg-[#181822] p-4 rounded-[12px] border border-zinc-850 space-y-3">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-black">
                    ⏱️ TIME LEFT UNTIL RESET:
                  </span>
                  <span className="bg-[#45A29E]/25 border border-[#45A29E]/50 px-2 py-0.5 rounded-full font-mono text-[10px] text-[#00F0FF] font-black tracking-widest animate-pulse">
                    {(() => {
                      const now = new Date();
                      const nextMonday = new Date();
                      // Find next Monday: getUTCDay() 0=Sun,1=Mon,...6=Sat
                      const dayOfWeek = nextMonday.getUTCDay();
                      const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7 || 7;
                      nextMonday.setUTCDate(nextMonday.getUTCDate() + daysUntilMonday);
                      nextMonday.setUTCHours(0, 0, 0, 0);
                      const diffMs = nextMonday.getTime() - now.getTime();
                      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                      const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                      return `${diffDays} days, ${diffHours} hours`;
                    })()}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 font-mono leading-relaxed">
                  Compete on a unique Gemini-generated story. The challenge resets automatically every Monday at 00:00 UTC. Aim for Gold (top 10%), Silver (top 25%), or Bronze (top 50%) status!
                </p>
              </div>

              {/* Personal Best info */}
              <div className="bg-[#1F2833]/25 p-3 rounded-[12px] border border-zinc-800 flex justify-between items-center text-[10px] font-mono">
                <span className="text-zinc-400 uppercase font-black tracking-widest">🏆 YOUR PB:</span>
                <span className="text-white font-black text-xs">
                  {weeklyChallengePB ? (
                    <span className="text-[#00F0FF]">
                      {weeklyChallengePB.wpm} WPM <span className="text-zinc-500">/</span> {weeklyChallengePB.accuracy}% ACC
                    </span>
                  ) : (
                    <span className="text-zinc-500">NO ATTEMPTS YET</span>
                  )}
                </span>
              </div>

              {/* Weekly Story Display */}
              <div className="bg-[#0B0C10]/80 p-4 rounded-[12px] border border-zinc-850 space-y-3">
                <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest block font-bold">
                  📖 THIS WEEK'S CHALLENGE STORY
                </span>

                {weeklyChallengeLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2">
                    <div className="w-8 h-8 rounded-full border-4 border-[#00F0FF]/20 border-t-[#00F0FF] animate-spin" />
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Generating story via Gemini...</span>
                  </div>
                ) : weeklyChallengeStory ? (
                  <>
                    <div className="p-3 bg-[#141419]/80 border border-zinc-900 rounded font-mono text-[11px] leading-relaxed text-zinc-300 max-h-36 overflow-y-auto whitespace-pre-wrap">
                      {weeklyChallengeStory}
                    </div>
                    <button
                      onClick={startWeeklyChallenge}
                      className="w-full py-2.5 bg-gradient-to-r from-[#00F0FF]/30 to-[#45A29E]/30 border border-[#00F0FF]/60 hover:border-[#00F0FF] hover:from-[#00F0FF]/40 hover:to-[#45A29E]/40 text-white font-mono font-black uppercase text-xs rounded-lg transition-all cursor-pointer text-center flex items-center justify-center gap-2"
                    >
                      <span>⚡</span> Enter Typing Competition
                    </button>
                  </>
                ) : (
                  <div className="py-10 flex flex-col items-center justify-center gap-3">
                    <span className="text-3xl opacity-50">📖</span>
                    <p className="text-[10px] font-mono text-zinc-500 text-center leading-relaxed">
                      Click <span className="text-[#00F0FF] font-black">"Enter Typing Competition"</span> above to load<br />this week's challenge story.
                    </p>
                  </div>
                )}
              </div>

              {/* Nickname setting & Leaderboard */}
              <div className="space-y-3 bg-[#181822]/80 p-4 rounded-[12px] border border-zinc-850">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold">
                    🥇 GLOBAL LEADERBOARD (TOP 10)
                  </span>

                  {/* Nickname Input inside Leaderboard section */}
                  <div className="flex items-center gap-1.5 bg-[#0B0C10] border border-zinc-800 px-2 py-1 rounded">
                    <span className="text-[8px] font-mono text-zinc-500 font-bold uppercase">NAME:</span>
                    <input
                      type="text"
                      maxLength={15}
                      value={username}
                      onChange={(e) => {
                        const newName = e.target.value || "You";
                        setUsername(newName);
                        localStorage.setItem("ribbon_username", newName);

                        setWeeklyLeaderboard(prev => prev.map(item => item.isUser ? { ...item, name: newName } : item));
                        const weekId = weeklyChallengeWeekId || getCurrentWeekId();
                        const key = `ribbon_weekly_leaderboard_${weekId}`;
                        const lb = getLeaderboardForWeek(weekId);
                        const userIndex = lb.findIndex((item: any) => item.isUser);
                        if (userIndex >= 0) {
                          lb[userIndex].name = newName;
                          localStorage.setItem(key, JSON.stringify(lb));
                        }
                      }}
                      className="bg-transparent border-none text-[10px] font-mono font-black text-[#00F0FF] w-20 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Leaderboard Table */}
                <div className="border border-zinc-900 rounded-lg overflow-hidden font-mono text-[9px]">
                  <div className="grid grid-cols-12 bg-zinc-950 px-3 py-1.5 text-zinc-500 font-bold uppercase border-b border-zinc-900">
                    <span className="col-span-2">RANK</span>
                    <span className="col-span-6">TYPIST</span>
                    <span className="col-span-2 text-right">WPM</span>
                    <span className="col-span-2 text-right">ACC</span>
                  </div>

                  <div className="divide-y divide-zinc-950 max-h-48 overflow-y-auto">
                    {weeklyLeaderboard.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 gap-2">
                        <span className="text-2xl">🏁</span>
                        <p className="text-[10px] font-mono text-zinc-500 text-center">
                          No entries yet this week.<br />Complete the challenge to claim your spot!
                        </p>
                      </div>
                    ) : weeklyLeaderboard.slice(0, 10).map((item, idx) => {
                      const rank = idx + 1;
                      let badge = "";
                      let badgeClass = "text-zinc-400";

                      if (rank === 1) {
                        badge = "👑 ";
                        badgeClass = "text-[#FFB800] font-black";
                      } else if (rank === 2) {
                        badge = "🥈 ";
                        badgeClass = "text-zinc-300 font-bold";
                      } else if (rank === 3) {
                        badge = "🥉 ";
                        badgeClass = "text-amber-600 font-bold";
                      }

                      return (
                        <div
                          key={idx}
                          className={`grid grid-cols-12 px-3 py-2 items-center ${item.isUser
                              ? 'bg-[#FF6B35]/10 border-y border-[#FF6B35]/30 text-white font-extrabold shadow-[inset_0_0_8px_rgba(255,107,53,0.1)]'
                              : 'text-zinc-300 hover:bg-zinc-900/20'
                            }`}
                        >
                          <span className={`col-span-2 font-black ${badgeClass}`}>
                            #{rank}
                          </span>
                          <span className="col-span-6 flex items-center gap-1 truncate">
                            <span>{badge}</span>
                            <span className={item.isUser ? "text-[#FF6B35]" : ""}>{item.name}</span>
                            {item.isUser && <span className="text-[8px] bg-[#FF6B35]/20 text-[#FF6B35] px-1 py-0.5 rounded font-black">YOU</span>}
                          </span>
                          <span className="col-span-2 text-right text-[#00F0FF] font-black">
                            {item.wpm}
                          </span>
                          <span className="col-span-2 text-right text-[#45A29E]">
                            {item.accuracy}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Past weekly achievements history */}
              <div className="bg-[#181822] p-4 rounded-[12px] border border-zinc-850 space-y-2">
                <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest block font-bold">
                  📜 PAST COMPETITION ACHIEVEMENTS
                </span>

                {(() => {
                  const historyKey = "ribbon_weekly_history";
                  const historyStr = localStorage.getItem(historyKey);
                  const weeklyHistory = historyStr ? JSON.parse(historyStr) : [];

                  if (weeklyHistory.length === 0) {
                    return (
                      <p className="text-[9px] font-mono text-zinc-500 italic text-center py-2">
                        No historical entries found. Set your personal best to start archiving.
                      </p>
                    );
                  }

                  return (
                    <div className="border border-zinc-900 rounded-lg overflow-hidden font-mono text-[8px] max-h-32 overflow-y-auto">
                      <div className="grid grid-cols-4 bg-zinc-950 px-2 py-1 text-zinc-500 font-bold uppercase border-b border-zinc-900">
                        <span>WEEK</span>
                        <span className="text-center">WPM</span>
                        <span className="text-center">RANK</span>
                        <span className="text-right">BADGE</span>
                      </div>
                      <div className="divide-y divide-zinc-950">
                        {weeklyHistory.map((item: any, idx: number) => (
                          <div key={idx} className="grid grid-cols-4 px-2 py-1.5 items-center text-zinc-300">
                            <span>{item.weekId}</span>
                            <span className="text-center text-[#00F0FF] font-bold">{item.wpm} WPM</span>
                            <span className="text-center text-zinc-400">#{item.rank} / {item.totalPlayers}</span>
                            <span className="text-right">
                              {item.badge === "Gold" && <span className="text-[#FFB800] font-black">🥇 GOLD</span>}
                              {item.badge === "Silver" && <span className="text-zinc-300 font-bold">🥈 SILVER</span>}
                              {item.badge === "Bronze" && <span className="text-amber-600 font-bold">🥉 BRONZE</span>}
                              {item.badge === "None" && <span className="text-zinc-500">PARTICIPANT</span>}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-zinc-950 border-t border-zinc-850 flex justify-end rounded-b-[16px]">
              <button
                onClick={() => {
                  setWeeklyChallengeOpen(false);
                  sfx.playClick();
                }}
                className="bg-[#00F0FF] hover:bg-[#00F0FF]/90 text-zinc-950 font-bold font-sans text-xs px-5 py-2 rounded-[10px] transition-transform active:scale-95 cursor-pointer shadow-lg shadow-[#00F0FF]/15"
              >
                Close Panel
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Custom Story & Text Creator Modal */}
      {customStoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#11131E] border border-zinc-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">✍️</span>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Custom Story & Text Creator</h3>
                  <p className="text-xs text-zinc-400 font-mono">Type or paste any custom passage to practice</p>
                </div>
              </div>
              <button
                onClick={() => setCustomStoryModalOpen(false)}
                className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1 font-bold">
                  Story Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. My Tech Article, Hindi Practice Story..."
                  value={customStoryTitle}
                  onChange={(e) => setCustomStoryTitle(e.target.value)}
                  className="w-full bg-[#0C0E14] border border-zinc-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#F59E0B]"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1 font-bold">
                  Custom Text Content
                </label>
                <textarea
                  rows={5}
                  placeholder="Paste or type your custom text here..."
                  value={customStoryContent}
                  onChange={(e) => setCustomStoryContent(e.target.value)}
                  className="w-full bg-[#0C0E14] border border-zinc-800 rounded-xl p-3.5 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-[#F59E0B] resize-none"
                />
                <div className="flex justify-between items-center mt-1 text-[10px] font-mono text-zinc-500">
                  <span>Word Count: {customStoryContent.trim() ? customStoryContent.trim().split(/\s+/).length : 0} words</span>
                  <span>Supports English & Hindi text</span>
                </div>
              </div>

              {/* Previously Saved Custom Stories */}
              {customStories.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-zinc-800/60">
                  <span className="text-[10px] font-mono text-[#F59E0B] uppercase tracking-wider block font-bold">
                    Saved Custom Stories ({customStories.length})
                  </span>
                  <div className="max-h-36 overflow-y-auto space-y-2 pr-1 scrollbar-none">
                    {customStories.map((story) => (
                      <div
                        key={story.id}
                        className="bg-[#0C0E14] border border-zinc-800/80 p-2.5 rounded-xl flex items-center justify-between hover:border-zinc-700 transition-colors"
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <h4 className="text-xs font-bold text-zinc-200 truncate">{story.name}</h4>
                          <p className="text-[10px] font-mono text-zinc-500 truncate">{story.desc}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => {
                              loadLesson(story);
                              setFreestyleMode(false);
                              setCustomStoryModalOpen(false);
                              sfx.playClick();
                            }}
                            className="bg-[#F59E0B]/20 hover:bg-[#F59E0B]/30 text-[#F59E0B] border border-[#F59E0B]/40 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer"
                          >
                            Practice 🚀
                          </button>
                          <button
                            onClick={() => handleDeleteCustomStory(story.id)}
                            className="text-zinc-600 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                            title="Delete custom story"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800/80">
              <button
                onClick={() => setCustomStoryModalOpen(false)}
                className="px-4 py-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveAndStartCustomStory(false)}
                disabled={!customStoryContent.trim()}
                className="px-4 py-2 bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border border-zinc-750 disabled:opacity-50 text-xs font-mono font-bold rounded-xl transition-all cursor-pointer"
              >
                Save for Later 💾
              </button>
              <button
                onClick={() => handleSaveAndStartCustomStory(true)}
                disabled={!customStoryContent.trim()}
                className="px-5 py-2 bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-zinc-950 disabled:opacity-50 text-xs font-mono font-extrabold rounded-xl transition-all cursor-pointer shadow-lg shadow-[#F59E0B]/15"
              >
                Start Practice 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast Notification System */}
      <ToastNotification
        toasts={toasts}
        onDismiss={(id) => setToasts(prev => prev.filter(t => t.id !== id))}
      />

      {/* 3-Step Onboarding Modal Flow */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={(res) => {
          setIsOnboardingOpen(false);
          localStorage.setItem('ribbon_onboarding_done', 'true');
          if (res?.lang === 'hindi') {
            setCurrentScript('hindi');
          }
          addToast('Welcome to Ribbon! 🎉', 'Your Google AI typing coach is active.', 'info');
        }}
        sfx={sfx}
      />
    </div>
  );
}
