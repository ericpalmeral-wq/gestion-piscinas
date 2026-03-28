import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

const COOKIE_KEY = 'gestipool_cookies_accepted';

@Component({
  selector: 'app-cookie-consent',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './cookie-consent.component.html',
  styleUrl: './cookie-consent.component.css'
})
export class CookieConsentComponent {
  visible = signal(!localStorage.getItem(COOKIE_KEY));

  aceptar(): void {
    localStorage.setItem(COOKIE_KEY, 'true');
    this.visible.set(false);
  }

  rechazar(): void {
    localStorage.setItem(COOKIE_KEY, 'false');
    this.visible.set(false);
  }
}
