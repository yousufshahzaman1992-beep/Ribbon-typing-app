export interface KeyStat {
  attempts: number;
  errors: number;
}

export interface BigramStat {
  attempts: number;
  errors: number;
}

export interface SessionHistoryItem {
  wpm: number;
  accuracy: number;
  ts: number;
  ribbonColor?: 'black' | 'red' | 'stencil';
  script?: 'english' | 'hindi';
}

export interface LessonProgressItem {
  completed: boolean;
  bestAcc: number;
}

export interface Lesson {
  id: number;
  name: string;
  keys: string[] | null;
  desc: string;
  realWords?: boolean;
  customText?: string;
  category?: string;
}

export interface ExamIntegrity {
  tabSwitches: number;
  pasteBlocked: number;
  keyTimes: number[];
}

export interface ExamResult {
  grossWpm: number;
  netWpm: number;
  accuracy: number;
  passed: boolean;
  integrity: {
    tabSwitches: number;
    pasteBlocked: number;
    rhythmSuspicious: boolean;
  };
}

export interface ExamState {
  typedCount: number;
  correctCount: number;
  errorCount: number;
  startTime: number | null;
  durationMs: number;
  finished: boolean;
  backspaceDisabled: boolean;
  integrity: ExamIntegrity;
  result?: ExamResult;
}

export interface Story {
  id: number;
  title: string;
  author: string;
  text: string;
  wordCount: number;
}

export type TypingScript = 'english' | 'hindi';
export type ExamDuration = 5 | 10 | 15;
export type ExamPassMark = 30 | 35 | 40;
export type ExamBackspaceSetting = 'allowed' | 'disabled';
