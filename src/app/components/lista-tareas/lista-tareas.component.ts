import { Component, OnInit, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TareasService } from '../../services/tareas.service';
import { PiscinasService } from '../../services/piscinas.service';
import { Tarea } from '../../models/tarea';
import { Piscina } from '../../models/piscina';

@Component({
  selector: 'app-lista-tareas',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './lista-tareas.component.html',
  styleUrls: ['./lista-tareas.component.css']
})
export class ListaTareasComponent implements OnInit {
  tareas: Tarea[] = [];
  piscinas: Piscina[] = [];
  cargando = true;
  error: string | null = null;
  paginaActual: number = 0;
  terminoBuscador: string = '';
  readonly elementosPorPagina = 10;

  // Modal
  mostrarModal = false;
  guardandoTarea = false;
  errorModal = '';
  enviado = false;
  nuevaTarea: Tarea = this.crearTareaVacia();

  // Modal Resolución
  mostrarModalResolucion = false;
  tareaACompletar: Tarea | null = null;
  resolucionTexto = '';
  guardandoResolucion = false;

  estados = [
    { valor: 'pendiente', etiqueta: 'Pendiente' },
    { valor: 'en progreso', etiqueta: 'En Progreso' },
    { valor: 'completada', etiqueta: 'Completada' }
  ];

  prioridades = [
    { valor: 'baja', etiqueta: 'Baja' },
    { valor: 'media', etiqueta: 'Media' },
    { valor: 'alta', etiqueta: 'Alta' }
  ];

