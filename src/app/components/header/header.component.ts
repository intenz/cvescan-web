import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import type { ScanMode } from '../../core/models';
import { SCAN_MODES, modeInfo } from '../../core/seo-content';
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
export class HeaderComponent {
  private readonly state = inject(ScanStateService);
  private readonly api = inject(ApiService);

  readonly modes = SCAN_MODES;
  readonly mode = this.state.mode;
  readonly activeMode = computed(() => modeInfo(this.mode()));

  setMode(mode: ScanMode): void {
    const info = modeInfo(mode);
    if (!info.available) return;
    this.state.setMode(mode);
    this.api.loadCommand(mode, this.state.os());
  }
}
