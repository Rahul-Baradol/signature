import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, MoreVertical, MonitorDown } from 'lucide-react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const DISMISS_KEY = 'pwa-install-dismissed';

type Platform = 'ios' | 'android' | 'desktop-chromium' | 'desktop-other';

const detectPlatform = (): Platform => {
  const ua = navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua) && !('MSStream' in window);
  if (isIos) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  // Chromium-based desktop browsers expose the install entry point in the address bar
  // @ts-expect-error chromium only
  if (window.chrome || /Edg\//.test(ua)) return 'desktop-chromium';
  return 'desktop-other';
};

export const InstallPrompt: React.FC = () => {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(DISMISS_KEY) === '1');

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    // @ts-expect-error iOS Safari only
    window.navigator.standalone === true;

  const platform = detectPlatform();

  useEffect(() => {
    if (isStandalone || dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setDeferred(null));

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [isStandalone, dismissed]);

  const handleInstall = async () => {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === 'accepted') {
        setDeferred(null);
      }
      return;
    }
    setShowHint(true);
  };

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
    setShowHint(false);
  };

  if (isStandalone || dismissed) {
    return null;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        style={{
          bottom: 'max(1rem, env(safe-area-inset-bottom))',
          right: 'max(1rem, env(safe-area-inset-right))',
        }}
        className="fixed z-40 flex items-center gap-1.5 sm:gap-2"
      >
        <motion.button
          whileHover={{ scale: 1.05, backgroundColor: 'rgba(56,189,248,0.15)' }}
          whileTap={{ scale: 0.95 }}
          onClick={handleInstall}
          aria-label="Install app"
          className="group flex items-center gap-2 p-2 sm:px-4 sm:py-2.5 bg-slate-900 border border-white/10 rounded-full text-slate-200 hover:text-white transition-colors cursor-pointer shadow-lg shadow-black/40"
        >
          <Download size={14} className="text-sky-400" />
          <span className="hidden sm:inline text-[11px] font-bold uppercase tracking-widest">Install app</span>
        </motion.button>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-slate-900 border border-white/10 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shadow-lg shadow-black/40"
        >
          <X size={12} />
        </button>
      </motion.div>

      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowHint(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm bg-[#0a1120] border border-white/10 rounded-3xl p-6 shadow-2xl"
            >
              <button
                onClick={() => setShowHint(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-white cursor-pointer"
                aria-label="Close"
              >
                <X size={16} />
              </button>
              <PlatformInstructions platform={platform} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const PlatformInstructions: React.FC<{ platform: Platform }> = ({ platform }) => {
  if (platform === 'ios') {
    return (
      <>
        <span className="inline-block text-sky-400 text-[10px] font-bold tracking-[0.3em] uppercase mb-3">
          Install on iOS
        </span>
        <h3 className="text-xl font-black text-white mb-4 leading-tight">
          Add Signature to your Home Screen
        </h3>
        <ol className="space-y-3 text-sm text-slate-400">
          <Step n={1}>
            Tap the <Share size={14} className="inline -mt-0.5 mx-1" /> Share button in Safari&apos;s toolbar.
          </Step>
          <Step n={2}>
            Scroll and tap <strong className="text-slate-200 font-semibold">Add to Home Screen</strong>.
          </Step>
          <Step n={3}>
            Tap <strong className="text-slate-200 font-semibold">Add</strong> in the top-right.
          </Step>
        </ol>
      </>
    );
  }

  if (platform === 'android') {
    return (
      <>
        <span className="inline-block text-sky-400 text-[10px] font-bold tracking-[0.3em] uppercase mb-3">
          Install on Android
        </span>
        <h3 className="text-xl font-black text-white mb-4 leading-tight">
          Add Signature to your Home Screen
        </h3>
        <ol className="space-y-3 text-sm text-slate-400">
          <Step n={1}>
            Tap the <MoreVertical size={14} className="inline -mt-0.5 mx-1" /> menu in your browser.
          </Step>
          <Step n={2}>
            Tap <strong className="text-slate-200 font-semibold">Install app</strong> or <strong className="text-slate-200 font-semibold">Add to Home Screen</strong>.
          </Step>
          <Step n={3}>
            Confirm <strong className="text-slate-200 font-semibold">Install</strong>.
          </Step>
        </ol>
      </>
    );
  }

  if (platform === 'desktop-chromium') {
    return (
      <>
        <span className="inline-block text-sky-400 text-[10px] font-bold tracking-[0.3em] uppercase mb-3">
          Install on Desktop
        </span>
        <h3 className="text-xl font-black text-white mb-4 leading-tight">
          Install Signature as an app
        </h3>
        <ol className="space-y-3 text-sm text-slate-400">
          <Step n={1}>
            Click the <MonitorDown size={14} className="inline -mt-0.5 mx-1" /> install icon at the right of the address bar.
          </Step>
          <Step n={2}>
            Or open the browser menu and choose <strong className="text-slate-200 font-semibold">Install Signature…</strong>
          </Step>
          <Step n={3}>
            Confirm <strong className="text-slate-200 font-semibold">Install</strong>.
          </Step>
        </ol>
      </>
    );
  }

  return (
    <>
      <span className="inline-block text-sky-400 text-[10px] font-bold tracking-[0.3em] uppercase mb-3">
        Install Signature
      </span>
      <h3 className="text-xl font-black text-white mb-4 leading-tight">
        Get the best experience
      </h3>
      <p className="text-sm text-slate-400 leading-relaxed">
        For one-tap launch and a fullscreen experience, open Signature in a Chromium-based browser
        (Chrome, Edge, Brave, Arc) or Safari on iOS, then use the browser&apos;s install option.
      </p>
    </>
  );
};

const Step: React.FC<{ n: number; children: React.ReactNode }> = ({ n, children }) => (
  <li className="flex items-start gap-3">
    <span className="shrink-0 w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 text-xs font-bold flex items-center justify-center">{n}</span>
    <span>{children}</span>
  </li>
);
