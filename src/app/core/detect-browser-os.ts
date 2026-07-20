import type { ScanOs } from './models';

export const SOON_SCAN_OS = new Set<ScanOs>(['android']);

/** Available but experimental — shown with a beta badge. */
export const BETA_SCAN_OS = new Set<ScanOs>(['iphone']);

export function isScanOsAvailable(os: ScanOs): boolean {
  return !SOON_SCAN_OS.has(os);
}

/** Best-effort OS guess from the current browser environment. */
export function detectBrowserOs(): ScanOs {
  if (typeof navigator === 'undefined') return 'macos';

  const ua = navigator.userAgent;
  const platform = navigator.platform ?? '';

  if (/android/i.test(ua)) return 'android';
  if (/iphone|ipod/i.test(ua)) return 'iphone';
  if (/ipad/i.test(ua)) return 'iphone';

  if (/win/i.test(platform) || /windows/i.test(ua)) return 'windows';
  if (/mac/i.test(platform) && !/iphone|ipad|ipod/i.test(ua)) return 'macos';
  if (/linux/i.test(platform) || /linux/i.test(ua)) return 'linux';

  return 'macos';
}
