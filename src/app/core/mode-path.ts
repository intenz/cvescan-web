import type { ScanMode } from './models';

/** URL path for a scan mode (`/` for local). */
export function modePath(mode: ScanMode): string {
  if (mode === 'local') return '/';
  return `/${mode}`;
}
