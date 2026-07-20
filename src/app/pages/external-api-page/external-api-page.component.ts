import { Component } from '@angular/core';
import { CopyrightComponent } from '../../components/copyright/copyright.component';

@Component({
  selector: 'cves-external-api-page',
  standalone: true,
  imports: [CopyrightComponent],
  templateUrl: './external-api-page.component.html',
  styleUrl: './external-api-page.component.scss',
})
export class ExternalApiPageComponent {}
