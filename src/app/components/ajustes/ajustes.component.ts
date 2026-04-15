import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AjustesService, Ajustes } from '../../services/ajustes.service';

@Component({
  selector: 'app-ajustes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ajustes.component.html',
  styleUrls: ['./ajustes.component.css']
})
export class AjustesComponent implements OnInit {
  private ajustesService = inject(AjustesService);

  cargando = signal(true);
  guardando = signal(false);
  exito = signal(false);
  error = signal<string | null>(null);

  iva = signal<number>(21);

  ngOnInit(): void {
    this.ajustesService.obtenerAjustes().subscribe({
      next: (ajustes) => {
        this.iva.set(ajustes.iva);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
      }
    });
  }

  guardar(): void {
    if (this.iva() < 0 || this.iva() > 100) {
      this.error.set('El IVA debe estar entre 0 y 100');
      return;
    }

    this.guardando.set(true);
    this.error.set(null);
    this.exito.set(false);

    const ajustes: Ajustes = { iva: this.iva() };

    this.ajustesService.guardarAjustes(ajustes).then(() => {
      this.guardando.set(false);
      this.exito.set(true);
      setTimeout(() => this.exito.set(false), 3000);
    }).catch(() => {
      this.guardando.set(false);
      this.error.set('Error al guardar los ajustes');
    });
  }
}
