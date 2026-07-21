import type { ScanMode, ScanOs } from './models';

/** Mobile OS tabs exist only in Local Programs — coerce elsewhere to macos. */
export function normalizeOsForMode(mode: ScanMode, os: ScanOs): ScanOs {
  if (mode !== 'local' && (os === 'iphone' || os === 'android')) {
    return 'macos';
  }
  return os;
}
