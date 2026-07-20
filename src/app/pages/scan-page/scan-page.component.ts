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
import { SeoLandingComponent } from '../../components/seo-landing/seo-landing.component';
import { ScanStateService } from '../../core/scan-state.service';
import { ApiService } from '../../core/api.service';
import { SeoService } from '../../core/seo.service';
import {
  HOME_SEO,
  faqPageJsonLd,
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
    CveFiltersComponent,
    CveTableComponent,
    CveSidebarComponent,
    SelectionBarComponent,
    CopyrightComponent,
    SeoLandingComponent,
  ],
  templateUrl: './scan-page.component.html',
  styleUrl: './scan-page.component.scss',
})
export class ScanPageComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly seo = inject(SeoService);
  private readonly platformId = inject(PLATFORM_ID);
  readonly state = inject(ScanStateService);

  ngOnInit(): void {
    this.seo.apply({
      title: HOME_SEO.title,
      description: HOME_SEO.description,
      canonical: HOME_SEO.canonical,
      jsonLd: [softwareApplicationJsonLd(), faqPageJsonLd()],
    });
    if (!isPlatformBrowser(this.platformId)) return;
    this.api.loadCommand(this.state.mode(), this.state.os());
    this.api.loadCatalog();
  }

  today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
