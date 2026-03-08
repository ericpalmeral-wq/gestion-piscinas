import { Component } from '@angular/core';
import { ListaInformesComponent } from '../lista-informes/lista-informes.component';

@Component({
  selector: 'app-informes',
  standalone: true,
  imports: [ListaInformesComponent],
  template: `
    <app-lista-informes></app-lista-informes>
  `
})
export class InformesComponent {}
