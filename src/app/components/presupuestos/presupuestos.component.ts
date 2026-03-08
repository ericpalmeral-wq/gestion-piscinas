import { Component } from '@angular/core';
import { ListaPresupuestosComponent } from '../lista-presupuestos/lista-presupuestos.component';

@Component({
  selector: 'app-presupuestos',
  standalone: true,
  imports: [ListaPresupuestosComponent],
  template: `
    <app-lista-presupuestos></app-lista-presupuestos>
  `
})
export class PresupuestosComponent {}
