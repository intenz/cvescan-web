import { Component } from '@angular/core';

@Component({
  selector: 'cves-scan-wizard',
  standalone: true,
  templateUrl: './scan-wizard.component.html',
  styleUrl: './scan-wizard.component.scss',
})
export class ScanWizardComponent {
  readonly steps = [
    'Pick OS',
    'Copy command',
    'Upload .txt',
    'View results',
  ];
}
