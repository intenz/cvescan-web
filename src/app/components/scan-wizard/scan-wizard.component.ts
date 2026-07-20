import { Component, computed, inject } from '@angular/core';
import { ScanStateService } from '../../core/scan-state.service';

@Component({
  selector: 'cves-scan-wizard',
  standalone: true,
  templateUrl: './scan-wizard.component.html',
  styleUrl: './scan-wizard.component.scss',
})
export class ScanWizardComponent {
  readonly state = inject(ScanStateService);

  readonly steps = computed(() => {
    const mode = this.state.mode();
    if (mode === 'browser') {
      return ['Enter URL', 'Scan site', 'View results'];
    }
    if (mode === 'network') {
      return ['Pick OS', 'Copy command', 'Upload .xml', 'View results'];
    }
    return ['Pick OS', 'Copy command', 'Upload .txt', 'View results'];
  });

  isDone(index: number): boolean {
    return this.state.wizardStep() > index + 1;
  }

  isCurrent(index: number): boolean {
    return this.state.wizardStep() === index + 1;
  }
}
