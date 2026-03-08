import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListaTareasComponent } from '../lista-tareas/lista-tareas.component';

@Component({
  selector: 'app-tareas',
  standalone: true,
  imports: [CommonModule, ListaTareasComponent],
  template: `
    <app-lista-tareas></app-lista-tareas>
  `
})
export class TareasComponent {}
