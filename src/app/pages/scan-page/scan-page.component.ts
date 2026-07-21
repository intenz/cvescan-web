import { Component, OnInit, PLATFORM_ID, computed, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
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
import { ScanStateService } from '../../core/scan-state.service';
import { ApiService } from '../../core/api.service';
import { SeoService, applyPageSeo } from '../../core/seo.service';
import {
  HOME_SEO,
  howToJsonLd,
  modeInfo,
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
  private readonly platformId = inject(PLATFORM_ID);
  readonly state = inject(ScanStateService);
  readonly home = HOME_SEO;
  readonly today = new Date().toISOString().slice(0, 10);
  readonly currentModeInfo = computed(() => modeInfo(this.state.mode()));
  readonly detectedLabel = computed(() =>
    this.state
      .detectedStack()
      .map((p) => (p.version ? `${p.name} ${p.version}` : p.name))
      .join(' · '),
  );

  ngOnInit(): void {
    applyPageSeo(this.seo, HOME_SEO, [
      softwareApplicationJsonLd(),
      howToJsonLd(),
    ]);
    if (!isPlatformBrowser(this.platformId)) return;

    const restored = this.state.restorePrefs();
    const detectedOs = detectBrowserOs();
    const fallbackOs = isScanOsAvailable(detectedOs) ? detectedOs : 'macos';
    if (!restored.os) {
      // Preselect OS for tabs/command, but do not mark wizard step 1 done
      // until the user explicitly confirms by clicking an OS tab.
      this.state.os.set(fallbackOs);
    } else {
      this.state.os.set(normalizeOsForMode(this.state.mode(), this.state.os()));
    }

    this.api.loadCatalog();
  }
}
