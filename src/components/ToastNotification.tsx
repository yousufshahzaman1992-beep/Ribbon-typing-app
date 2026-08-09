import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Flame, Sparkles, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  title: string;
  desc: string;
  type: 'achievement' | 'levelup' | 'streak' | 'info';
}

interface ToastNotificationProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="pointer-events-auto flex items-start gap-3 bg-[#141728]/95 border border-[#6C63FF]/40 p-4 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl text-white"
          >
            <div className="p-2.5 rounded-xl bg-[#6C63FF]/20 text-[#6C63FF] shrink-0 border border-[#6C63FF]/30">
              {toast.type === 'achievement' && <Trophy className="w-5 h-5 text-[#FFD166] animate-bounce" />}
              {toast.type === 'levelup' && <Sparkles className="w-5 h-5 text-[#00D4AA] animate-pulse" />}
              {toast.type === 'streak' && <Flame className="w-5 h-5 text-[#FF4D6D] animate-bounce" />}
              {toast.type === 'info' && <Sparkles className="w-5 h-5 text-[#6C63FF]" />}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#F0F2FF]">{toast.title}</h4>
              <p className="text-[11px] text-[#8892B0] mt-0.5 leading-snug">{toast.desc}</p>
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="text-[#8892B0] hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
