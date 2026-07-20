import { Component, OnDestroy, inject, signal } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { ScanStateService } from '../../core/scan-state.service';
import { UPLOAD_STAGES } from '../../core/ui-motion';

@Component({
  selector: 'cves-upload-zone',
  standalone: true,
  templateUrl: './upload-zone.component.html',
  styleUrl: './upload-zone.component.scss',
})
export class UploadZoneComponent implements OnDestroy {
  private readonly api = inject(ApiService);
  readonly state = inject(ScanStateService);

  readonly busy = signal(false);
  readonly stage = signal<string>(UPLOAD_STAGES[0]);
  readonly stageIndex = signal(0);

  private stageTimer: ReturnType<typeof setInterval> | null = null;

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || this.busy()) return;

    this.startStages();
    this.api.uploadScan(file, this.state.mode(), this.state.os()).subscribe({
      next: () => this.stopStages(),
      error: () => this.stopStages(),
      complete: () => this.stopStages(),
    });
    input.value = '';
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  private startStages(): void {
    this.busy.set(true);
    this.stageIndex.set(0);
    this.stage.set(UPLOAD_STAGES[0]);
    this.clearTimer();
    this.stageTimer = setInterval(() => {
      this.stageIndex.update((i) => {
        const next = Math.min(i + 1, UPLOAD_STAGES.length - 1);
        this.stage.set(UPLOAD_STAGES[next]);
        return next;
      });
    }, 900);
  }

  private stopStages(): void {
    this.clearTimer();
    this.busy.set(false);
    this.stageIndex.set(0);
    this.stage.set(UPLOAD_STAGES[0]);
  }

  private clearTimer(): void {
    if (this.stageTimer) {
      clearInterval(this.stageTimer);
      this.stageTimer = null;
    }
  }
}
