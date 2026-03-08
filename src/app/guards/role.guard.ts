import { Injectable, inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot
} from '@angular/router';
import { UsuariosService } from '../services/usuarios.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard {
  private usuariosService = inject(UsuariosService);
  private router = inject(Router);
  private usuarioActualUid: string | null = null;

  setUsuarioActual(uid: string): void {
    this.usuarioActualUid = uid;
  }

  clearUsuarioActual(): void {
    this.usuarioActualUid = null;
  }

  async tieneRol(rolesRequeridos: string[]): Promise<boolean> {
    if (!this.usuarioActualUid) {
      return false;
    }

    try {
      const usuario = await firstValueFrom(
        this.usuariosService.obtenerUsuarioPorId(this.usuarioActualUid)
      );

      if (!usuario) {
        return false;
      }

      return rolesRequeridos.includes(usuario.rol);
    } catch {
      return false;
    }
  }
}

export const soloAdministrador: CanActivateFn = async (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const roleGuard = inject(RoleGuard);
  const router = inject(Router);

  const tieneAcceso = await roleGuard.tieneRol(['administrador']);
  if (!tieneAcceso) {
    router.navigate(['/piscinas']);
    return false;
  }
  return true;
};

export const soloGestorAdministrador: CanActivateFn = async (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const roleGuard = inject(RoleGuard);
  const router = inject(Router);

  const tieneAcceso = await roleGuard.tieneRol(['gestor', 'administrador']);
  if (!tieneAcceso) {
    router.navigate(['/piscinas']);
    return false;
  }
  return true;
};

export const soloTecnico: CanActivateFn = async (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const roleGuard = inject(RoleGuard);
  const router = inject(Router);

  const tieneAcceso = await roleGuard.tieneRol([
    'tecnico',
    'gestor',
    'administrador'
  ]);
  if (!tieneAcceso) {
    router.navigate(['/piscinas']);
    return false;
  }
  return true;
};

export const noInvitado: CanActivateFn = async (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const roleGuard = inject(RoleGuard);
  const router = inject(Router);

  const tieneAcceso = await roleGuard.tieneRol([
    'cliente',
    'tecnico',
    'gestor',
    'administrador'
  ]);
  if (!tieneAcceso) {
    router.navigate(['/']);
    return false;
  }
  return true;
};
