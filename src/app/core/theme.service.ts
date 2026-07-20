import { Injectable, signal } from '@angular/core';
import type { ThemeMode } from './models';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly mode = signal<ThemeMode>('system');

  init(): void {
    const saved = localStorage.getItem('cves-theme') as ThemeMode | null;
    this.setMode(saved ?? 'system');
  }

  setMode(mode: ThemeMode): void {
    this.mode.set(mode);
    localStorage.setItem('cves-theme', mode);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = mode === 'system' ? (prefersDark ? 'dark' : 'light') : mode;
    document.documentElement.setAttribute('data-theme', theme);
  }
}
