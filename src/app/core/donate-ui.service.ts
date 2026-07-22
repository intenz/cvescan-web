import { Injectable, signal } from '@angular/core';

/** Opens the shared Support / donate dialog from the header. */
@Injectable({ providedIn: 'root' })
export class DonateUiService {
  readonly open = signal(false);

  show(): void {
    this.open.set(true);
  }

  hide(): void {
    this.open.set(false);
  }
}
