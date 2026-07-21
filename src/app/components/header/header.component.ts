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
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import type { ScanMode } from '../../core/models';
import {
  LIVE_FEED_DEFINITIONS,
  formatFeedUpdatedAt,
  liveFeedTooltip,
} from '../../core/live-feeds';
import { SCAN_MODES, modeInfo } from '../../core/seo-content';
import { ScanStateService } from '../../core/scan-state.service';
import { ApiService } from '../../core/api.service';
import { DataSourcesUiService } from '../../core/data-sources-ui.service';
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
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly dataSources = inject(DataSourcesUiService);
  private feedTimer: ReturnType<typeof setInterval> | null = null;
  private readonly onVisibility = (): void => this.syncFeedTimer();

  readonly modes = SCAN_MODES;
  readonly mode = this.state.mode;
  readonly feedDefinitions = LIVE_FEED_DEFINITIONS;
  readonly feedIndex = signal(0);
  readonly activeFeed = computed(() => this.feedDefinitions[this.feedIndex()]);
  readonly liveLabel = computed(() => this.activeFeed().label);
  readonly liveTooltip = computed(() =>
    liveFeedTooltip(
      this.activeFeed(),
      this.state.feedLastUpdated()[this.activeFeed().id],
    ),
  );
  readonly liveUpdatedLabel = computed(() =>
    formatFeedUpdatedAt(this.state.feedLastUpdated()[this.activeFeed().id]),
  );
  /** Longest feed label + buffer — letter-spacing makes ch slightly tight. */
  readonly liveSlotCh =
    Math.max(...LIVE_FEED_DEFINITIONS.map((f) => f.label.length)) + 2;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.api.loadFeedStatus();
    document.addEventListener('visibilitychange', this.onVisibility);
    this.syncFeedTimer();
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.stopFeedTimer();
  }

  setMode(mode: ScanMode): void {
    const info = modeInfo(mode);
    if (!info.available) return;
    this.state.setMode(mode);
    // Mode UI lives on the scan page — leave FAQ / External API when switching.
    void this.router.navigateByUrl('/');
  }

  openDataSources(): void {
    this.dataSources.show();
  }

  private syncFeedTimer(): void {
    if (document.hidden) {
      this.stopFeedTimer();
      return;
    }
    if (this.feedTimer) return;
    this.feedTimer = setInterval(() => {
      this.feedIndex.update((i) => (i + 1) % this.feedDefinitions.length);
    }, 2800);
  }

  private stopFeedTimer(): void {
    if (this.feedTimer) {
      clearInterval(this.feedTimer);
      this.feedTimer = null;
    }
  }
}
