import {
  Component,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import type { ScanMode } from '../../core/models';
import { SCAN_MODES, modeInfo } from '../../core/seo-content';
import { LIVE_FEEDS } from '../../core/ui-motion';
import { ScanStateService } from '../../core/scan-state.service';
import { ApiService } from '../../core/api.service';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';

@Component({
  selector: 'cves-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, ThemeToggleComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit, OnDestroy {
  private readonly state = inject(ScanStateService);
  private readonly api = inject(ApiService);
  private readonly platformId = inject(PLATFORM_ID);
  private feedTimer: ReturnType<typeof setInterval> | null = null;

  readonly modes = SCAN_MODES;
  readonly mode = this.state.mode;
  readonly feeds = LIVE_FEEDS;
  readonly feedIndex = signal(0);
  readonly liveLabel = computed(() => this.feeds[this.feedIndex()]);
  /** Longest feed label + buffer — letter-spacing makes ch slightly tight. */
  readonly liveSlotCh = Math.max(...LIVE_FEEDS.map((f) => f.length)) + 2;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.feedTimer = setInterval(() => {
      this.feedIndex.update((i) => (i + 1) % this.feeds.length);
    }, 2800);
  }

  ngOnDestroy(): void {
    if (this.feedTimer) clearInterval(this.feedTimer);
  }

  setMode(mode: ScanMode): void {
    const info = modeInfo(mode);
    if (!info.available) return;
    this.state.setMode(mode);
    this.api.loadCommand(mode, this.state.os());
  }
}
