import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import type { ScanMode } from '../../core/models';
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

  readonly mode = this.state.mode;

  setMode(mode: ScanMode): void {
    this.state.setMode(mode);
    this.api.loadCommand(mode, this.state.os());
  }
}
