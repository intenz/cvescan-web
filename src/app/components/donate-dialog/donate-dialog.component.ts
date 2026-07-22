import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  DONATE_FOOTER,
  DONATE_INTRO,
  DONATE_OPTIONS,
  type DonateCryptoOption,
  type DonatePaypalOption,
} from '../../core/donate-options';
import {
  paypalContainerId,
  renderPaypalHostedButton,
} from '../../core/paypal-hosted-button';

@Component({
  selector: 'cves-donate-dialog',
  standalone: true,
  templateUrl: './donate-dialog.component.html',
  styleUrl: './donate-dialog.component.scss',
})
export class DonateDialogComponent {
  readonly closed = output<void>();
  readonly intro = DONATE_INTRO;
  readonly options = DONATE_OPTIONS;
  readonly footer = DONATE_FOOTER;
  readonly copiedId = signal<string | null>(null);
  readonly paypalReady = signal(false);
  readonly paypalFailed = signal(false);
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly destroyRef = inject(DestroyRef);
  private copyTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    afterNextRender(() => {
      this.panel()?.nativeElement.focus();
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      this.destroyRef.onDestroy(() => {
        document.body.style.overflow = prev;
        if (this.copyTimer) clearTimeout(this.copyTimer);
      });
      void this.mountPaypal();
    });
  }

  paypalContainerId(option: DonatePaypalOption): string {
    return paypalContainerId(option.hostedButtonId);
  }

  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.closed.emit();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') this.closed.emit();
  }

  async copyAddress(option: DonateCryptoOption): Promise<void> {
    try {
      await navigator.clipboard.writeText(option.address);
      this.copiedId.set(option.id);
      if (this.copyTimer) clearTimeout(this.copyTimer);
      this.copyTimer = setTimeout(() => this.copiedId.set(null), 1600);
    } catch {
      // Clipboard can fail without permission — leave UI unchanged.
    }
  }

  private async mountPaypal(): Promise<void> {
    const option = this.options.find(
      (o): o is DonatePaypalOption => o.kind === 'paypal',
    );
    if (!option) return;
    try {
      await renderPaypalHostedButton(
        option,
        this.paypalContainerId(option),
      );
      this.paypalReady.set(true);
    } catch {
      this.paypalFailed.set(true);
    }
  }
}
