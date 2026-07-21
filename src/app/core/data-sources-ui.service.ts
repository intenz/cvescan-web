import { Injectable, signal } from '@angular/core';

/** Opens the shared data-sources / licenses dialog from header or footer. */
@Injectable({ providedIn: 'root' })
export class DataSourcesUiService {
  readonly open = signal(false);

  show(): void {
    this.open.set(true);
  }

  hide(): void {
    this.open.set(false);
  }
}