  private tareasService = inject(TareasService);
  private piscinasService = inject(PiscinasService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  ngOnInit(): void {
    this.cargarPiscinas();
    this.cargarTareas();
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

  cargarTareas(): void {
    this.cargando = true;
    this.error = null;
    this.tareasService.obtenerTodasLasTareas().subscribe({
      next: (tareas) => {
        this.tareas = tareas.sort((a, b) => 
          new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
        );
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = 'Error al cargar las tareas: ' + (err?.message || 'desconocido');
        this.cargando = false;
        this.cdr.markForCheck();
      }
    });
  }

  verTarea(id: string | undefined): void {
    if (id) {
      this.router.navigate(['/tareas', id]);
    }
  }

  eliminarTarea(id: string | undefined): void {
    if (id && confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
      this.tareasService.eliminarTarea(id).then(() => {
        this.cargarTareas();
      });
    }
  }

  cambiarEstado(tarea: Tarea, event: Event): void {
    event.stopPropagation();
    if (!tarea.id) return;

    const estadosSiguientes: { [key: string]: 'pendiente' | 'en progreso' | 'completada' } = {
      'pendiente': 'en progreso',
      'en progreso': 'completada',
      'completada': 'pendiente'
    };

    const nuevoEstado = estadosSiguientes[tarea.estado];
    
    // Si va a pasar a completada, mostrar confirmación y modal de resolución
    if (nuevoEstado === 'completada') {
      if (confirm('¿Estás seguro de que deseas completar esta tarea?')) {
        this.tareaACompletar = tarea;
        this.resolucionTexto = tarea.resolucion || '';
        this.mostrarModalResolucion = true;
      }
      return;
    }
    
    this.tareasService.actualizarTarea(tarea.id, { estado: nuevoEstado }).then(() => {
      this.ngZone.run(() => {
        tarea.estado = nuevoEstado;
      });
    }).catch((err) => {
      console.error('Error al actualizar estado:', err);
    });
  }

  cerrarModalResolucion(): void {
    this.mostrarModalResolucion = false;
    this.tareaACompletar = null;
    this.resolucionTexto = '';
  }

  guardarResolucion(): void {
    if (!this.tareaACompletar?.id) return;
    
    this.guardandoResolucion = true;
    const tareaRef = this.tareaACompletar;
    const resolucion = this.resolucionTexto;
    const fechaCompletada = new Date().toISOString().split('T')[0];
    
    this.tareasService.actualizarTarea(tareaRef.id!, { 
      estado: 'completada',
      resolucion: resolucion,
      fechaVencimiento: fechaCompletada
    }).then(() => {
      this.ngZone.run(() => {
        tareaRef.estado = 'completada';
        tareaRef.resolucion = resolucion;
        tareaRef.fechaVencimiento = fechaCompletada;
        this.guardandoResolucion = false;
        this.cerrarModalResolucion();
      });
    }).catch((err) => {
      this.ngZone.run(() => {
        console.error('Error al guardar resolución:', err);
        this.guardandoResolucion = false;
        this.cerrarModalResolucion();
        alert('Error al completar la tarea. Verifica que estés autenticado.');
      });
    });
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  obtenerClaseEstado(estado: string): string {
    switch (estado) {
      case 'completada':
        return 'estado-completada';
      case 'en progreso':
        return 'estado-en-progreso';
      case 'pendiente':
        return 'estado-pendiente';
      default:
        return 'estado-pendiente';
    }
  }

  obtenerClasePrioridad(prioridad: string): string {
    switch (prioridad) {
      case 'alta':
        return 'prioridad-alta';
      case 'media':
        return 'prioridad-media';
      case 'baja':
        return 'prioridad-baja';
      default:
        return 'prioridad-media';
    }
  }

  obtenerNombrePiscina(piscinaId: string): string {
    const piscina = this.piscinas.find(p => p.id === piscinaId);
    return piscina ? piscina.nombre : 'Sin especificar';
  }

  crearNuevaTarea(): void {
    this.nuevaTarea = this.crearTareaVacia();
    this.errorModal = '';
    this.enviado = false;
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.errorModal = '';
    this.enviado = false;
  }

  crearTareaVacia(): Tarea {
    return {
      piscinaId: '',
      descripcion: '',
      estado: 'pendiente',
      prioridad: 'media',
      fechaCreacion: new Date().toISOString(),
      fechaVencimiento: new Date().toISOString().split('T')[0],
      responsable: ''
    };
  }

  validarFormulario(): boolean {
    if (!this.nuevaTarea.piscinaId.trim()) {
      this.errorModal = 'Por favor selecciona una piscina';
      return false;
    }
    if (!this.nuevaTarea.descripcion.trim()) {
      this.errorModal = 'Por favor ingresa una descripción';
      return false;
    }
    if (!this.nuevaTarea.fechaVencimiento) {
      this.errorModal = 'Por favor selecciona una fecha de vencimiento';
      return false;
    }
    return true;
  }

  guardarNuevaTarea(): void {
    this.enviado = true;
    if (!this.validarFormulario()) {
      return;
    }

    this.guardandoTarea = true;
    this.errorModal = '';

    this.tareasService.agregarTarea(this.nuevaTarea).then(() => {
      this.guardandoTarea = false;
      this.cerrarModal();
      this.cargarTareas();
      this.cdr.markForCheck();
    }).catch((err) => {
      console.error('Error creando tarea:', err);
      this.errorModal = 'Error al crear la tarea. Por favor, intenta de nuevo.';
      this.guardandoTarea = false;
      this.cdr.markForCheck();
    });
  }

  // Filtrado
  get tareasFiltradas(): Tarea[] {
    const termino = this.terminoBuscador.toLowerCase().trim();
    if (!termino) {
      return this.tareas;
    }
    return this.tareas.filter(tarea =>
      tarea.descripcion.toLowerCase().includes(termino) ||
      this.obtenerNombrePiscina(tarea.piscinaId).toLowerCase().includes(termino)
    );
  }

  // Paginación
  get tareasPaginadas(): Tarea[] {
    const inicio = this.paginaActual * this.elementosPorPagina;
    const fin = inicio + this.elementosPorPagina;
    return this.tareasFiltradas.slice(inicio, fin);
  }

  get totalPaginas(): number {
    return Math.ceil(this.tareasFiltradas.length / this.elementosPorPagina);
  }

  irAPagina(numero: number): void {
    if (numero >= 0 && numero < this.totalPaginas) {
      this.paginaActual = numero;
    }
  }

  paginaAnterior(): void {
    if (this.paginaActual > 0) {
      this.paginaActual--;
    }
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas - 1) {
      this.paginaActual++;
    }
  }

  actualizarBuscador(termino: string): void {
    this.terminoBuscador = termino;
    this.paginaActual = 0; // Volver a primera página al buscar
  }
}
