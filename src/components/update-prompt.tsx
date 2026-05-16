import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';
import { subscribeNeedsRefresh, applyUpdate } from '@/utils/pwa-register';

export const UpdatePrompt: React.FC = () => {
  const [show, setShow] = useState(false);

  useEffect(() => subscribeNeedsRefresh(setShow), []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          style={{
            top: 'max(1rem, env(safe-area-inset-top))',
          }}
          className="fixed left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-2 py-2 bg-slate-900 border border-white/10 rounded-full shadow-lg shadow-black/40 backdrop-blur-xl"
        >
          <span className="px-3 text-[11px] font-bold uppercase tracking-widest text-slate-200">
            New version available
          </span>
          <button
            onClick={applyUpdate}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-black rounded-full text-[11px] font-bold uppercase tracking-widest transition-colors cursor-pointer"
          >
            <RefreshCw size={12} />
            Reload
          </button>
          <button
            onClick={() => setShow(false)}
            aria-label="Dismiss"
            className="flex items-center justify-center w-7 h-7 text-slate-400 hover:text-white cursor-pointer"
          >
            <X size={12} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
