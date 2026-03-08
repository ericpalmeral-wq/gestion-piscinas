import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import { PiscinasService } from '../../services/piscinas.service';
import { UsuariosService } from '../../services/usuarios.service';
import { AuthService } from '../../services/auth.service';
import { Piscina, PiscinaData } from '../../models/piscina';
import { Usuario } from '../../models/usuario';
import { Presupuesto } from '../../models/presupuesto';
import { PresupuestosService } from '../../services/presupuestos.service';
import { Informe } from '../../models/informe';
import { InformesService } from '../../services/informes.service';
import { Tarea } from '../../models/tarea';
import { TareasService } from '../../services/tareas.service';

@Component({
  selector: 'app-piscina-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './piscina-detalle.component.html',
  styleUrls: ['./piscina-detalle.component.css']
})
export class PiscinaDetalleComponent implements OnInit {
      usuarioActual = signal<Usuario | null>(null);
    // Calcula el total de las líneas de un presupuesto
    getTotalLineas(lineas: { total: number }[]): number {
      return lineas.reduce((acc, l) => acc + l.total, 0);
    }

  // Verifica si el usuario actual puede editar (solo administrador)
  puedeEditar(): boolean {
    const usuario = this.usuarioActual();
    return usuario !== null && usuario.rol === 'administrador';
  }

  // Verifica si el usuario actual es cliente
  esCliente(): boolean {
    return this.usuarioActual()?.rol === 'cliente';
  }

  // Verifica si el usuario actual puede ver tareas (admin o tecnico)
  puedeVerTareas(): boolean {
    const rol = this.usuarioActual()?.rol;
    return rol === 'administrador' || rol === 'tecnico';
  }

  piscina = signal<Piscina | null>(null);
  piscinaEditada = signal<Piscina | null>(null);
  cargando = signal(true);
  error = signal<string | null>(null);
  guardando = signal(false);
  editando = signal(false);
  suceso = signal<string | null>(null);
  qrUrl = signal<string>('');
  Math = Math; // Para usar Math en el template
  piscinaId: string | null = null;

  // Presupuestos
  presupuestos = signal<Presupuesto[]>([]);
  presupuestoSeleccionado = signal<Presupuesto | null>(null);
  mostrarModalPresupuesto = signal(false);
  presupuestoNuevo = signal<Omit<Presupuesto, 'id'>>({
    piscinaId: '',
    fechaCreacion: '',
    descripcion: '',
    lineas: [],
    estado: 'pendiente'
  });

  lineaNueva = signal<{ cantidad: number; descripcion: string; precioUnitario: number }>({ cantidad: 1, descripcion: '', precioUnitario: 0 });
    agregarLineaPresupuesto(): void {
      const l = this.lineaNueva();
      if (!l.descripcion || !l.cantidad || !l.precioUnitario) return;
      const total = l.cantidad * l.precioUnitario;
      const nuevaLinea = { ...l, total };
      const lineas = [...this.presupuestoNuevo().lineas, nuevaLinea];
      this.presupuestoNuevo.set({
        ...this.presupuestoNuevo(),
        lineas
      });
      this.lineaNueva.set({ cantidad: 1, descripcion: '', precioUnitario: 0 });
    }

    eliminarLineaPresupuesto(idx: number): void {
      const lineas = this.presupuestoNuevo().lineas.filter((_, i) => i !== idx);
      this.presupuestoNuevo.set({
        ...this.presupuestoNuevo(),
        lineas
      });
    }
  cargandoPresupuestos = signal(false);

  // Informes
  informe = signal<Informe | null>(null);
  cargandoInforme = signal(false);

  // Tareas
  tareas = signal<Tarea[]>([]);
  cargandoTareas = signal(false);

  // Clientes
  clientes = signal<Usuario[]>([]);
  clienteSeleccionado = signal<string>('');

  // Técnicos
  tecnicos = signal<Usuario[]>([]);
  tecnicoSeleccionado = signal<string>('');
  asignandoTecnico = signal(false);

  private presupuestosService = inject(PresupuestosService);
  private informesService = inject(InformesService);
  private tareasService = inject(TareasService);

  private route = inject(ActivatedRoute);
  private piscinasService = inject(PiscinasService);
  private usuariosService = inject(UsuariosService);
  private authService = inject(AuthService);

