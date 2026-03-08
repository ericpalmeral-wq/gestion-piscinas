import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, firstValueFrom } from 'rxjs';
import { PiscinasService } from '../../services/piscinas.service';
import { TareasService } from '../../services/tareas.service';
import { PresupuestosService } from '../../services/presupuestos.service';
import { InformesService } from '../../services/informes.service';
import { UsuariosService } from '../../services/usuarios.service';
import { SeedService } from '../../services/seed.service';
import { LibrosService } from '../../services/libros.service';
import { ControlDiarioAgua } from '../../models/libro';
import { Piscina } from '../../models/piscina';
import { Tarea } from '../../models/tarea';
import { Presupuesto } from '../../models/presupuesto';
import { Informe } from '../../models/informe';
import { Usuario } from '../../models/usuario';
import { LineaPresupuesto } from '../../models/linea-presupuesto';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  private piscinasService = inject(PiscinasService);
  private tareasService = inject(TareasService);
  private presupuestosService = inject(PresupuestosService);
  private informesService = inject(InformesService);
  private usuariosService = inject(UsuariosService);
  private seedService = inject(SeedService);
  private librosService = inject(LibrosService);

  usuarioActual = signal<Usuario | null>(null);
  cargando = signal(true);
  cargandoDatos = signal(false);
  generandoControles = signal(false);

  // Admin
  ultimasPiscinas = signal<Piscina[]>([]);
  todasLasPiscinasGrafica = signal<Piscina[]>([]);
  ultimosInformes = signal<Informe[]>([]);
  ultimosPresupuestos = signal<Presupuesto[]>([]);
  ultimasTareas = signal<Tarea[]>([]);

  // Gestor
  tareasCompletadas = signal<Tarea[]>([]);
  presupuestosAceptados = signal<Presupuesto[]>([]);

  // Cliente
  piscinasDelCliente = signal<Piscina[]>([]);

  // Técnico
  piscinasDelTecnico = signal<Piscina[]>([]);
  actualizandoPiscina = signal<string | null>(null);

  // Modal Nueva Tarea
  mostrarModalTarea = false;
  guardandoTarea = false;
  errorModalTarea = '';
  enviadoTarea = false;
  nuevaTarea: Tarea = this.crearTareaVacia();

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

  modulos = [
    { titulo: 'Gestión de Piscinas', descripcion: 'Administra y monitorea todas tus piscinas', icono: '🏊', ruta: '/piscinas', color: '#3b82f6' },
    { titulo: 'Informes', descripcion: 'Reportes detallados del estado de piscinas', icono: '📊', ruta: '/informes', color: '#10b981' },
    { titulo: 'Presupuestos', descripcion: 'Gestiona presupuestos de mantenimiento', icono: '💰', ruta: '/presupuestos', color: '#f59e0b' },
    { titulo: 'Tareas', descripcion: 'Tareas de mantenimiento pendientes', icono: '✓', ruta: '/tareas', color: '#8b5cf6' },
    { titulo: 'Libros de Registro', descripcion: 'Registros históricos de operaciones', icono: '📚', ruta: '/libros', color: '#ec4899' }
  ];

  ngOnInit(): void {
    const usuarioGuardado = localStorage.getItem('usuarioActual');
    
    if (usuarioGuardado) {
      try {
        const usuario = JSON.parse(usuarioGuardado) as Usuario;
        this.usuarioActual.set(usuario);
        this.cargarDatosDashboard(usuario);
      } catch {
        this.cargando.set(false);
      }
    } else {
      this.cargando.set(false);
    }
  }

  private cargarDatosDashboard(usuario: Usuario): void {
    const rol = usuario.rol;
    
    // Si es cliente, cargar solo sus piscinas
    if (rol === 'cliente') {
      this.piscinasService.obtenerPiscinasDeCliente(usuario.uid).subscribe({
        next: (piscinas) => {
          this.piscinasDelCliente.set(
            piscinas.sort((a: any, b: any) => this.compararFechas(b.fechaCreacion, a.fechaCreacion))
          );
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
        }
      });
      return;
    }

    // Si es técnico, cargar las piscinas asignadas
    if (rol === 'tecnico') {
      this.piscinasService.obtenerPiscinasAsignadasATecnico(usuario.uid).subscribe({
        next: (piscinas) => {
          this.piscinasDelTecnico.set(
            piscinas.sort((a: any, b: any) => this.compararFechas(a.ultimaLimpieza, b.ultimaLimpieza))
          );
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
        }
      });
      return;
    }
    
    // Cargar datos del dashboard para otros roles
    forkJoin({
      piscinas: this.piscinasService.obtenerPiscinas(),
      informes: this.informesService.obtenerTodosLosInformes(),
      presupuestos: this.presupuestosService.obtenerTodosLosPresupuestos(),
      tareas: this.tareasService.obtenerTodasLasTareas()
    }).subscribe({
      next: ({ piscinas, informes, presupuestos, tareas }) => {
        const piscinasOrdenadas = piscinas.sort((a: any, b: any) => this.compararFechas(b.fechaCreacion, a.fechaCreacion));
        this.ultimasPiscinas.set(piscinasOrdenadas.slice(0, 5));
        this.todasLasPiscinasGrafica.set(piscinasOrdenadas);
        this.ultimosInformes.set(
          informes.sort((a, b) => this.compararFechas(b.fechaActualizacion, a.fechaActualizacion)).slice(0, 5)
        );
        this.ultimosPresupuestos.set(
          presupuestos.sort((a, b) => this.compararFechas(b.fechaCreacion, a.fechaCreacion)).slice(0, 5)
        );
        this.ultimasTareas.set(
          tareas.sort((a, b) => this.compararFechas(b.fechaCreacion, a.fechaCreacion)).slice(0, 5)
        );
        
        // Datos adicionales para el rol gestor
        this.tareasCompletadas.set(
          tareas.filter(t => t.estado === 'completada')
            .sort((a, b) => this.compararFechas(b.fechaCreacion, a.fechaCreacion)).slice(0, 5)
        );
        this.presupuestosAceptados.set(
          presupuestos.filter(p => p.estado === 'aceptado')
            .sort((a, b) => this.compararFechas(b.fechaCreacion, a.fechaCreacion)).slice(0, 5)
        );
        
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
      }
    });
    
    // Código legacy para gestor (ahora integrado arriba)
    if (false && rol === 'gestor') {
      forkJoin({
        tareas: this.tareasService.obtenerTodasLasTareas(),
        presupuestos: this.presupuestosService.obtenerTodosLosPresupuestos()
      }).subscribe({
        next: ({ tareas, presupuestos }) => {
          this.tareasCompletadas.set(
            tareas.filter(t => t.estado === 'completada')
              .sort((a, b) => this.compararFechas(b.fechaCreacion, a.fechaCreacion)).slice(0, 5)
          );
          this.presupuestosAceptados.set(
            presupuestos.filter(p => p.estado === 'aceptado')
              .sort((a, b) => this.compararFechas(b.fechaCreacion, a.fechaCreacion)).slice(0, 5)
          );
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false)
      });
    }
  }

  private compararFechas(a: any, b: any): number {
    const fa = a instanceof Date ? a.getTime() : new Date(a || 0).getTime();
    const fb = b instanceof Date ? b.getTime() : new Date(b || 0).getTime();
    return fa - fb;
  }

  formatearFecha(fecha: Date | string): string {
    if (!fecha) return 'N/A';
    const d = fecha instanceof Date ? fecha : new Date(fecha);
    return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  getTotalLineas(lineas: LineaPresupuesto[]): number {
    return (lineas || []).reduce((acc, l) => acc + (l.total || 0), 0);
  }

  /**
   * Devuelve el porcentaje del consumo para la barra de la gráfica
   */
  getConsumoPercent(consumo: number | undefined): number {
    const maxConsumo = Math.max(...this.todasLasPiscinasGrafica().map(p => p.consumoSemanal || 0), 1);
    return ((consumo || 0) / maxConsumo) * 100;
  }

  /**
   * Devuelve el porcentaje para químicos (algibón o bajaPH)
   */
  getQuimicoPercent(valor: number | undefined, tipo: 'algibon' | 'bajaPH'): number {
    const piscinas = this.todasLasPiscinasGrafica();
    const maxValor = tipo === 'algibon' 
      ? Math.max(...piscinas.map(p => p.algibonL || 0), 1)
      : Math.max(...piscinas.map(p => p.bajaPHL || 0), 1);
    return ((valor || 0) / maxValor) * 100;
  }

  /**
   * Calcula el total de consumo semanal de todas las piscinas
   */
  getTotalConsumo(): number {
    return this.todasLasPiscinasGrafica().reduce((acc, p) => acc + (p.consumoSemanal || 0), 0);
  }

  /**
   * Calcula el total de algibón de todas las piscinas
   */
  getTotalAlgibon(): number {
    return this.todasLasPiscinasGrafica().reduce((acc, p) => acc + (p.algibonL || 0), 0);
  }

  /**
   * Calcula el total de baja pH de todas las piscinas
   */
  getTotalBajaPH(): number {
    return this.todasLasPiscinasGrafica().reduce((acc, p) => acc + (p.bajaPHL || 0), 0);
  }

  /**
   * Devuelve el color según el nivel de consumo
   */
  getConsumoColor(consumo: number | undefined): string {
    const c = consumo || 0;
    if (c < 50) return '#10b981'; // Verde - bajo
    if (c < 100) return '#f59e0b'; // Amarillo - medio
    return '#ef4444'; // Rojo - alto
  }

  /**
   * Carga datos de prueba en la base de datos
   */
  async cargarDatosPrueba(): Promise<void> {
    if (confirm('¿Deseas agregar datos de prueba? Se crearán 10 piscinas, 10 informes y 10 presupuestos.')) {
      this.cargandoDatos.set(true);
      try {
        await this.seedService.agregarTodosDatosPrueba();
        alert('✓ Datos de prueba agregados correctamente. Por favor, recarga la página.');
        // Recargar los datos del dashboard
        const usuario = this.usuarioActual();
        if (usuario) {
          this.cargarDatosDashboard(usuario);
        }
      } catch (error) {
        console.error('Error al cargar datos de prueba:', error);
        alert('Error al cargar los datos de prueba. Verifica la consola para más detalles.');
      } finally {
        this.cargandoDatos.set(false);
      }
    }
  }

  /**
   * Genera controles diarios para todas las piscinas con valores admitidos
   */
  async generarControlesDiarios(): Promise<void> {
    if (!confirm('¿Deseas generar un control diario para todas las piscinas con la fecha de hoy?')) {
      return;
    }

    this.generandoControles.set(true);
    try {
      // Obtener todos los libros
      const libros = await firstValueFrom(this.librosService.obtenerTodosLosLibros());
      
      if (!libros || libros.length === 0) {
        alert('No hay libros de registro disponibles. Asegúrate de que las piscinas tengan su libro creado.');
        return;
      }

      // Generar fecha de hoy con hora aleatoria entre 7:00 y 10:00
      const hoy = new Date();
      const fechaStr = hoy.toISOString().split('T')[0];
      
      let controlesAgregados = 0;

      for (const libro of libros) {
        // Hora aleatoria entre 7:00 y 10:00
        const horaAleatoria = 7 + Math.floor(Math.random() * 3);
        const minutoAleatorio = Math.floor(Math.random() * 60);
        const horaStr = `${horaAleatoria.toString().padStart(2, '0')}:${minutoAleatorio.toString().padStart(2, '0')}`;

        // Generar valores dentro de rangos admitidos
        const control: ControlDiarioAgua = {
          fecha: fechaStr,
          hora: horaStr,
          idVaso: libro.piscinaId || 'vaso-principal',
          ph: parseFloat((7.2 + Math.random() * 0.6).toFixed(1)), // pH entre 7.2 y 7.8
          desinfectanteResidualLibreMgL: parseFloat((0.5 + Math.random() * 1.5).toFixed(2)), // Entre 0.5 y 2.0 mg/L
          desinfectanteResidualCombinadoMgL: parseFloat((Math.random() * 0.6).toFixed(2)), // Máx 0.6 mg/L
          turbidezNTU: parseFloat((0.1 + Math.random() * 0.4).toFixed(2)), // Entre 0.1 y 0.5 NTU
          transparenciaCorrecta: true,
          color: 'Cristalino',
          olor: 'Normal',
          temperaturaAguaC: parseFloat((24 + Math.random() * 4).toFixed(1)), // Entre 24 y 28°C
          observaciones: 'Control diario - valores dentro de parámetros normales'
        };

        await this.librosService.agregarControlDiarioAgua(libro.id!, control);
        controlesAgregados++;
      }

      alert(`✓ Se han agregado ${controlesAgregados} controles diarios con fecha ${fechaStr}.`);
    } catch (error) {
      console.error('Error al generar controles diarios:', error);
      alert('Error al generar los controles diarios. Verifica la consola para más detalles.');
    } finally {
      this.generandoControles.set(false);
    }
  }

  /**
   * Actualiza los parámetros de una piscina (cloro, pH, última limpieza)
   */
  async actualizarParametrosPiscina(piscina: Piscina): Promise<void> {
    if (!piscina.id) return;
    
    this.actualizandoPiscina.set(piscina.id);
    try {
      await this.piscinasService.actualizarPiscina(piscina.id, {
        nivelCloro: piscina.nivelCloro,
        pHAgua: piscina.pHAgua,
        ultimaLimpieza: piscina.ultimaLimpieza
      });
    } catch {
      alert('Error al actualizar los parámetros de la piscina');
    } finally {
      this.actualizandoPiscina.set(null);
    }
  }

  /**
   * Registra una nueva limpieza con la fecha actual
   */
  async registrarLimpiezaHoy(piscina: Piscina): Promise<void> {
    if (!piscina.id) return;

    piscina.ultimaLimpieza = new Date();
    await this.actualizarParametrosPiscina(piscina);
  }

  /**
   * Convierte string de fecha a Date para el input de fecha
   */
  actualizarFechaLimpieza(piscina: Piscina, fecha: string): void {
    if (fecha) {
      piscina.ultimaLimpieza = new Date(fecha);
    }
  }

  // === Métodos del Modal Nueva Tarea ===
  crearTareaVacia(): Tarea {
    return {
      piscinaId: '',
      descripcion: '',
      estado: 'pendiente',
      prioridad: 'media',
      fechaCreacion: new Date().toISOString(),
      fechaVencimiento: new Date().toISOString().split('T')[0],
      responsable: ''
    };
  }

  abrirModalTarea(piscina: Piscina): void {
    this.nuevaTarea = this.crearTareaVacia();
    this.nuevaTarea.piscinaId = piscina.id || '';
    this.errorModalTarea = '';
    this.enviadoTarea = false;
    this.mostrarModalTarea = true;
  }

  cerrarModalTarea(): void {
    this.mostrarModalTarea = false;
    this.errorModalTarea = '';
    this.enviadoTarea = false;
  }

  validarFormularioTarea(): boolean {
    if (!this.nuevaTarea.piscinaId.trim()) {
      this.errorModalTarea = 'Por favor selecciona una piscina';
      return false;
    }
    if (!this.nuevaTarea.descripcion.trim()) {
      this.errorModalTarea = 'Por favor ingresa una descripción';
      return false;
    }
    if (!this.nuevaTarea.fechaVencimiento) {
      this.errorModalTarea = 'Por favor selecciona una fecha de vencimiento';
      return false;
    }
    return true;
  }

  guardarNuevaTarea(): void {
    this.enviadoTarea = true;
    if (!this.validarFormularioTarea()) {
      return;
    }

    this.guardandoTarea = true;
    this.errorModalTarea = '';

    this.tareasService.agregarTarea(this.nuevaTarea).then(() => {
      this.guardandoTarea = false;
      this.cerrarModalTarea();
      alert('✅ Tarea creada correctamente');
    }).catch((err) => {
      console.error('Error creando tarea:', err);
      this.errorModalTarea = 'Error al crear la tarea. Por favor, intenta de nuevo.';
      this.guardandoTarea = false;
    });
  }

  obtenerNombrePiscina(piscinaId: string): string {
    const piscina = this.piscinasDelTecnico().find(p => p.id === piscinaId);
    return piscina ? piscina.nombre : 'Sin especificar';
  }
}
