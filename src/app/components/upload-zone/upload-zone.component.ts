import { Component, inject } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { ScanStateService } from '../../core/scan-state.service';

@Component({
  selector: 'cves-upload-zone',
  standalone: true,
  templateUrl: './upload-zone.component.html',
  styleUrl: './upload-zone.component.scss',
})
export class UploadZoneComponent {
  private readonly api = inject(ApiService);
  readonly state = inject(ScanStateService);

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.api.uploadScan(file, this.state.mode(), this.state.os()).subscribe();
    input.value = '';
  }
}
