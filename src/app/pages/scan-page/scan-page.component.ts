import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ScanWizardComponent } from '../../components/scan-wizard/scan-wizard.component';
import { OsTabsComponent } from '../../components/os-tabs/os-tabs.component';
import { CommandPanelComponent } from '../../components/command-panel/command-panel.component';
import { UploadZoneComponent } from '../../components/upload-zone/upload-zone.component';
import { CveFiltersComponent } from '../../components/cve-filters/cve-filters.component';
import { CveTableComponent } from '../../components/cve-table/cve-table.component';
import { CveSidebarComponent } from '../../components/cve-sidebar/cve-sidebar.component';
import { SelectionBarComponent } from '../../components/selection-bar/selection-bar.component';
import { CopyrightComponent } from '../../components/copyright/copyright.component';
import { SeoCrawlComponent } from '../../components/seo-crawl/seo-crawl.component';
import { SiteScanComponent } from '../../components/site-scan/site-scan.component';
import {
  detectBrowserOs,
  isScanOsAvailable,
} from '../../core/detect-browser-os';
import { ScanStateService } from '../../core/scan-state.service';
import { ApiService } from '../../core/api.service';
import { SeoService } from '../../core/seo.service';
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
    CopyrightComponent,
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
  readonly modeInfo = modeInfo;

  ngOnInit(): void {
    this.seo.apply({
      title: HOME_SEO.title,
      description: HOME_SEO.description,
      canonical: HOME_SEO.canonical,
      jsonLd: [softwareApplicationJsonLd(), howToJsonLd()],
    });
    if (!isPlatformBrowser(this.platformId)) return;

    const restored = this.state.restorePrefs();
    const detectedOs = detectBrowserOs();
    const fallbackOs = isScanOsAvailable(detectedOs) ? detectedOs : 'macos';
    if (!restored.os) {
      // Preselect OS for tabs/command, but do not mark wizard step 1 done
      // until the user explicitly confirms by clicking an OS tab.
      this.state.os.set(fallbackOs);
    } else if (
      this.state.mode() !== 'local' &&
      (this.state.os() === 'iphone' || this.state.os() === 'android')
    ) {
      this.state.os.set('macos');
    }

    this.api.loadCatalog();
  }

  today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  detectedLabel(): string {
    return this.state
      .detectedStack()
      .map((p) => (p.version ? `${p.name} ${p.version}` : p.name))
      .join(' · ');
  }
}
