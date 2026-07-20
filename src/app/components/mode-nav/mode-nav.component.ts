import { Component, inject } from '@angular/core';
import type { ScanMode } from '../../core/models';
import { ScanStateService } from '../../core/scan-state.service';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'cves-mode-nav',
  standalone: true,
  templateUrl: './mode-nav.component.html',
  styleUrl: './mode-nav.component.scss',
})
export class ModeNavComponent {
  private readonly state = inject(ScanStateService);
  private readonly api = inject(ApiService);

  readonly mode = this.state.mode;

  setMode(mode: ScanMode): void {
    this.state.setMode(mode);
    this.api.loadCommand(mode, this.state.os());
  }
}
