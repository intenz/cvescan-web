import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  output,
  viewChild,
} from '@angular/core';
import { copyText } from '../../core/copy-text';
import type { RemediationPayload } from '../../core/models';
import {
  hasMergedCommands,
  mergeRemediationCommands,
} from '../../core/remediation-merge';
import { RemediationUiService } from '../../core/remediation-ui.service';

@Component({
  selector: 'cves-remediation-dialog',
  standalone: true,
  templateUrl: './remediation-dialog.component.html',
  styleUrl: './remediation-dialog.component.scss',
})
export class RemediationDialogComponent implements AfterViewInit {
  readonly closed = output<void>();
  readonly ui = inject(RemediationUiService);
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  copiedKey = '';

  /** Same package manager → one combined command per OS. */
  readonly merged = computed(() => mergeRemediationCommands(this.ui.items()));
  readonly showCombined = computed(
    () => this.ui.items().length > 1 && hasMergedCommands(this.merged()),
  );

  ngAfterViewInit(): void {
    this.panel()?.nativeElement.focus();
  }

  onBackdrop(ev: MouseEvent): void {
    if (ev.target === ev.currentTarget) this.closed.emit();
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.closed.emit();
  }

  async copyCmd(key: string, cmd: string | null): Promise<void> {
    if (!cmd) return;
    const ok = await copyText(cmd);
    if (!ok) return;
    this.copiedKey = key;
    window.setTimeout(() => {
      if (this.copiedKey === key) this.copiedKey = '';
    }, 1600);
  }

  patchLabel(r: RemediationPayload): string {
    if (r.patchAvailable === true) return 'update available';
    if (r.patchAvailable === false) return 'up to date';
    return 'version unknown';
  }
}
