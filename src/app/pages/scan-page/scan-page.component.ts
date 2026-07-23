import {
  Component,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { ScanWizardComponent } from '../../components/scan-wizard/scan-wizard.component';
import { OsTabsComponent } from '../../components/os-tabs/os-tabs.component';
import { CommandPanelComponent } from '../../components/command-panel/command-panel.component';
import { UploadZoneComponent } from '../../components/upload-zone/upload-zone.component';
import { CveFiltersComponent } from '../../components/cve-filters/cve-filters.component';
import { CveTableComponent } from '../../components/cve-table/cve-table.component';
import { CveSidebarComponent } from '../../components/cve-sidebar/cve-sidebar.component';
import { SelectionBarComponent } from '../../components/selection-bar/selection-bar.component';
import { SeoCrawlComponent } from '../../components/seo-crawl/seo-crawl.component';
import { SiteScanComponent } from '../../components/site-scan/site-scan.component';
import {
  detectBrowserOs,
  isScanOsAvailable,
} from '../../core/detect-browser-os';
import { normalizeOsForMode } from '../../core/normalize-os';
import type { ScanMode } from '../../core/models';
import { hasConcreteCveVersion } from '../../core/models';
import { ScanStateService } from '../../core/scan-state.service';
import { ApiService } from '../../core/api.service';
import { SeoService, applyPageSeo } from '../../core/seo.service';
import { modePath } from '../../core/mode-path';
import {
  HOME_SEO,
  howToJsonLd,
  modeInfo,
  modeSeo,
  softwareApplicationJsonLd,
} from '../../core/seo-content';

@Component({
  selector: 'cves-scan-page',
  standalone: true,
  imports: [
    ScanWizardComponent,
    OsTabsComponent,
    CommandPanelComponent,
    UploadZoneComponent,
    SiteScanComponent,
    CveFiltersComponent,
    CveTableComponent,
    CveSidebarComponent,
    SelectionBarComponent,
    SeoCrawlComponent,
  ],
  templateUrl: './scan-page.component.html',
  styleUrl: './scan-page.component.scss',
})
export class ScanPageComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly seo = inject(SeoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  readonly state = inject(ScanStateService);
  readonly home = HOME_SEO;
  readonly today = new Date().toISOString().slice(0, 10);
  readonly currentModeInfo = computed(() => modeInfo(this.state.mode()));

  readonly detectedCount = computed(
    () => this.state.detectedTotal() || this.state.detectedStack().length,
  );

  readonly detectedUnit = computed(() => {
    const mode = this.state.mode();
    return mode === 'network'
      ? 'services'
      : mode === 'browser'
        ? 'products'
        : 'apps';
  });

  /** CVEs without a concrete version (* / unknown) — soft CPE matches. */
  readonly unversionedCveCount = computed(
    () =>
      this.state.cves().filter((c) => !hasConcreteCveVersion(c.version)).length,
  );

  /** Every matched CVE is unversioned Noise — after file upload or browser site scan. */
  readonly allNoiseResults = computed(() => {
    if (!this.state.uploaded()) return false;
    const n = this.state.cves().length;
    return n > 0 && this.unversionedCveCount() === n;
  });

  /** Compact extras only (URL / IP) — no app name dump. */
  readonly detectedExtra = computed(() => {
    if (this.state.mode() !== 'browser') return '';
    const parts: string[] = [];
    const url = this.state.siteUrl()?.trim();
    if (url) parts.push(url);
    const ips = this.state.siteIps();
    if (ips.length) {
      parts.push(
        `IP ${ips[0]}${ips.length > 1 ? ` (+${ips.length - 1})` : ''}`,
      );
    }
    return parts.join(' · ');
  });

  readonly showDetectedBanner = computed(
    () =>
      this.state.detectedTotal() > 0 ||
      this.state.detectedStack().length > 0 ||
      this.state.cves().length > 0 ||
      this.state.siteIps().length > 0,
  );

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      const mode = (this.route.snapshot.data['mode'] as ScanMode) ?? 'local';
      this.applyMode(mode, false);
      return;
    }

    const restored = this.state.restorePrefs();
    const detectedOs = detectBrowserOs();
    const fallbackOs = isScanOsAvailable(detectedOs) ? detectedOs : 'macos';
    if (!restored.os) {
      this.state.os.set(fallbackOs);
    } else {
      this.state.os.set(normalizeOsForMode(this.state.mode(), this.state.os()));
    }

    this.route.data
      .pipe(
        map((d) => (d['mode'] as ScanMode) ?? 'local'),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((mode) => this.applyMode(mode, true));

    // One-time: open last mode when landing on `/` (URL becomes source of truth after).
    const routeMode = (this.route.snapshot.data['mode'] as ScanMode) ?? 'local';
    if (
      routeMode === 'local' &&
      restored.modeValue &&
      restored.modeValue !== 'local' &&
      !sessionStorage.getItem('cves-mode-redirected')
    ) {
      sessionStorage.setItem('cves-mode-redirected', '1');
      void this.router.navigateByUrl(modePath(restored.modeValue));
    }

    this.api.loadFeedStatus();
  }

  clearResults(): void {
    this.state.clearScanSession();
    this.api.loadCatalog(1);
  }

  private applyMode(mode: ScanMode, loadCatalog: boolean): void {
    const changed = this.state.enterScanMode(mode);
    this.state.os.set(normalizeOsForMode(mode, this.state.os()));
    applyPageSeo(this.seo, modeSeo(mode), [
      softwareApplicationJsonLd(),
      howToJsonLd(),
    ]);
    if (loadCatalog && (changed || this.state.isExample())) {
      this.api.loadCatalog(1);
    }
  }
}
