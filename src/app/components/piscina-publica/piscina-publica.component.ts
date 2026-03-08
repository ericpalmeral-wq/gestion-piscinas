import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PiscinasService } from '../../services/piscinas.service';
import { Piscina, PiscinaData } from '../../models/piscina';

@Component({
  selector: 'app-piscina-publica',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './piscina-publica.component.html',
  styleUrls: ['./piscina-publica.component.css']
})
export class PiscinaPublicaComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private piscinasService = inject(PiscinasService);

  piscina = signal<Piscina | null>(null);
  cargando = signal(true);
  error = signal<string | null>(null);
  Math = Math;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarPiscina(id);
    }
  }

  private cargarPiscina(id: string): void {
    this.cargando.set(true);
    this.error.set(null);

    this.piscinasService.obtenerPiscinaPorId(id).subscribe({
      next: (piscina: any) => {
        if (piscina) {
          const piscinaFormateada: Piscina = {
            ...piscina,
            fechaCreacion: piscina.fechaCreacion instanceof Date ? piscina.fechaCreacion : new Date(piscina.fechaCreacion || Date.now()),
            ultimaLimpieza: piscina.ultimaLimpieza instanceof Date ? piscina.ultimaLimpieza : new Date(piscina.ultimaLimpieza || Date.now()),
            horasFiltracion: piscina.horasFiltracion ?? 0
          };
          this.piscina.set(piscinaFormateada);
        } else {
          this.error.set('Piscina no encontrada');
        }
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('Error al cargar los detalles de la piscina');
        this.cargando.set(false);
      }
    });
  }

  obtenerColorEstado(estado: string): string {
    return estado === 'abierta' ? '#10b981' : '#6b7280';
  }

  necesitaMantenimiento(piscina: Piscina): boolean {
    const piscinaData = new PiscinaData(piscina);
    return piscinaData.necesitaMantenimiento();
  }

  formatearFecha(fecha: Date | string): string {
    if (!fecha) return 'N/A';
    const d = fecha instanceof Date ? fecha : new Date(fecha);
    return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  formatearNumero(num: number): string {
    return num.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
