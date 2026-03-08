import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LibrosService } from '../../services/libros.service';
import { PiscinasService } from '../../services/piscinas.service';
import { AuthService } from '../../services/auth.service';
import { 
  Libro, 
  crearLibroVacio,
  ControlDiarioAgua,
  ControlAirePiscinaCubierta,
  ControlPeriodicoAgua,
  Incidencia,
  TratamientoAgua,
  MantenimientoInstalacion,
  DatoVaso
} from '../../models/libro';
import { Piscina } from '../../models/piscina';
import { Usuario } from '../../models/usuario';

@Component({
  selector: 'app-libro-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './libro-detalle.component.html',
  styleUrls: ['./libro-detalle.component.css']
})
export class LibroDetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private librosService = inject(LibrosService);
  private piscinasService = inject(PiscinasService);
  private authService = inject(AuthService);

  libro = signal<Libro | null>(null);
  piscina = signal<Piscina | null>(null);
  usuarioActual = signal<Usuario | null>(null);
  cargando = signal(true);
  guardando = signal(false);
  error = signal<string | null>(null);
  exito = signal<string | null>(null);

  // Pestaña activa
  tabActiva = signal<string>('identificacion');

  // Modales
  mostrarModalVaso = signal(false);
  mostrarModalControlDiario = signal(false);
  mostrarModalControlAire = signal(false);
  mostrarModalControlPeriodico = signal(false);
  mostrarModalIncidencia = signal(false);
  mostrarModalTratamiento = signal(false);
  mostrarModalMantenimiento = signal(false);

  // Formularios temporales
  nuevoVaso: DatoVaso = this.crearVasoVacio();
  nuevoControlDiario: ControlDiarioAgua = this.crearControlDiarioVacio();
  nuevoControlAire: ControlAirePiscinaCubierta = this.crearControlAireVacio();
  nuevoControlPeriodico: ControlPeriodicoAgua = this.crearControlPeriodicoVacio();
  nuevaIncidencia: Incidencia = this.crearIncidenciaVacia();
  nuevoTratamiento: TratamientoAgua = this.crearTratamientoVacio();
  nuevoMantenimiento: MantenimientoInstalacion = this.crearMantenimientoVacio();

  piscinaId: string = '';

  ngOnInit(): void {
    this.usuarioActual.set(this.authService.obtenerUsuarioActual());
    this.piscinaId = this.route.snapshot.paramMap.get('piscinaId') || '';
    
    if (this.piscinaId) {
      this.cargarDatos();
    } else {
      this.error.set('ID de piscina no válido');
      this.cargando.set(false);
    }
  }

  async cargarDatos(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);

    try {
      // Cargar piscina
      this.piscinasService.obtenerPiscinaPorId(this.piscinaId).subscribe({
        next: (piscina) => {
          this.piscina.set(piscina);
        },
        error: (err) => {
          console.error('Error cargando piscina:', err);
        }
      });

      // Cargar o crear libro
      this.librosService.obtenerLibroPorPiscina(this.piscinaId).subscribe({
        next: async (libro) => {
          if (libro) {
            this.libro.set(libro);
          } else {
            // Crear libro nuevo
            const libroId = await this.librosService.crearLibro(this.piscinaId);
            this.librosService.obtenerLibroPorId(libroId).subscribe({
              next: (nuevoLibro) => {
                this.libro.set(nuevoLibro);
              }
            });
          }
          this.cargando.set(false);
        },
        error: (err) => {
          console.error('Error cargando libro:', err);
          this.error.set('Error al cargar el libro');
          this.cargando.set(false);
        }
      });
    } catch (err) {
      console.error('Error:', err);
      this.error.set('Error al cargar los datos');
      this.cargando.set(false);
    }
  }

  cambiarTab(tab: string): void {
    this.tabActiva.set(tab);
  }

  puedeEditar(): boolean {
    const rol = this.usuarioActual()?.rol;
    return rol === 'administrador' || rol === 'tecnico';
  }

  // ===== Guardar identificación =====
  async guardarIdentificacion(): Promise<void> {
    if (!this.libro()?.id) return;
    
    this.guardando.set(true);
    try {
      await this.librosService.actualizarLibro(this.libro()!.id!, {
        identificacionPiscina: this.libro()!.identificacionPiscina
      });
      this.mostrarExito('Identificación guardada correctamente');
    } catch (err) {
      this.error.set('Error al guardar');
    } finally {
      this.guardando.set(false);
    }
  }

  // ===== Guardar resumen SILOE =====
  async guardarResumenSILOE(): Promise<void> {
    if (!this.libro()?.id) return;
    
    this.guardando.set(true);
    try {
      await this.librosService.actualizarLibro(this.libro()!.id!, {
        resumenAnualSILOE: this.libro()!.resumenAnualSILOE
      });
      this.mostrarExito('Resumen SILOE guardado correctamente');
    } catch (err) {
      this.error.set('Error al guardar');
    } finally {
      this.guardando.set(false);
    }
  }

  // ===== VASOS =====
  abrirModalVaso(): void {
    this.nuevoVaso = this.crearVasoVacio();
    this.mostrarModalVaso.set(true);
  }

  cerrarModalVaso(): void {
    this.mostrarModalVaso.set(false);
  }

  async guardarVaso(): Promise<void> {
    if (!this.libro()?.id || !this.nuevoVaso.idVaso) return;
    
    this.guardando.set(true);
    try {
      await this.librosService.agregarVaso(this.libro()!.id!, this.nuevoVaso);
      await this.recargarLibro();
      this.cerrarModalVaso();
      this.mostrarExito('Vaso agregado correctamente');
    } catch (err) {
      this.error.set('Error al agregar vaso');
    } finally {
      this.guardando.set(false);
    }
  }

  async eliminarVaso(idVaso: string): Promise<void> {
    if (!this.libro()?.id || !confirm('¿Eliminar este vaso?')) return;
    
    try {
      await this.librosService.eliminarVaso(this.libro()!.id!, idVaso);
      await this.recargarLibro();
      this.mostrarExito('Vaso eliminado');
    } catch (err) {
      this.error.set('Error al eliminar');
    }
  }

  // ===== CONTROLES DIARIOS =====
  abrirModalControlDiario(): void {
    this.nuevoControlDiario = this.crearControlDiarioVacio();
    this.mostrarModalControlDiario.set(true);
  }

  cerrarModalControlDiario(): void {
    this.mostrarModalControlDiario.set(false);
  }

  async guardarControlDiario(): Promise<void> {
    if (!this.libro()?.id) return;
    
    this.guardando.set(true);
    try {
      await this.librosService.agregarControlDiarioAgua(this.libro()!.id!, this.nuevoControlDiario);
      await this.recargarLibro();
      this.cerrarModalControlDiario();
      this.mostrarExito('Control diario agregado');
    } catch (err) {
      this.error.set('Error al agregar control');
    } finally {
      this.guardando.set(false);
    }
  }

  // ===== CONTROLES AIRE =====
  abrirModalControlAire(): void {
    this.nuevoControlAire = this.crearControlAireVacio();
    this.mostrarModalControlAire.set(true);
  }

  cerrarModalControlAire(): void {
    this.mostrarModalControlAire.set(false);
  }

  async guardarControlAire(): Promise<void> {
    if (!this.libro()?.id) return;
    
    this.guardando.set(true);
    try {
      await this.librosService.agregarControlAire(this.libro()!.id!, this.nuevoControlAire);
      await this.recargarLibro();
      this.cerrarModalControlAire();
      this.mostrarExito('Control de aire agregado');
    } catch (err) {
      this.error.set('Error al agregar control');
    } finally {
      this.guardando.set(false);
    }
  }

  // ===== CONTROLES PERIÓDICOS =====
  abrirModalControlPeriodico(): void {
    this.nuevoControlPeriodico = this.crearControlPeriodicoVacio();
    this.mostrarModalControlPeriodico.set(true);
  }

  cerrarModalControlPeriodico(): void {
    this.mostrarModalControlPeriodico.set(false);
  }

  async guardarControlPeriodico(): Promise<void> {
    if (!this.libro()?.id) return;
    
    this.guardando.set(true);
    try {
      await this.librosService.agregarControlPeriodicoAgua(this.libro()!.id!, this.nuevoControlPeriodico);
      await this.recargarLibro();
      this.cerrarModalControlPeriodico();
      this.mostrarExito('Control periódico agregado');
    } catch (err) {
      this.error.set('Error al agregar control');
    } finally {
      this.guardando.set(false);
    }
  }

  // ===== INCIDENCIAS =====
  abrirModalIncidencia(): void {
    this.nuevaIncidencia = this.crearIncidenciaVacia();
    this.mostrarModalIncidencia.set(true);
  }

  cerrarModalIncidencia(): void {
    this.mostrarModalIncidencia.set(false);
  }

  async guardarIncidencia(): Promise<void> {
    if (!this.libro()?.id) return;
    
    this.guardando.set(true);
    try {
      await this.librosService.agregarIncidencia(this.libro()!.id!, this.nuevaIncidencia);
      await this.recargarLibro();
      this.cerrarModalIncidencia();
      this.mostrarExito('Incidencia agregada');
    } catch (err) {
      this.error.set('Error al agregar incidencia');
    } finally {
      this.guardando.set(false);
    }
  }

  // ===== TRATAMIENTOS =====
  abrirModalTratamiento(): void {
    this.nuevoTratamiento = this.crearTratamientoVacio();
    this.mostrarModalTratamiento.set(true);
  }

  cerrarModalTratamiento(): void {
    this.mostrarModalTratamiento.set(false);
  }

  async guardarTratamiento(): Promise<void> {
    if (!this.libro()?.id) return;
    
    this.guardando.set(true);
    try {
      await this.librosService.agregarTratamientoAgua(this.libro()!.id!, this.nuevoTratamiento);
      await this.recargarLibro();
      this.cerrarModalTratamiento();
      this.mostrarExito('Tratamiento agregado');
    } catch (err) {
      this.error.set('Error al agregar tratamiento');
    } finally {
      this.guardando.set(false);
    }
  }

  // ===== MANTENIMIENTO =====
  abrirModalMantenimiento(): void {
    this.nuevoMantenimiento = this.crearMantenimientoVacio();
    this.mostrarModalMantenimiento.set(true);
  }

  cerrarModalMantenimiento(): void {
    this.mostrarModalMantenimiento.set(false);
  }

  async guardarMantenimiento(): Promise<void> {
    if (!this.libro()?.id) return;
    
    this.guardando.set(true);
    try {
      await this.librosService.agregarMantenimiento(this.libro()!.id!, this.nuevoMantenimiento);
      await this.recargarLibro();
      this.cerrarModalMantenimiento();
      this.mostrarExito('Mantenimiento agregado');
    } catch (err) {
      this.error.set('Error al agregar mantenimiento');
    } finally {
      this.guardando.set(false);
    }
  }

  // ===== Helpers =====
  private async recargarLibro(): Promise<void> {
    if (this.libro()?.id) {
      this.librosService.obtenerLibroPorId(this.libro()!.id!).subscribe({
        next: (libro) => this.libro.set(libro)
      });
    }
  }

  private mostrarExito(mensaje: string): void {
    this.exito.set(mensaje);
    setTimeout(() => this.exito.set(null), 3000);
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-ES');
  }

  // ===== Creadores de objetos vacíos =====
  private crearVasoVacio(): DatoVaso {
    return {
      idVaso: '',
      tipoVaso: '',
      usoVaso: '',
      volumenM3: 0,
      superficieM2: 0,
      profundidadMinimaM: 0,
      profundidadMaximaM: 0,
      sistemaTratamiento: '',
      tipoDesinfectante: ''
    };
  }

  private crearControlDiarioVacio(): ControlDiarioAgua {
    const hoy = new Date().toISOString().split('T')[0];
    // Hora aleatoria entre 7:00 y 10:00
    const horaAleatoria = 7 + Math.floor(Math.random() * 3);
    const minutoAleatorio = Math.floor(Math.random() * 60);
    const hora = `${horaAleatoria.toString().padStart(2, '0')}:${minutoAleatorio.toString().padStart(2, '0')}`;
    return {
      fecha: hoy,
      hora: hora,
      idVaso: 'vaso-principal',
      ph: parseFloat((7.2 + Math.random() * 0.6).toFixed(1)), // pH entre 7.2 y 7.8
      desinfectanteResidualLibreMgL: parseFloat((0.5 + Math.random() * 1.5).toFixed(2)), // Entre 0.5 y 2.0 mg/L
      desinfectanteResidualCombinadoMgL: parseFloat((Math.random() * 0.6).toFixed(2)), // Máx 0.6 mg/L
      turbidezNTU: parseFloat((0.1 + Math.random() * 0.4).toFixed(2)), // Entre 0.1 y 0.5 NTU
      transparenciaCorrecta: true,
      color: 'Cristalino',
      olor: 'Normal',
      temperaturaAguaC: parseFloat((24 + Math.random() * 4).toFixed(1)), // Entre 24 y 28°C
      observaciones: ''
    };
  }

  private crearControlAireVacio(): ControlAirePiscinaCubierta {
    const hoy = new Date().toISOString().split('T')[0];
    const hora = new Date().toTimeString().slice(0, 5);
    return {
      fecha: hoy,
      hora: hora,
      temperaturaAmbienteC: 25,
      humedadRelativaPorcentaje: 60,
      co2Ppm: 400,
      cloroAmbienteMgM3: 0,
      observaciones: ''
    };
  }

  private crearControlPeriodicoVacio(): ControlPeriodicoAgua {
    const hoy = new Date().toISOString().split('T')[0];
    return {
      fechaMuestreo: hoy,
      idVaso: '',
      ph: 7.2,
      desinfectanteResidualLibreMgL: 0,
      desinfectanteResidualCombinadoMgL: 0,
      turbidezNTU: 0,
      alcalinidadMgL: 0,
      acidoIsocianuricoMgL: 0,
      conductividadUsCm: 0,
      eColiUfc100ml: 0,
      pseudomonasAeruginosaUfc100ml: 0,
      legionellaUfcL: 0,
      resultadoConforme: true,
      laboratorio: '',
      observaciones: ''
    };
  }

  private crearIncidenciaVacia(): Incidencia {
    const hoy = new Date().toISOString().split('T')[0];
    const hora = new Date().toTimeString().slice(0, 5);
    return {
      fecha: hoy,
      hora: hora,
      idVaso: '',
      descripcionIncidencia: '',
      parametroAfectado: '',
      valorDetectado: '',
      valorPermitido: '',
      medidasCorrectoras: '',
      fechaResolucion: '',
      responsable: ''
    };
  }

  private crearTratamientoVacio(): TratamientoAgua {
    const hoy = new Date().toISOString().split('T')[0];
    const hora = new Date().toTimeString().slice(0, 5);
    return {
      fecha: hoy,
      hora: hora,
      idVaso: '',
      productoUtilizado: '',
      dosisAplicada: '',
      motivoTratamiento: '',
      responsable: ''
    };
  }

  private crearMantenimientoVacio(): MantenimientoInstalacion {
    const hoy = new Date().toISOString().split('T')[0];
    return {
      fecha: hoy,
      tipoMantenimiento: '',
      descripcion: '',
      empresaResponsable: '',
      tecnico: ''
    };
  }
}
