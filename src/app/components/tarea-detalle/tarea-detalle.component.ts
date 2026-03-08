import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Tarea } from '../../models/tarea';
import { Piscina } from '../../models/piscina';
import { TareasService } from '../../services/tareas.service';
import { PiscinasService } from '../../services/piscinas.service';

@Component({
  selector: 'app-tarea-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './tarea-detalle.component.html',
  styleUrls: ['./tarea-detalle.component.css']
})
export class TareaDetalleComponent implements OnInit {
  tarea: Tarea = {
    piscinaId: '',
    descripcion: '',
    estado: 'pendiente',
    prioridad: 'media',
    fechaCreacion: new Date().toISOString(),
    fechaVencimiento: new Date().toISOString(),
    responsable: '',
    id: ''
  };

  piscinas: Piscina[] = [];
  cargando = false;
  guardando = false;
  error = '';
  esEdicion = false;
  tareaId: string | null = null;
  enviado = false;

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

  constructor(
    private tareasService: TareasService,
    private piscinasService: PiscinasService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarPiscinas();
    this.tareaId = this.route.snapshot.paramMap.get('id');
    
    if (this.tareaId && this.tareaId !== 'nuevo') {
      this.cargarTarea(this.tareaId);
      this.esEdicion = true;
    }
        
        // Preseleccionar piscina si viene en query params
        const piscinaIdParam = this.route.snapshot.queryParamMap.get('piscinaId');
        if (piscinaIdParam && (!this.tareaId || this.tareaId === 'nuevo')) {
          this.tarea.piscinaId = piscinaIdParam;
        }
  }

  cargarPiscinas(): void {
    this.cargando = true;
    this.piscinasService.obtenerPiscinas().subscribe({
      next: (piscinas: any[]) => {
        this.piscinas = piscinas;
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        console.error('Error cargando piscinas:', err);
        this.error = 'Error al cargar las piscinas';
        this.cargando = false;
        this.cdr.markForCheck();
      }
    });
  }

  cargarTarea(id: string): void {
    this.tareasService.obtenerTarea(id).subscribe({
      next: (tarea) => {
        if (tarea) {
          this.tarea = tarea;
          // Convertir fechas string a formato apropiado si es necesario
          if (typeof this.tarea.fechaVencimiento === 'string') {
            // Extraer solo la fecha en formato YYYY-MM-DD para input[type="date"]
            this.tarea.fechaVencimiento = this.tarea.fechaVencimiento.includes('T') 
              ? this.tarea.fechaVencimiento.split('T')[0] 
              : this.tarea.fechaVencimiento;
          }
          this.cargando = false;
          this.cdr.markForCheck();
        }
      },
      error: (err: any) => {
        console.error('Error cargando tarea:', err);
        this.error = 'Error al cargar la tarea';
        this.cargando = false;
        this.cdr.markForCheck();
      }
    });
  }

  guardarTarea(): void {
    this.enviado = true;

    if (!this.validarFormulario()) {
      return;
    }

    this.guardando = true;
    this.error = '';

    if (this.esEdicion && this.tareaId) {
      this.tareasService.actualizarTarea(this.tareaId, this.tarea).then(() => {
        this.guardando = false;
        this.router.navigate(['/tareas']);
        this.cdr.markForCheck();
      }).catch((err) => {
        console.error('Error actualizando tarea:', err);
        this.error = 'Error al actualizar la tarea. Por favor, intenta de nuevo.';
        this.guardando = false;
        this.cdr.markForCheck();
      });
    } else {
      this.tareasService.agregarTarea(this.tarea).then(() => {
        this.guardando = false;
        this.router.navigate(['/tareas']);
        this.cdr.markForCheck();
      }).catch((err) => {
        console.error('Error creando tarea:', err);
        this.error = 'Error al crear la tarea. Por favor, intenta de nuevo.';
        this.guardando = false;
        this.cdr.markForCheck();
      });
    }
  }

  validarFormulario(): boolean {
    if (!this.tarea.piscinaId.trim()) {
      this.error = 'Por favor selecciona una piscina';
      return false;
    }

    if (!this.tarea.descripcion.trim()) {
      this.error = 'Por favor ingresa una descripción';
      return false;
    }

    if (!this.tarea.estado) {
      this.error = 'Por favor selecciona un estado';
      return false;
    }

    if (!this.tarea.prioridad) {
      this.error = 'Por favor selecciona una prioridad';
      return false;
    }

    if (!this.tarea.fechaVencimiento) {
      this.error = 'Por favor selecciona una fecha de vencimiento';
      return false;
    }

    return true;
  }

  cancelar(): void {
    this.router.navigate(['/tareas']);
  }

  obtenerNombrePiscina(piscinaId: string): string {
    const piscina = this.piscinas.find(p => p.id === piscinaId);
    return piscina ? piscina.nombre : '';
  }

  formatearFecha(date: string): string {
    if (!date) return '';
    if (typeof date === 'string') {
      return date.split('T')[0];
    }
    return new Date(date).toISOString().split('T')[0];
  }
}
