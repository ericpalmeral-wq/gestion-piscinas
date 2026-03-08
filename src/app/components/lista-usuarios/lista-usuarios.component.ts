import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuariosService } from '../../services/usuarios.service';
import { Usuario } from '../../models/usuario';
import { signal } from '@angular/core';
import { FormularioUsuarioComponent } from '../formulario-usuario/formulario-usuario.component';
import { FormsModule } from "@angular/forms";

@Component({
  selector: 'app-lista-usuarios',
  standalone: true,
  imports: [CommonModule, FormularioUsuarioComponent, FormsModule],
  templateUrl: './lista-usuarios.component.html',
  styleUrls: ['./lista-usuarios.component.css']
})
export class ListaUsuariosComponent implements OnInit {
  private usuariosService = inject(UsuariosService);

  usuarios = signal<Usuario[]>([]);
  cargando = signal<boolean>(true);
  mostrando = signal<boolean>(false);
  usuarioEditando = signal<Usuario | null>(null);
  paginaActual = signal(0);
  terminoBuscador = signal('');
  readonly elementosPorPagina = 10;

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.cargando.set(true);
    this.usuariosService.obtenerUsuarios().subscribe({
      next: (usuarios) => {
        this.usuarios.set(usuarios);
        this.cargando.set(false);
        
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
        this.cargando.set(false);
      }
    });
  }

  abrirFormulario(usuario?: Usuario): void {
    if (usuario) {
      this.usuarioEditando.set(usuario);
    } else {
      this.usuarioEditando.set(null);
    }
    this.mostrando.set(true);
  }

  cerrarFormulario(): void {
    this.mostrando.set(false);
    this.usuarioEditando.set(null);
  }

  onUsuarioGuardado(): void {
    this.cargarUsuarios();
    this.cerrarFormulario();
  }

  cambiarRolEvent(usuario: Usuario, event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.cambiarRol(usuario, select.value);
  }

  async cambiarRol(usuario: Usuario, nuevoRol: string): Promise<void> {
    try {
      await this.usuariosService.asignarRol(usuario.uid, nuevoRol);
      this.cargarUsuarios();
    } catch (error) {
      console.error('Error al cambiar rol:', error);
    }
  }

  formatearFecha(fechaIso: string): string {
    try {
      return new Date(fechaIso).toLocaleDateString('es-ES');
    } catch {
      return 'Fecha inválida';
    }
  }

  async cambiarEstado(usuario: Usuario): Promise<void> {
    const nuevoEstado = usuario.estado === 'activo' ? 'inactivo' : 'activo';
    try {
      await this.usuariosService.cambiarEstado(usuario.uid, nuevoEstado);
      this.cargarUsuarios();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    }
  }

  async eliminarUsuario(usuario: Usuario): Promise<void> {
    if (confirm(`¿Estás seguro de que deseas eliminar a ${usuario.nombre}?`)) {
      try {
        await this.usuariosService.eliminarUsuario(usuario.uid);
        this.cargarUsuarios();
      } catch (error) {
        console.error('Error al eliminar usuario:', error);
      }
    }
  }


  obtenerColorRol(rol: string): string {
    const colores: { [key: string]: string } = {
      'administrador': '#dc2626',
      'gestor': '#2563eb',
      'tecnico': '#7c3aed',
      'cliente': '#059669',
      'invitado': '#6b7280'
    };
    return colores[rol] || '#6b7280';
  }

  // Filtrado
  get usuariosFiltrados(): Usuario[] {
    const termino = this.terminoBuscador().toLowerCase().trim();
    if (!termino) {
      return this.usuarios();
    }
    return this.usuarios().filter(usuario =>
      usuario.email.toLowerCase().includes(termino) ||
      usuario.nombre.toLowerCase().includes(termino)
    );
  }

  // Paginación
  get usuariosPaginados(): Usuario[] {
    const inicio = this.paginaActual() * this.elementosPorPagina;
    const fin = inicio + this.elementosPorPagina;
    return this.usuariosFiltrados.slice(inicio, fin);
  }

  get totalPaginas(): number {
    return Math.ceil(this.usuariosFiltrados.length / this.elementosPorPagina);
  }

  irAPagina(numero: number): void {
    if (numero >= 0 && numero < this.totalPaginas) {
      this.paginaActual.set(numero);
    }
  }

  paginaAnterior(): void {
    if (this.paginaActual() > 0) {
      this.paginaActual.set(this.paginaActual() - 1);
    }
  }

  paginaSiguiente(): void {
    if (this.paginaActual() < this.totalPaginas - 1) {
      this.paginaActual.set(this.paginaActual() + 1);
    }
  }

  actualizarBuscador(termino: string): void {
    this.terminoBuscador.set(termino);
    this.paginaActual.set(0); // Volver a primera página al buscar
  }
}
