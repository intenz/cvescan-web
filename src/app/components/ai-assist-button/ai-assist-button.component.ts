import { Component, computed, inject } from '@angular/core';
import { AiAssistUiService } from '../../core/ai-assist-ui.service';
import { ScanStateService } from '../../core/scan-state.service';

@Component({
  selector: 'cves-ai-assist-button',
  standalone: true,
  template: `
    <button
      type="button"
      class="cves-ai-assist-btn"
      [disabled]="!cveCount()"
      [title]="title()"
      (click)="open()"
    >
      AI Assistant
    </button>
  `,
  styles: `
    .cves-ai-assist-btn {
      flex-shrink: 0;
      margin: 0;
      padding: 0.65rem 1rem;
      border: 1px solid var(--cves-purple);
      border-radius: 6px;
      background: var(--cves-purple);
      color: #f6f0ff;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
      transition:
        border-color 0.2s ease,
        color 0.2s ease,
        background 0.2s ease,
        box-shadow 0.2s ease,
        transform 0.2s ease;

      &:hover:not(:disabled) {
        background: color-mix(in srgb, var(--cves-purple) 88%, #fff);
        box-shadow: 0 4px 14px var(--cves-purple-dim);
        transform: translateY(-1px);
      }

      &:disabled {
        cursor: not-allowed;
        opacity: 0.7;
      }
    }
  `,
})
export class AiAssistButtonComponent {
  private readonly ui = inject(AiAssistUiService);
  private readonly state = inject(ScanStateService);

  readonly cveCount = computed(() => this.state.cves().length);

  readonly title = computed(() => {
    const n = this.cveCount();
    return n
      ? `Ask about your ${n} matched CVEs / CPEs`
      : 'Scan first to ask the AI assistant';
  });

  open(): void {
    if (!this.cveCount()) return;
    this.ui.show();
  }
}
