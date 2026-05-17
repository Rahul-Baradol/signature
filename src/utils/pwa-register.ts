import { registerSW } from 'virtual:pwa-register';

const UPDATE_POLL_INTERVAL_MS = 1000 * 60;

let needsRefresh = false;
let subscribers: Array<(value: boolean) => void> = [];
let updateSW: ((reloadPage?: boolean) => Promise<void>) | null = null;

const setNeedsRefresh = (value: boolean) => {
  needsRefresh = value;
  subscribers.forEach((cb) => cb(value));
};

export const subscribeNeedsRefresh = (cb: (value: boolean) => void) => {
  subscribers.push(cb);
  cb(needsRefresh);
  return () => {
    subscribers = subscribers.filter((s) => s !== cb);
  };
};

export const applyUpdate = () => {
  if (updateSW) updateSW(true);
};

export const setupPWA = () => {
  if (!('serviceWorker' in navigator)) return;

  updateSW = registerSW({
    onNeedRefresh() {
      setNeedsRefresh(true);
    },
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;

      const check = () => {
        if (navigator.onLine && document.visibilityState === 'visible') {
          registration.update().catch(() => {});
        }
      };

      setInterval(check, UPDATE_POLL_INTERVAL_MS);
      document.addEventListener('visibilitychange', check);
      window.addEventListener('online', check);
    },
  });
};
