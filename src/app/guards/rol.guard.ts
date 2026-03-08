import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard que restringe el acceso según el rol del usuario.
 * - administrador: acceso total
 * - gestor, tecnico, cliente: solo inicio (/)
 * - invitado / no registrado: solo detalle de piscina (/piscinas/:id)
 *
 * Uso: canActivate: [requiereRol('administrador')]
 *      canActivate: [requiereRol('administrador', 'gestor', 'tecnico', 'cliente')]
 */
export function requiereRol(...rolesPermitidos: string[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const usuario = authService.obtenerUsuarioActual();

    if (!usuario) {
      router.navigate(['/login']);
      return false;
    }

    if (rolesPermitidos.includes(usuario.rol)) {
      return true;
    }

    // Si no tiene permiso, redirigir al inicio
    router.navigate(['/']);
    return false;
  };
}
