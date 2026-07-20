import { Component, inject } from '@angular/core';
import type { ThemeMode } from '../../core/models';
import { ThemeService } from '../../core/theme.service';

@Component({
  selector: 'cves-theme-toggle',
  standalone: true,
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.scss',
})
export class ThemeToggleComponent {
  readonly theme = inject(ThemeService);
  readonly modes: ThemeMode[] = ['dark', 'light', 'system'];

  label(mode: ThemeMode): string {
    return mode[0].toUpperCase() + mode.slice(1);
  }
}
