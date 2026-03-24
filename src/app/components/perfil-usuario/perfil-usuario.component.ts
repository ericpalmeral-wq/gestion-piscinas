import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Usuario } from '../../models/usuario';

@Component({
  selector: 'app-perfil-usuario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil-usuario.component.html',
  styleUrls: ['./perfil-usuario.component.css']
})
export class PerfilUsuarioComponent implements OnInit {
  private authService = inject(AuthService);

  usuario = signal<Usuario | null>(null);

  // Datos perfil
  nombreEditado = signal<string>('');
  guardandoPerfil = signal<boolean>(false);
  errorPerfil = signal<string>('');
  exitoPerfil = signal<string>('');

  // Cambio contraseña
  contrasenaActual = signal<string>('');
  contrasenaNueva = signal<string>('');
  contrasenaConfirmar = signal<string>('');
  guardandoContrasena = signal<boolean>(false);
  errorContrasena = signal<string>('');
  exitoContrasena = signal<string>('');

  ngOnInit(): void {
    const u = this.authService.obtenerUsuarioActual();
    this.usuario.set(u);
    this.nombreEditado.set(u?.nombre || '');
  }

  async guardarPerfil(): Promise<void> {
    const nombre = this.nombreEditado().trim();
    if (!nombre) {
      this.errorPerfil.set('El nombre no puede estar vacío.');
      return;
    }

    this.guardandoPerfil.set(true);
    this.errorPerfil.set('');
    this.exitoPerfil.set('');

    try {
      const uid = this.usuario()!.uid;
      await this.authService.actualizarPerfil(uid, nombre);
      this.usuario.set(this.authService.obtenerUsuarioActual());
      this.exitoPerfil.set('Nombre actualizado correctamente.');
    } catch (err: any) {
      this.errorPerfil.set(err.message || 'Error al actualizar el perfil.');
    } finally {
      this.guardandoPerfil.set(false);
    }
  }

  async cambiarContrasena(): Promise<void> {
    this.errorContrasena.set('');
    this.exitoContrasena.set('');

    if (!this.contrasenaActual()) {
      this.errorContrasena.set('Introduce tu contraseña actual.');
      return;
    }
    if (this.contrasenaNueva().length < 6) {
      this.errorContrasena.set('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (this.contrasenaNueva() !== this.contrasenaConfirmar()) {
      this.errorContrasena.set('Las contraseñas nuevas no coinciden.');
      return;
    }

    this.guardandoContrasena.set(true);

    try {
      await this.authService.cambiarContrasena(this.contrasenaActual(), this.contrasenaNueva());
      this.contrasenaActual.set('');
      this.contrasenaNueva.set('');
      this.contrasenaConfirmar.set('');
      this.exitoContrasena.set('Contraseña cambiada correctamente.');
    } catch (err: any) {
      const codigo = err?.code || err?.message || '';
      if (codigo.includes('wrong-password') || codigo.includes('invalid-credential')) {
        this.errorContrasena.set('La contraseña actual es incorrecta.');
      } else {
        this.errorContrasena.set(err.message || 'Error al cambiar la contraseña.');
      }
    } finally {
      this.guardandoContrasena.set(false);
    }
  }
}
