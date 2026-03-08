import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuariosService } from '../../services/usuarios.service';
import { Usuario, UsuarioData } from '../../models/usuario';
import { signal } from '@angular/core';

@Component({
  selector: 'app-formulario-usuario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './formulario-usuario.component.html',
  styleUrls: ['./formulario-usuario.component.css']
})
export class FormularioUsuarioComponent implements OnInit {
  @Input() usuario: Usuario | null = null;
  @Output() usuarioGuardado = new EventEmitter<void>();
  @Output() cerrar = new EventEmitter<void>();

  private usuariosService = inject(UsuariosService);

  usuarioEditado = signal<Partial<Usuario>>({
    email: '',
    nombre: '',
    rol: 'cliente',
    estado: 'activo'
  });
  guardando = signal<boolean>(false);
  error = signal<string>('');

  readonly ROLES = [
    { valor: 'administrador', etiqueta: 'Administrador' },
    { valor: 'gestor', etiqueta: 'Gestor' },
    { valor: 'tecnico', etiqueta: 'Técnico' },
    { valor: 'cliente', etiqueta: 'Cliente' },
    { valor: 'invitado', etiqueta: 'Invitado' }
  ];

  ngOnInit(): void {
    if (this.usuario) {
      this.usuarioEditado.set({ ...this.usuario });
    }
  }

  async guardar(): Promise<void> {
    if (!this.validarFormulario()) {
      return;
    }

    this.guardando.set(true);
    this.error.set('');

    try {
      if (this.usuario) {
        // Actualizar usuario existente
        await this.usuariosService.actualizarUsuario(this.usuario.uid, {
          nombre: this.usuarioEditado().nombre!,
          rol: this.usuarioEditado().rol,
          estado: this.usuarioEditado().estado
        });
      } else {
        // Crear nuevo usuario
        await this.usuariosService.crearUsuario({
          email: this.usuarioEditado().email!,
          nombre: this.usuarioEditado().nombre!,
          rol: this.usuarioEditado().rol,
          estado: this.usuarioEditado().estado
        });
      }

      this.usuarioGuardado.emit();
    } catch (err) {
      console.error('Error al guardar usuario:', err);
      this.error.set('Error al guardar el usuario. Intenta nuevamente.');
    } finally {
      this.guardando.set(false);
    }
  }

  validarFormulario(): boolean {
    const usuario = this.usuarioEditado();

    if (!usuario.email || !usuario.email.trim()) {
      this.error.set('El email es requerido');
      return false;
    }

    if (!this.esEmailValido(usuario.email)) {
      this.error.set('Ingresa un email válido');
      return false;
    }

    if (!usuario.nombre || !usuario.nombre.trim()) {
      this.error.set('El nombre es requerido');
      return false;
    }

    return true;
  }

  esEmailValido(email: string): boolean {
    const expresion = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return expresion.test(email);
  }

  cancelar(): void {
    this.cerrar.emit();
  }
}
