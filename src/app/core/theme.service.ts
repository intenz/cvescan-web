import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import type { ThemeMode } from './models';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  readonly mode = signal<ThemeMode>('system');

  init(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const saved = localStorage.getItem('cves-theme') as ThemeMode | null;
    this.setMode(saved ?? 'system');
  }

  setMode(mode: ThemeMode): void {
    this.mode.set(mode);
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem('cves-theme', mode);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = mode === 'system' ? (prefersDark ? 'dark' : 'light') : mode;
    this.document.documentElement.setAttribute('data-theme', theme);
  }
}
