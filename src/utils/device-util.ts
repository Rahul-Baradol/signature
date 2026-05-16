export const isMobileDevice = (): boolean => {
  if (typeof window === "undefined") return false;

  const ua = navigator.userAgent;

  // Standard mobile devices
  if (/iPhone|iPod|Android/i.test(ua)) {
    return true;
  }

  // iPadOS desktop mode
  if (/Mac/i.test(ua) && navigator.maxTouchPoints > 1) {
    return true;
  }

  // Small touch-first devices
  if (
    window.matchMedia("(pointer: coarse) and (hover: none)").matches &&
    window.innerWidth < 1024
  ) {
    return true;
  }

  return false;
};