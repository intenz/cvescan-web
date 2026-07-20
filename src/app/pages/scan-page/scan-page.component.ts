import { Component, OnInit, inject } from '@angular/core';
import { ScanWizardComponent } from '../../components/scan-wizard/scan-wizard.component';
import { OsTabsComponent } from '../../components/os-tabs/os-tabs.component';
import { CommandPanelComponent } from '../../components/command-panel/command-panel.component';
import { UploadZoneComponent } from '../../components/upload-zone/upload-zone.component';
import { CveFiltersComponent } from '../../components/cve-filters/cve-filters.component';
import { CveTableComponent } from '../../components/cve-table/cve-table.component';
import { CveSidebarComponent } from '../../components/cve-sidebar/cve-sidebar.component';
import { SelectionBarComponent } from '../../components/selection-bar/selection-bar.component';
import { CopyrightComponent } from '../../components/copyright/copyright.component';
import { ScanStateService } from '../../core/scan-state.service';
import { ApiService } from '../../core/api.service';

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
  ],
  templateUrl: './scan-page.component.html',
  styleUrl: './scan-page.component.scss',
})
export class ScanPageComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly state = inject(ScanStateService);

  ngOnInit(): void {
    this.api.loadCommand(this.state.mode(), this.state.os());
    this.api.loadCatalog();
  }

  today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
