import { Component, EventEmitter, Output, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PiscinasService } from '../../services/piscinas.service';
import { UsuariosService } from '../../services/usuarios.service';
import { Piscina } from '../../models/piscina';
import { Usuario } from '../../models/usuario';

@Component({
  selector: 'app-formulario-piscina',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './formulario-piscina.component.html',
  styleUrls: ['./formulario-piscina.component.css']
})
export class FormularioPiscinaComponent implements OnInit {
  @Output() piscinaAgregada = new EventEmitter<void>();

  private piscinasService = inject(PiscinasService);
  private usuariosService = inject(UsuariosService);

  formulario = signal<Piscina>({
    nombre: '',
    ubicacion: '',
    capacidadLitros: 0,
    profundidadMaxima: 0,
    estado: 'abierta',
    fechaCreacion: new Date(),
    ultimaLimpieza: new Date(),
    fechaApertura: undefined,
    fechaCierre: undefined,
    nivelCloro: 1.5,
    pHAgua: 7.5,
    horasFiltracion: 0,
    consumoSemanal: 0,
    cif: '',
    tipo: 'comunidad',
    observaciones: '',
    tecnicosAsignados: [],
    clienteId: '',
    clienteNombre: ''
  });

  tecnicos = signal<Usuario[]>([]);
  clientes = signal<Usuario[]>([]);
  tecnicosSeleccionados = signal<string[]>([]);
  clienteSeleccionado = signal<string>('');
  guardando = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.cargarTecnicos();
    this.cargarClientes();
  }

  cargarTecnicos(): void {
    this.usuariosService.obtenerUsuarios().subscribe({
      next: (usuarios) => {
        const tecnicos = usuarios.filter(u => u.rol === 'tecnico' && u.estado === 'activo');
        this.tecnicos.set(tecnicos);
      },
      error: (error) => {
        console.error('Error al cargar técnicos:', error);
      }
    });
  }

  cargarClientes(): void {
    this.usuariosService.obtenerUsuarios().subscribe({
      next: (usuarios) => {
        const clientes = usuarios.filter(u => u.rol === 'cliente' && u.estado === 'activo');
        this.clientes.set(clientes);
      },
      error: (error) => {
        console.error('Error al cargar clientes:', error);
      }
    });
  }

  async enviarFormulario(): Promise<void> {
    if (!this.validarFormulario()) {
      return;
    }

    this.guardando.set(true);
    this.error.set(null);

    try {
      const clienteId = this.clienteSeleccionado();
      const clienteNombre = this.clientes().find(c => c.uid === clienteId)?.nombre || '';
      
      const piscinaData = {
        ...this.formulario(),
        tecnicosAsignados: this.tecnicosSeleccionados(),
        clienteId: clienteId,
        clienteNombre: clienteNombre
      };
      await this.piscinasService.agregarPiscina(piscinaData);
      this.piscinaAgregada.emit();
      this.limpiarFormulario();
    } catch (err) {
      console.error('Error al guardar piscina:', err);
      this.error.set('Error al guardar la piscina. Por favor intenta de nuevo.');
      this.guardando.set(false);
    }
  }

  validarFormulario(): boolean {
    const form = this.formulario();
    
    if (!form.nombre.trim()) {
      this.error.set('El nombre es requerido');
      return false;
    }

    if (!form.ubicacion.trim()) {
      this.error.set('La ubicación es requerida');
      return false;
    }

    return true;
  }

  limpiarFormulario(): void {
    this.formulario.set({
      nombre: '',
      ubicacion: '',
      capacidadLitros: 0,
      profundidadMaxima: 0,
      estado: 'abierta',
      fechaCreacion: new Date(),
      ultimaLimpieza: new Date(),
      fechaApertura: undefined,
      fechaCierre: undefined,
      nivelCloro: 1.5,
      pHAgua: 7.5,
      horasFiltracion: 0,
      consumoSemanal: 0,
      cif: '',
      tipo: 'comunidad',
      observaciones: '',
      tecnicosAsignados: [],
      clienteId: '',
      clienteNombre: ''
    });
    this.tecnicosSeleccionados.set([]);
    this.clienteSeleccionado.set('');
    this.guardando.set(false);
  }

  toggleTecnico(tecnicoUid: string): void {
    const seleccionados = this.tecnicosSeleccionados();
    if (seleccionados.includes(tecnicoUid)) {
      this.tecnicosSeleccionados.set(seleccionados.filter(uid => uid !== tecnicoUid));
    } else {
      this.tecnicosSeleccionados.set([...seleccionados, tecnicoUid]);
    }
  }

  esTecnicoSeleccionado(tecnicoUid: string): boolean {
    return this.tecnicosSeleccionados().includes(tecnicoUid);
  }

  actualizarFormulario(campo: string, valor: any): void {
    const form = this.formulario();
    this.formulario.set({
      ...form,
      [campo]: valor
    });
  }
}
