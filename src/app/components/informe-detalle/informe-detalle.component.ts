import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { InformesService } from '../../services/informes.service';
import { PiscinasService } from '../../services/piscinas.service';
import { Informe } from '../../models/informe';
import { LineaInforme } from '../../models/linea-informe';
import { Piscina } from '../../models/piscina';

@Component({
  selector: 'app-informe-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './informe-detalle.component.html',
  styleUrls: ['./informe-detalle.component.css']
})
export class InformeDetalleComponent implements OnInit {
  informe: Informe | null = null;
  piscinas: Piscina[] = [];
  cargando = true;
  error: string | null = null;
  esNuevo = false;
  guardando = false;

  private informesService = inject(InformesService);
  private piscinasService = inject(PiscinasService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.cargarPiscinas();
    const id = this.route.snapshot.paramMap.get('id');
    
    if (id === 'nuevo') {
      this.esNuevo = true;
      const ahora = new Date().toISOString().split('T')[0];
      this.informe = {
        piscinaId: '',
        fechaCreacion: ahora,
        fechaActualizacion: ahora,
        estadoGeneral: 'bien',
        lineas: []
      };
      this.cargando = false;
      this.cdr.markForCheck();
    } else if (id) {
      this.cargarInforme(id);
    }
  }

  cargarInforme(id: string): void {
    this.informesService.obtenerInforme(id).subscribe({
      next: (informe) => {
        if (informe) {
          this.informe = informe;
        } else {
          this.error = 'Informe no encontrado';
        }
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = 'Error al cargar el informe';
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
    if (!this.informe) return;
    
    const nuevaLinea: LineaInforme = {
      descripcion: '',
      estado: 'bien'
    };
    
    this.informe.lineas.push(nuevaLinea);
  }

  eliminarLinea(index: number): void {
    if (this.informe) {
      this.informe.lineas.splice(index, 1);
    }
  }

  guardarInforme(): void {
    if (!this.informe) return;
    
    if (!this.informe.piscinaId) {
      this.error = 'Debes seleccionar una piscina';
      return;
    }

    this.guardando = true;
    this.error = null;

    const ahora = new Date().toISOString().split('T')[0];
    const informeData = {
      ...this.informe,
      fechaActualizacion: ahora
    };

    if (this.esNuevo) {
      informeData.fechaCreacion = ahora;
      this.informesService.agregarInforme(informeData).then(() => {
        this.guardando = false;
        this.cdr.markForCheck();
        this.router.navigate(['/informes']);
      }).catch(err => {
        this.error = 'Error al guardar el informe';
        this.guardando = false;
        this.cdr.markForCheck();
      });
    } else if (this.informe.id) {
      this.informesService.actualizarInforme(this.informe.id, informeData).then(() => {
        this.guardando = false;
        this.cdr.markForCheck();
        this.router.navigate(['/informes']);
      }).catch(err => {
        this.error = 'Error al actualizar el informe';
        this.guardando = false;
        this.cdr.markForCheck();
      });
    }
  }

  volver(): void {
    this.router.navigate(['/informes']);
  }

  obtenerNombrePiscina(piscinaId: string): string {
    return this.piscinas.find(p => p.id === piscinaId)?.nombre || 'Sin especificar';
  }

  obtenerClaseEstado(estado: string): string {
    switch (estado) {
      case 'bien':
        return 'badge-bien';
      case 'regular':
        return 'badge-regular';
      case 'mal':
        return 'badge-mal';
      default:
        return 'badge-bien';
    }
  }
}
