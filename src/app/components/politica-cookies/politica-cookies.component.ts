import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-politica-cookies',
  standalone: true,
  templateUrl: './politica-cookies.component.html',
  styleUrl: './politica-cookies.component.css'
})
export class PoliticaCookiesComponent {
  private location = inject(Location);

  volver(): void {
    this.location.back();
  }
}
