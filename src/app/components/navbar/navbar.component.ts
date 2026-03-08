import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Usuario } from '../../models/usuario';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  menuAbierto = false;
  menuAdminAbierto = signal<boolean>(false);
  menuUsuarioAbierto = signal<boolean>(false);
  usuarioActual = signal<Usuario | null>(null);

  ngOnInit(): void {
    // Obtener usuario actual del servicio de autenticación
    this.authService.usuarioActual$.subscribe(usuario => {
      this.usuarioActual.set(usuario);
    });
  }

  toggleMenu(): void {
    this.menuAbierto = !this.menuAbierto;
  }

  cerrarMenu(): void {
    this.menuAbierto = false;
    this.menuAdminAbierto.set(false);
    this.menuUsuarioAbierto.set(false);
  }

  toggleMenuAdmin(): void {
    this.menuAdminAbierto.update(valor => !valor);
  }

  toggleMenuUsuario(): void {
    this.menuUsuarioAbierto.update(valor => !valor);
  }

  async logout(): Promise<void> {
    try {
      await this.authService.logout();
      this.router.navigate(['/login']);
      this.cerrarMenu();
    } catch (error) {
      console.error('Error al logout:', error);
    }
  }

  esAdmin(): boolean {
    return this.usuarioActual()?.rol === 'administrador';
  }

  puedeVerAdmin(): boolean {
    return this.esAdmin();
  }

  obtenerNombreUsuario(): string {
    return this.usuarioActual()?.nombre || 'Usuario';
  }

  obtenerColorRol(): string {
    const rol = this.usuarioActual()?.rol;
    const colores: { [key: string]: string } = {
      'administrador': '#dc2626',
      'gestor': '#2563eb',
      'tecnico': '#7c3aed',
      'cliente': '#059669',
      'invitado': '#6b7280'
    };
    return colores[rol || ''] || '#6b7280';
  }
}