  ngOnInit(): void {
    // Obtener usuario actual desde AuthService
    this.usuarioActual.set(this.authService.obtenerUsuarioActual());
    
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.piscinaId = id;
      this.generarQR(id);
      this.cargarPiscina(id);
      this.cargarPresupuestos(id);
      this.cargarInforme(id);
      this.cargarTareas(id);
      this.cargarClientes();
      this.cargarTecnicos();
    }
  }

  cargarClientes(): void {
    this.usuariosService.obtenerUsuarios().subscribe({
      next: (usuarios) => {
        const clientes = usuarios.filter(u => u.rol === 'cliente' && u.estado === 'activo');
        this.clientes.set(clientes);
      },
      error: () => {
        // Error al cargar clientes
      }
    });
  }

  cargarTecnicos(): void {
    this.usuariosService.obtenerUsuarios().subscribe({
      next: (usuarios) => {
        const tecnicos = usuarios.filter(u => u.rol === 'tecnico');
        this.tecnicos.set(tecnicos);
      },
      error: () => {
        // Error al cargar técnicos
      }
    });
  }

  /**
   * Obtiene los nombres de los técnicos asignados a la piscina
   */
  obtenerTecnicosAsignados(): Usuario[] {
    const piscina = this.piscina();
    if (!piscina?.tecnicosAsignados || piscina.tecnicosAsignados.length === 0) {
      return [];
    }
    return this.tecnicos().filter(t => piscina.tecnicosAsignados!.includes(t.uid));
  }

  /**
   * Obtiene técnicos disponibles (no asignados a esta piscina)
   */
  obtenerTecnicosDisponibles(): Usuario[] {
    const piscina = this.piscina();
    const tecnicosAsignados = piscina?.tecnicosAsignados || [];
    return this.tecnicos().filter(t => !tecnicosAsignados.includes(t.uid));
  }

  /**
   * Asigna un técnico a la piscina
   */
  async asignarTecnico(): Promise<void> {
    const tecnicoUid = this.tecnicoSeleccionado();
    if (!this.piscinaId || !tecnicoUid) return;

    this.asignandoTecnico.set(true);
    try {
      await this.piscinasService.asignarTecnico(this.piscinaId, tecnicoUid);
      this.suceso.set('Técnico asignado correctamente');
      this.tecnicoSeleccionado.set('');
      this.cargarPiscina(this.piscinaId);
      setTimeout(() => this.suceso.set(null), 2000);
    } catch (error) {
      console.error('Error al asignar técnico:', error);
      this.error.set('Error al asignar el técnico');
    } finally {
      this.asignandoTecnico.set(false);
    }
  }

  /**
   * Desasigna un técnico de la piscina
   */
  async desasignarTecnico(tecnicoUid: string): Promise<void> {
    if (!this.piscinaId) return;
    if (!confirm('¿Estás seguro de que quieres desasignar este técnico?')) return;

    this.asignandoTecnico.set(true);
    try {
      await this.piscinasService.desasignarTecnico(this.piscinaId, tecnicoUid);
      this.suceso.set('Técnico desasignado correctamente');
      this.cargarPiscina(this.piscinaId);
      setTimeout(() => this.suceso.set(null), 2000);
    } catch (error) {
      console.error('Error al desasignar técnico:', error);
      this.error.set('Error al desasignar el técnico');
    } finally {
      this.asignandoTecnico.set(false);
    }
  }
  cargarPresupuestos(piscinaId: string): void {
    this.cargandoPresupuestos.set(true);
    this.presupuestosService.obtenerPresupuestosPorPiscina(piscinaId).subscribe({
      next: (presupuestos) => {
        this.presupuestos.set(presupuestos);
        this.cargandoPresupuestos.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar presupuestos');
        this.cargandoPresupuestos.set(false);
      }
    });
  }

  cargarInforme(piscinaId: string): void {
    this.cargandoInforme.set(true);
    this.informesService.obtenerInformePorPiscina(piscinaId).subscribe({
      next: (informe) => {
        this.informe.set(informe);
        this.cargandoInforme.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar informe');
        this.cargandoInforme.set(false);
      }
    });
  }

  cargarTareas(piscinaId: string): void {
    this.cargandoTareas.set(true);
    this.tareasService.obtenerTareasPorPiscina(piscinaId).subscribe({
      next: (tareas) => {
        this.tareas.set(tareas.sort((a, b) => 
          new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
        ));
        this.cargandoTareas.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar tareas');
        this.cargandoTareas.set(false);
      }
    });
  }

  agregarPresupuesto(): void {
    if (!this.piscinaId) return;
    if (!this.usuarioActual() || this.usuarioActual()!.rol !== 'administrador') {
      this.error.set('Solo el administrador puede crear presupuestos');
      return;
    }
    const p = this.presupuestoNuevo();
    if (!p.descripcion || !p.fechaCreacion || p.lineas.length === 0) {
      this.error.set('Completa todos los campos y añade al menos una línea');
      return;
    }
    this.guardando.set(true);
    this.presupuestosService.agregarPresupuesto({
      ...p,
      piscinaId: this.piscinaId
    }).then(() => {
      this.suceso.set('Presupuesto añadido');
      this.presupuestoNuevo.set({ piscinaId: this.piscinaId!, fechaCreacion: '', descripcion: '', lineas: [], estado: 'pendiente' });
      this.cargarPresupuestos(this.piscinaId!);
      this.guardando.set(false);
      setTimeout(() => this.suceso.set(null), 2000);
    }).catch(() => {
      this.error.set('Error al añadir presupuesto');
      this.guardando.set(false);
    });
  }

  getTotalPresupuesto(): number {
    return this.presupuestoNuevo().lineas.reduce((acc, l) => acc + l.total, 0);
  }

  eliminarPresupuesto(id: string): void {
    if (!this.usuarioActual() || this.usuarioActual()!.rol !== 'administrador') {
      this.error.set('Solo el administrador puede eliminar presupuestos');
      return;
    }
    if (!confirm('¿Eliminar este presupuesto?')) return;
    this.guardando.set(true);
    this.presupuestosService.eliminarPresupuesto(id).then(() => {
      if (this.piscinaId) this.cargarPresupuestos(this.piscinaId);
      this.guardando.set(false);
    }).catch(() => {
      this.error.set('Error al eliminar presupuesto');
      this.guardando.set(false);
    });
  }

  abrirModalPresupuesto(presupuesto: Presupuesto): void {
    this.presupuestoSeleccionado.set(presupuesto);
    this.mostrarModalPresupuesto.set(true);
  }

  cerrarModalPresupuesto(): void {
    this.mostrarModalPresupuesto.set(false);
    setTimeout(() => this.presupuestoSeleccionado.set(null), 300);
  }

  generarPDFPresupuesto(presupuesto: Presupuesto): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 15;

    // Fondo de encabezado elegante
    doc.setFillColor(102, 126, 234);
    doc.rect(0, 0, pageWidth, 50, 'F');

    // Encabezado principal
    doc.setFontSize(28);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('GestiPool', 20, 28);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(230, 230, 230);
    doc.text('Sistema de Gestión de Piscinas', 20, 36);

    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('PRESUPUESTO', pageWidth - 20, 28, { align: 'right' });

    // Contenido principal
    yPosition = 58;
    
    // Información en dos columnas
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'bold');
    doc.text('Información del Presupuesto', 20, yPosition);
    
    yPosition += 8;
    
    // Bloque de información izquierdo
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const infoLeft = [
      { label: 'ID:', value: presupuesto.id || 'N/A' },
      { label: 'Descripción:', value: presupuesto.descripcion }
    ];

    infoLeft.forEach((info, idx) => {
      doc.setTextColor(80, 80, 80);
      doc.setFont('helvetica', 'bold');
      doc.text(info.label, 20, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);
      doc.text(info.value, 45, yPosition);
      yPosition += 6;
    });

    // Información derecha
    const fechaFormateada = new Date(presupuesto.fechaCreacion).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const estado = presupuesto.estado === 'pendiente' ? 'Pendiente' : 'Aceptado';
    const estadoColor = presupuesto.estado === 'pendiente' ? [255, 152, 0] : [16, 185, 129];

    yPosition -= 12;
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'bold');
    doc.text('Fecha:', pageWidth - 80, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text(fechaFormateada, pageWidth - 60, yPosition);

    yPosition += 6;
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'bold');
    doc.text('Estado:', pageWidth - 80, yPosition);
    
    // Badge de estado
    doc.setFillColor(estadoColor[0], estadoColor[1], estadoColor[2]);
    doc.rect(pageWidth - 60, yPosition - 3, 25, 5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(estado, pageWidth - 48, yPosition + 1, { align: 'center' });

    yPosition += 15;

    // Línea separadora decorativa
    doc.setDrawColor(102, 126, 234);
    doc.setLineWidth(0.5);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 8;

    // Tabla de líneas de presupuesto
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(102, 126, 234);
    
    const headers = ['Cantidad', 'Descripción', 'Precio Unit.', 'Total'];
    const columnWidths = [20, 90, 35, 30];
    const cellHeight = 8;
    let xPos = 20;

    // Dibuja headers
    doc.setLineWidth(0.1);
    doc.setDrawColor(102, 126, 234);
    
    headers.forEach((header, idx) => {
      doc.rect(xPos, yPosition, columnWidths[idx], cellHeight, 'F');
      doc.setTextColor(255, 255, 255);
      // Calcular posición centrada manualmente
      const textWidth = doc.getTextWidth(header);
      const centeredX = xPos + (columnWidths[idx] - textWidth) / 2;
      doc.text(header, centeredX, yPosition + 5);
      xPos += columnWidths[idx];
    });

    yPosition += cellHeight;

    // Filas de data
    const rows = presupuesto.lineas.map(linea => [
      linea.cantidad.toString(),
      linea.descripcion,
      `${linea.precioUnitario.toFixed(2)} €`,
      `${linea.total.toFixed(2)} €`
    ]);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    
    rows.forEach((row, idx) => {
      xPos = 20;
      const bgColor = idx % 2 === 0 ? [245, 247, 250] : [255, 255, 255];
      doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
      
      // Dibuja fondo fila
      for (let i = 0; i < columnWidths.length; i++) {
        doc.rect(xPos, yPosition, columnWidths[i], cellHeight, 'F');
        xPos += columnWidths[i];
      }

      // Dibuja borde
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.2);
      doc.rect(20, yPosition, columnWidths.reduce((a, b) => a + b), cellHeight);

      // Texto
      xPos = 20;
      row.forEach((cell, cellIdx) => {
        // Cantidad centrada, Descripción a la izquierda, Precios a la derecha
        let textX: number;
        let align: 'left' | 'center' | 'right';
        
        if (cellIdx === 0) {
          // Cantidad - centrada
          textX = xPos + columnWidths[cellIdx] / 2;
          align = 'center';
        } else if (cellIdx === 1) {
          // Descripción - a la izquierda con padding
          textX = xPos + 3;
          align = 'left';
        } else {
          // Precios - a la derecha con padding
          textX = xPos + columnWidths[cellIdx] - 3;
          align = 'right';
        }
        
        doc.text(cell, textX, yPosition + 5, { align });
        xPos += columnWidths[cellIdx];
      });

      yPosition += cellHeight;
    });

    // Línea separadora antes del total
    yPosition += 3;
    doc.setDrawColor(102, 126, 234);
    doc.setLineWidth(0.5);
    doc.line(20, yPosition, pageWidth - 20, yPosition);

    // Resumen y Total
    yPosition += 8;
    const total = this.getTotalLineas(presupuesto.lineas);
    
    // Subtotal (si hubiera descuentos)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Subtotal:', pageWidth - 65, yPosition);
    doc.setTextColor(50, 50, 50);
    doc.text(`${total.toFixed(2)} €`, pageWidth - 20, yPosition, { align: 'right' });

    yPosition += 7;
    doc.setDrawColor(102, 126, 234);
    doc.setLineWidth(0.3);
    doc.line(pageWidth - 100, yPosition, pageWidth - 20, yPosition);

    // Total Grande
    yPosition += 7;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text('TOTAL:', pageWidth - 65, yPosition);
    doc.setFontSize(16);
    doc.text(`${total.toFixed(2)} €`, pageWidth - 20, yPosition, { align: 'right' });

    // Footer elegante
    yPosition = pageHeight - 20;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(20, yPosition, pageWidth - 20, yPosition);

    yPosition += 5;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    doc.text('GestiPool - Sistema de Gestión de Piscinas', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 4;
    const fechaGeneracion = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
    const horaGeneracion = new Date().toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`Generado: ${fechaGeneracion} a las ${horaGeneracion}`, pageWidth / 2, yPosition, { align: 'center' });

    // Descargar
    const nombreArchivo = `Presupuesto_${presupuesto.descripcion.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
    doc.save(nombreArchivo);
  }

  generarQR(id: string): void {
    // Generar URL del QR con la URL de los detalles de la piscina
    const detallesUrl = `${window.location.origin}/publica/piscinas/${id}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(detallesUrl)}`;
    this.qrUrl.set(qrUrl);
  }

  descargarQRPDF(): void {
    const piscina = this.piscina();
    const qrUrl = this.qrUrl();
    if (!piscina || !qrUrl) return;

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Centrar el QR
      const qrSize = 100;
      const xPos = (pageWidth - qrSize) / 2;
      
      // Añadir imagen del QR
      doc.addImage(img, 'PNG', xPos, 40, qrSize, qrSize);
      
      // Añadir texto debajo del QR
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      const texto = `Info Piscina - ${piscina.nombre}`;
      const textWidth = doc.getTextWidth(texto);
      doc.text(texto, (pageWidth - textWidth) / 2, 155);
      
      // Descargar
      doc.save(`QR_${piscina.nombre.replace(/\s+/g, '_')}.pdf`);
    };
    img.src = qrUrl;
  }

  cargarPiscina(id: string): void {
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
          this.piscinaEditada.set(JSON.parse(JSON.stringify(piscinaFormateada)));
          // Establecer cliente seleccionado
          this.clienteSeleccionado.set(piscina.clienteId || '');
        } else {
          this.error.set('Piscina no encontrada');
        }
        this.cargando.set(false);
      },
      error: (err: any) => {
        console.error('Error al cargar piscina:', err);
        this.error.set('Error al cargar los detalles de la piscina');
        this.cargando.set(false);
      }
    });
  }





  iniciarEdicion(): void {
    // Solo usuarios autorizados pueden editar
    if (!this.puedeEditar()) {
      return;
    }
    this.editando.set(true);
    this.suceso.set(null);
    // Establecer cliente seleccionado al iniciar edición
    if (this.piscina()) {
      this.clienteSeleccionado.set(this.piscina()!.clienteId || '');
    }
  }

  cancelarEdicion(): void {
    this.editando.set(false);
    this.suceso.set(null);
    if (this.piscina()) {
      this.piscinaEditada.set(JSON.parse(JSON.stringify(this.piscina())));
    }
  }

  guardarCambios(): void {
    if (!this.piscinaEditada() || !this.piscinaId || !this.puedeEditar()) {
      return;
    }

    this.guardando.set(true);
    this.error.set(null);

    const cambios: Partial<Piscina> = {
      nombre: this.piscinaEditada()!.nombre || '',
      ubicacion: this.piscinaEditada()!.ubicacion || '',
      capacidadLitros: this.piscinaEditada()!.capacidadLitros ?? 0,
      profundidadMaxima: this.piscinaEditada()!.profundidadMaxima ?? 0,
      nivelCloro: this.piscinaEditada()!.nivelCloro ?? 0,
      pHAgua: this.piscinaEditada()!.pHAgua ?? 7,
      horasFiltracion: this.piscinaEditada()!.horasFiltracion ?? 0,
      estado: this.piscinaEditada()!.estado || 'abierta',
      ultimaLimpieza: this.piscinaEditada()!.ultimaLimpieza || new Date(),
      fechaApertura: this.piscinaEditada()!.fechaApertura || null,
      fechaCierre: this.piscinaEditada()!.fechaCierre || null,
      consumoSemanal: this.piscinaEditada()!.consumoSemanal ?? 0,
      cif: this.piscinaEditada()!.cif ?? '',
      tipo: this.piscinaEditada()!.tipo || 'comunidad',
      observaciones: this.piscinaEditada()!.observaciones ?? '',
      clienteId: this.clienteSeleccionado() || '',
      clienteNombre: this.clientes().find(c => c.uid === this.clienteSeleccionado())?.nombre || ''
    };

    this.piscinasService.actualizarPiscina(this.piscinaId, cambios).then(() => {
      this.piscina.set(JSON.parse(JSON.stringify(this.piscinaEditada())));
      this.editando.set(false);
      this.guardando.set(false);
      this.suceso.set('✅ Cambios guardados exitosamente');
      setTimeout(() => this.suceso.set(null), 3000);
    }).catch((err) => {
      console.error('Error al guardar cambios:', err);
      this.error.set('Error al guardar los cambios');
      this.guardando.set(false);
    });
  }

  obtenerColorEstado(estado: string): string {
    const colores: { [key: string]: string } = {
      'abierta': '#10b981',
      'cerrada': '#6b7280'
    };
    return colores[estado] || '#6b7280';
  }

  formatearFecha(fecha: Date | string): string {
    if (!fecha) return 'N/A';
    const d = fecha instanceof Date ? fecha : new Date(fecha);
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatearNumero(num: number): string {
    return num.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  necesitaMantenimiento(piscina: Piscina): boolean {
    const piscinaData = new PiscinaData(piscina);
    return piscinaData.necesitaMantenimiento();
  }

 

}