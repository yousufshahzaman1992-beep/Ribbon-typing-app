import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Target, Globe, ArrowRight, CheckCircle2, Sparkles, X, Zap } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: (result?: { goal: string; lang: string; baselineWpm: number }) => void;
  sfx?: any;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose, sfx }) => {
  const [step, setStep] = useState<number>(1);
  const [goal, setGoal] = useState<string>('speed'); // 'speed' | 'exam' | 'hindi'
  const [lang, setLang] = useState<string>('both'); // 'english' | 'hindi' | 'both'
  
  // Step 2 baseline test state
  const testSentence = "The quick brown fox jumps over the lazy dog in record speed.";
  const [typedInput, setTypedInput] = useState<string>('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [testCompleted, setTestCompleted] = useState<boolean>(false);
  const [calculatedWpm, setCalculatedWpm] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 2) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [step]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!startTime) setStartTime(Date.now());
    setTypedInput(val);

    if (val.length >= testSentence.length) {
      const durationSeconds = (Date.now() - (startTime || Date.now())) / 1000;
      const minutes = Math.max(0.1, durationSeconds / 60);
      const wpm = Math.round((testSentence.length / 5) / minutes);
      setCalculatedWpm(wpm);
      setTestCompleted(true);
      if (sfx) sfx.playClick();
    } else {
      if (sfx) sfx.playClick(val.endsWith(' '));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-[#141728] border border-[#252A48] rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)] text-[#F0F2FF] relative overflow-hidden"
      >
        {/* Background glow accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#6C63FF]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#00D4AA]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header step counter & close */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step ? 'w-8 bg-[#6C63FF]' : s < step ? 'w-4 bg-[#00D4AA]' : 'w-4 bg-[#252A48]'
                }`}
              />
            ))}
            <span className="text-[11px] font-mono text-[#8892B0] ml-2 uppercase tracking-widest font-bold">Step {step} of 3</span>
          </div>

          <button
            onClick={() => onClose()}
            className="text-[#8892B0] hover:text-white transition-colors p-1.5 rounded-xl hover:bg-[#1E2240] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEP 1: GOAL & LANGUAGE */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6C63FF]/15 border border-[#6C63FF]/30 text-[#6C63FF] text-[10px] font-mono font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3 h-3 text-[#FFD166]" /> Ribbon Onboarding
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white">Type Faster. Think Sharper.</h2>
              <p className="text-xs text-[#8892B0] mt-1 leading-relaxed">
                AI-powered typing tutor for English &amp; हिंदी — free, forever.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-[#8892B0] uppercase tracking-wider block">What is your primary goal?</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'speed', label: 'Get Faster', icon: Zap, desc: 'Daily speed drills' },
                  { id: 'exam', label: 'Exam Prep', icon: Target, desc: 'Government tests' },
                  { id: 'hindi', label: 'Learn Hindi', icon: Globe, desc: 'Devanagari typing' }
                ].map((g) => {
                  const Icon = g.icon;
                  const isSel = goal === g.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() => setGoal(g.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-24 ${
                        isSel
                          ? 'bg-[#6C63FF]/20 border-[#6C63FF] text-white shadow-[0_0_15px_rgba(108,99,255,0.3)]'
                          : 'bg-[#1E2240]/40 border-[#252A48] text-[#8892B0] hover:border-[#6C63FF]/50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSel ? 'text-[#FFD166]' : 'text-[#8892B0]'}`} />
                      <div>
                        <div className="text-xs font-bold text-white">{g.label}</div>
                        <div className="text-[9px] text-[#8892B0]">{g.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-[#8892B0] uppercase tracking-wider block">Preferred Script</label>
              <div className="flex gap-2">
                {[
                  { id: 'english', label: '🇺🇸 English' },
                  { id: 'hindi', label: '🇮🇳 हिंदी' },
                  { id: 'both', label: '🌐 Both (Bilingual)' }
                ].map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLang(l.id)}
                    className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      lang === l.id
                        ? 'bg-[#00D4AA]/20 border-[#00D4AA] text-[#00D4AA] shadow-[0_0_12px_rgba(0,212,170,0.25)]'
                        : 'bg-[#1E2240]/40 border-[#252A48] text-[#8892B0] hover:border-[#00D4AA]/40'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-3.5 rounded-2xl bg-[#6C63FF] hover:bg-[#5B52E8] text-white font-extrabold text-sm transition-all shadow-lg shadow-[#6C63FF]/25 cursor-pointer flex items-center justify-center gap-2 group"
            >
              <span>Continue to Baseline Test</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {/* STEP 2: BASELINE SPEED TEST */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-mono text-[#00D4AA] uppercase tracking-widest font-bold block mb-1">Step 2: 30-Second Baseline Test</span>
              <h3 className="text-xl font-black text-white">Let's benchmark your initial speed!</h3>
              <p className="text-xs text-[#8892B0] mt-1">Type the sentence below to calculate your baseline WPM.</p>
            </div>

            <div className="bg-[#0D0F1A] border border-[#252A48] p-4 rounded-2xl space-y-3">
              <div className="font-mono text-sm leading-relaxed text-[#8892B0] select-none">
                {testSentence.split('').map((char, idx) => {
                  let colorClass = 'text-[#4A5070]';
                  if (idx < typedInput.length) {
                    colorClass = typedInput[idx] === char ? 'text-[#00D4AA] font-bold' : 'text-[#FF4D6D] bg-[#FF4D6D]/20 rounded';
                  }
                  return (
                    <span key={idx} className={colorClass}>
                      {char}
                    </span>
                  );
                })}
              </div>

              <input
                ref={inputRef}
                type="text"
                value={typedInput}
                onChange={handleInputChange}
                disabled={testCompleted}
                placeholder="Start typing here..."
                className="w-full bg-[#141728] border border-[#6C63FF]/50 rounded-xl px-4 py-2.5 text-sm font-mono text-white placeholder-[#4A5070] focus:outline-none focus:border-[#6C63FF] focus:ring-2 focus:ring-[#6C63FF]/30 transition-all"
              />
            </div>

            {testCompleted && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#00D4AA]/15 border border-[#00D4AA]/40 p-4 rounded-2xl flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#00D4AA]/20 flex items-center justify-center text-[#00D4AA]">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-[#8892B0] font-bold uppercase">Your Baseline WPM</div>
                    <div className="text-xl font-black text-[#00D4AA] font-mono">{calculatedWpm} WPM</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-[#00D4AA] font-bold bg-[#00D4AA]/20 px-2.5 py-1 rounded-full border border-[#00D4AA]/30">
                    Above Average! 🎉
                  </span>
                </div>
              </motion.div>
            )}

            <button
              onClick={() => setStep(3)}
              disabled={!testCompleted}
              className="w-full py-3.5 rounded-2xl bg-[#6C63FF] hover:bg-[#5B52E8] disabled:bg-[#252A48] disabled:text-[#4A5070] text-white font-extrabold text-sm transition-all shadow-lg shadow-[#6C63FF]/25 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>See AI Recommendation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 3: GOOGLE AI & SIGNUP HOOK */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6C63FF] to-[#00D4AA] mx-auto flex items-center justify-center text-white shadow-lg shadow-[#6C63FF]/30">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-2xl font-black text-white">Your AI Path is Ready!</h3>
              <p className="text-xs text-[#8892B0] max-w-xs mx-auto">
                Ribbon Google AI will adapt lessons dynamically based on your baseline score of <strong className="text-white font-mono">{calculatedWpm || 42} WPM</strong>.
              </p>
            </div>

            <div className="bg-[#0D0F1A] border border-[#252A48] p-4 rounded-2xl space-y-3">
              <div className="flex items-center gap-2.5 text-xs text-white">
                <CheckCircle2 className="w-4 h-4 text-[#00D4AA] shrink-0" />
                <span>Personalized finger weakness drills enabled</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-white">
                <CheckCircle2 className="w-4 h-4 text-[#00D4AA] shrink-0" />
                <span>Bilingual English &amp; हिंदी lesson roadmap</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-white">
                <CheckCircle2 className="w-4 h-4 text-[#00D4AA] shrink-0" />
                <span>XP progression &amp; streak shields active</span>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => onClose({ goal, lang, baselineWpm: calculatedWpm || 42 })}
                className="w-full py-3.5 rounded-2xl bg-[#6C63FF] hover:bg-[#5B52E8] text-white font-extrabold text-sm transition-all shadow-lg shadow-[#6C63FF]/30 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Start Your Journey →</span>
              </button>

              <button
                onClick={() => onClose({ goal, lang, baselineWpm: calculatedWpm || 42 })}
                className="w-full py-2.5 text-xs text-[#8892B0] hover:text-white transition-colors cursor-pointer font-bold"
              >
                Try Without Account (Saved Locally)
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
