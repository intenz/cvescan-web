import { Component, inject } from '@angular/core';
import type { ScanMode } from '../../core/models';
import { ScanStateService } from '../../core/scan-state.service';

@Component({
  selector: 'cves-mode-nav',
  standalone: true,
  templateUrl: './mode-nav.component.html',
  styleUrl: './mode-nav.component.scss',
})
export class ModeNavComponent {
  private readonly state = inject(ScanStateService);

  readonly mode = this.state.mode;

  setMode(mode: ScanMode): void {
    // Command reloads via scan-page effect watching mode/os.
    this.state.setMode(mode);
  }
}
