import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { PresupuestosService } from '../../services/presupuestos.service';
import { PiscinasService } from '../../services/piscinas.service';
import { Presupuesto } from '../../models/presupuesto';
import { LineaPresupuesto } from '../../models/linea-presupuesto';
import { Piscina } from '../../models/piscina';

@Component({
  selector: 'app-presupuesto-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './presupuesto-detalle.component.html',
  styleUrls: ['./presupuesto-detalle.component.css']
})
export class PresupuestoDetalleComponent implements OnInit {
  presupuesto: Presupuesto | null = null;
  piscinas: Piscina[] = [];
  cargando = true;
  error: string | null = null;
  esNuevo = false;
  guardando = false;

  private presupuestosService = inject(PresupuestosService);
  private piscinasService = inject(PiscinasService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.cargarPiscinas();
    const id = this.route.snapshot.paramMap.get('id');
    
    if (id === 'nuevo') {
      this.esNuevo = true;
      this.presupuesto = {
        piscinaId: '',
        fechaCreacion: new Date().toISOString().split('T')[0],
        descripcion: '',
        lineas: [],
        estado: 'pendiente'
      };
      this.cargando = false;
      this.cdr.markForCheck();
    } else if (id) {
      this.cargarPresupuesto(id);
    }
  }

  cargarPresupuesto(id: string): void {
    this.presupuestosService.obtenerPresupuesto(id).subscribe({
      next: (presupuesto) => {
        if (presupuesto) {
          this.presupuesto = presupuesto;
        } else {
          this.error = 'Presupuesto no encontrado';
        }
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = 'Error al cargar el presupuesto';
        this.cargando = false;
        this.cdr.markForCheck();
      }
    });
  }

  cargarPiscinas(): void {
    this.piscinasService.obtenerPiscinas().subscribe({
      next: (piscinas) => {
        this.piscinas = piscinas;
        this.cdr.markForCheck();
      },
      error: () => {
        console.error('Error al cargar piscinas');
      }
    });
  }

  agregarLinea(): void {
    if (!this.presupuesto) return;
    
    const nuevaLinea: LineaPresupuesto = {
      descripcion: '',
      cantidad: 1,
      precioUnitario: 0,
      total: 0
    };
    
    this.presupuesto.lineas.push(nuevaLinea);
  }

  eliminarLinea(index: number): void {
    if (this.presupuesto) {
      this.presupuesto.lineas.splice(index, 1);
    }
  }

  calcularTotal(linea: LineaPresupuesto): void {
    linea.total = linea.cantidad * linea.precioUnitario;
  }

  obtenerTotalPresupuesto(): number {
    if (!this.presupuesto) return 0;
    return this.presupuesto.lineas.reduce((sum, linea) => sum + linea.total, 0);
  }

  guardarPresupuesto(): void {
    if (!this.presupuesto) return;
    
    if (!this.presupuesto.piscinaId) {
      this.error = 'Debes seleccionar una piscina';
      return;
    }
    
    if (!this.presupuesto.descripcion.trim()) {
      this.error = 'La descripción es requerida';
      return;
    }

    this.guardando = true;
    this.error = null;

    const presupuestoData = {
      ...this.presupuesto,
      fechaCreacion: this.presupuesto.fechaCreacion || new Date().toISOString()
    };

    if (this.esNuevo) {
      this.presupuestosService.agregarPresupuesto(presupuestoData).then(() => {
        this.guardando = false;
        this.cdr.markForCheck();
        this.router.navigate(['/presupuestos']);
      }).catch(err => {
        this.error = 'Error al guardar el presupuesto';
        this.guardando = false;
        this.cdr.markForCheck();
      });
    } else if (this.presupuesto.id) {
      this.presupuestosService.actualizarPresupuesto(this.presupuesto.id, presupuestoData).then(() => {
        this.guardando = false;
        this.cdr.markForCheck();
        this.router.navigate(['/presupuestos']);
      }).catch(err => {
        this.error = 'Error al actualizar el presupuesto';
        this.guardando = false;
        this.cdr.markForCheck();
      });
    }
  }

  volver(): void {
    this.router.navigate(['/presupuestos']);
  }

  obtenerNombrePiscina(piscinaId: string): string {
    return this.piscinas.find(p => p.id === piscinaId)?.nombre || 'Sin especificar';
  }
}
