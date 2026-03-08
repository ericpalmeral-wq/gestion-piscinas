import { Injectable, inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot
} from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  private authService = inject(AuthService);
  private router = inject(Router);

  puedeActivar(): boolean {
    if (this.authService.estaAutenticado()) {
      return true;
    }
    this.router.navigate(['/login']);
    return false;
  }
}

export const requiereAutenticacion: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authGuard = inject(AuthGuard);
  return authGuard.puedeActivar();
};
