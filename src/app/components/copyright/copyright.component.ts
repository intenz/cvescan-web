import { Component } from '@angular/core';

@Component({
  selector: 'cves-copyright',
  standalone: true,
  templateUrl: './copyright.component.html',
  styleUrl: './copyright.component.scss',
})
export class CopyrightComponent {
  readonly year = 2026;
}
