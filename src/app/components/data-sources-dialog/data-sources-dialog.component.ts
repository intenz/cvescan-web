import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  output,
  viewChild,
} from '@angular/core';
import {
  DATA_SOURCES_FOOTER,
  DATA_SOURCES_INTRO,
  DATA_SOURCE_NOTICES,
} from '../../core/data-sources-license';

@Component({
  selector: 'cves-data-sources-dialog',
  standalone: true,
  templateUrl: './data-sources-dialog.component.html',
  styleUrl: './data-sources-dialog.component.scss',
})
export class DataSourcesDialogComponent {
  readonly closed = output<void>();
  readonly intro = DATA_SOURCES_INTRO;
  readonly notices = DATA_SOURCE_NOTICES;
  readonly footer = DATA_SOURCES_FOOTER;
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      this.panel()?.nativeElement.focus();
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      this.destroyRef.onDestroy(() => {
        document.body.style.overflow = prev;
      });
    });
  }

  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.closed.emit();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') this.closed.emit();
  }
}
