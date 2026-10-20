import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TareasService } from '../../services/tareas.service';
import { PiscinasService } from '../../services/piscinas.service';
import { Tarea } from '../../models/tarea';
import { Piscina } from '../../models/piscina';

@Component({
  selector: 'app-lista-tareas-facturadas',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './lista-tareas-facturadas.component.html',
  styleUrls: ['./lista-tareas-facturadas.component.css']
})
export class ListaTareasFacturadasComponent implements OnInit {
  tareas: Tarea[] = [];
  piscinas: Piscina[] = [];
  cargando = true;
  error: string | null = null;
  paginaActual: number = 0;
  terminoBuscador: string = '';
  readonly elementosPorPagina = 10;

  private tareasService = inject(TareasService);
  private piscinasService = inject(PiscinasService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.cargarPiscinas();
    this.cargarTareasFacturadas();
  }

  cargarPiscinas(): void {
    this.piscinasService.obtenerPiscinas().subscribe({
      next: (piscinas) => {
        this.piscinas = piscinas;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al cargar piscinas:', err);
      }
    });
  }

  cargarTareasFacturadas(): void {
    this.cargando = true;
    this.error = null;
    this.tareasService.obtenerTareasFacturadas().subscribe({
      next: (tareas) => {
        this.tareas = tareas.sort((a, b) =>
          new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
        );
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = 'Error al cargar las tareas facturadas: ' + (err?.message || 'desconocido');
        this.cargando = false;
        this.cdr.markForCheck();
      }
    });
  }

  verTarea(id: string | undefined): void {
    if (id) {
      this.router.navigate(['/tareas', id], { queryParams: { modo: 'ver' } });
    }
  }

  eliminarTarea(id: string | undefined): void {
    if (id && confirm('¿Estás seguro de que deseas eliminar esta tarea facturada?')) {
      this.tareasService.eliminarTarea(id).then(() => {
        this.tareas = this.tareas.filter(t => t.id !== id);
        this.cdr.markForCheck();
      }).catch(err => console.error('Error al eliminar tarea:', err));
    }
  }

  obtenerNombrePiscina(piscinaId: string): string {
    const piscina = this.piscinas.find(p => p.id === piscinaId);
    return piscina ? piscina.nombre : 'Sin especificar';
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  obtenerClasePrioridad(prioridad: string): string {
    switch (prioridad) {
      case 'alta': return 'prioridad-alta';
      case 'media': return 'prioridad-media';
      case 'baja': return 'prioridad-baja';
      default: return 'prioridad-media';
    }
  }

  get tareasFiltradas(): Tarea[] {
    const termino = this.terminoBuscador.toLowerCase().trim();
    if (!termino) return this.tareas;
    return this.tareas.filter(tarea =>
      tarea.descripcion.toLowerCase().includes(termino) ||
      this.obtenerNombrePiscina(tarea.piscinaId).toLowerCase().includes(termino)
    );
  }

  get tareasPaginadas(): Tarea[] {
    const inicio = this.paginaActual * this.elementosPorPagina;
    return this.tareasFiltradas.slice(inicio, inicio + this.elementosPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.tareasFiltradas.length / this.elementosPorPagina);
  }

  paginaAnterior(): void {
    if (this.paginaActual > 0) this.paginaActual--;
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas - 1) this.paginaActual++;
  }

  actualizarBuscador(termino: string): void {
    this.terminoBuscador = termino;
    this.paginaActual = 0;
  }
}
