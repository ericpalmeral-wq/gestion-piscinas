import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PiscinasService } from '../../services/piscinas.service';
import { AuthService } from '../../services/auth.service';
import { Piscina, PiscinaData } from '../../models/piscina';
import { FormularioPiscinaComponent } from '../formulario-piscina/formulario-piscina.component';
import { signal } from '@angular/core';

@Component({
  selector: 'app-lista-piscinas',
  standalone: true,
  imports: [CommonModule, FormularioPiscinaComponent, FormsModule],
  templateUrl: './lista-piscinas.component.html',
  styleUrls: ['./lista-piscinas.component.css']
})
export class ListaPiscinasComponent implements OnInit {
  private piscinasService = inject(PiscinasService);
  private authService = inject(AuthService);
  private router = inject(Router);

  piscinas = signal<Piscina[]>([]);
  mostrarModal = signal(false);
  cargando = signal(false);
  error = signal<string | null>(null);
  paginaActual = signal(0);
  terminoBuscador = signal('');
  readonly elementosPorPagina = 10;

  ngOnInit(): void {
    this.cargarPiscinas();
  }

  cargarPiscinas(): void {
    this.cargando.set(true);
    this.error.set(null);

    const usuarioActual = this.authService.obtenerUsuarioActual();
    const esAdmin = usuarioActual?.rol === 'administrador' || usuarioActual?.rol === 'gestor';
    const esTecnico = usuarioActual?.rol === 'tecnico';

    console.log('Iniciando carga de piscinas... Rol:', usuarioActual?.rol);

    // Si es técnico, obtener solo las piscinas asignadas
    const observable = esTecnico && usuarioActual
      ? this.piscinasService.obtenerPiscinasAsignadasATecnico(usuarioActual.uid)
      : this.piscinasService.obtenerPiscinas();

    observable.subscribe({
      next: (piscinas: any[]) => {
        console.log('Piscinas cargadas exitosamente:', piscinas);
        const piscinasFormateadas = piscinas.map(p => ({
          ...p,
          fechaCreacion: p.fechaCreacion instanceof Date ? p.fechaCreacion : new Date(p.fechaCreacion || Date.now()),
          ultimaLimpieza: p.ultimaLimpieza instanceof Date ? p.ultimaLimpieza : new Date(p.ultimaLimpieza || Date.now())
        }));
        this.piscinas.set(piscinasFormateadas);
        this.cargando.set(false);
      },
      error: (err: any) => {
        console.error('Error completo:', err);
        console.error('Error mensaje:', err.message);
        console.error('Error code:', err.code);
        this.error.set('Error al cargar las piscinas. Verifica la configuración de Firebase y que la colección "piscinas" exista en Firestore.');
        this.cargando.set(false);
      }
    });
  }

  abrirModal(): void {
    this.mostrarModal.set(true);
  }

  cerrarModal(): void {
    this.mostrarModal.set(false);
  }

  onPiscinaAgregada(): void {
    this.cerrarModal();
    this.cargarPiscinas();
  }

  async eliminarPiscina(id: string | undefined): Promise<void> {
    if (!id) return;
    
    if (!confirm('¿Estás seguro de que deseas eliminar esta piscina?')) {
      return;
    }

    try {
      await this.piscinasService.eliminarPiscina(id);
      this.cargarPiscinas();
    } catch (error) {
      console.error('Error al eliminar piscina:', error);
      this.error.set('Error al eliminar la piscina');
    }
  }

  verDetalle(id: string | undefined): void {
    if (id) {
      this.router.navigate(['/piscinas', id]);
    }
  }

  obtenerColorEstado(estado: string): string {
    const colores: { [key: string]: string } = {
      'abierta': '#10b981',
      'cerrada': '#6b7280'
    };
    return colores[estado] || '#6b7280';
  }

  // Filtrado
  get piscinasFiltradas(): Piscina[] {
    const termino = this.terminoBuscador().toLowerCase().trim();
    if (!termino) {
      return this.piscinas();
    }
    return this.piscinas().filter(piscina =>
      piscina.nombre.toLowerCase().includes(termino) ||
      piscina.ubicacion.toLowerCase().includes(termino)
    );
  }

  // Paginación
  get piscinasPaginadas(): Piscina[] {
    const inicio = this.paginaActual() * this.elementosPorPagina;
    const fin = inicio + this.elementosPorPagina;
    return this.piscinasFiltradas.slice(inicio, fin);
  }

  get totalPaginas(): number {
    return Math.ceil(this.piscinasFiltradas.length / this.elementosPorPagina);
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
