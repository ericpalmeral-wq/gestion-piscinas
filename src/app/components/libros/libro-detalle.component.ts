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
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  generandoPDF = signal(false);
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

  // ===== Descargar PDF =====
  async descargarPDF(): Promise<void> {
    if (!this.libro()) return;
    
    this.generandoPDF.set(true);
    
    try {
      const doc = new jsPDF();
      const libro = this.libro()!;
      const piscinaNombre = this.piscina()?.nombre || 'Piscina';
      let yPos = 20;
      
      // ===== PORTADA =====
      doc.setFontSize(22);
      doc.setTextColor(59, 130, 246);
      doc.text('LIBRO DE REGISTRO', 105, 60, { align: 'center' });
      doc.text('DE PISCINA', 105, 72, { align: 'center' });
      
      doc.setFontSize(18);
      doc.setTextColor(0, 0, 0);
      doc.text(piscinaNombre, 105, 100, { align: 'center' });
      
      const id = libro.identificacionPiscina;
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(id.direccion || '', 105, 115, { align: 'center' });
      doc.text(`${id.municipio || ''} - ${id.provincia || ''}`, 105, 125, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text(`Generado el ${new Date().toLocaleDateString('es-ES')}`, 105, 250, { align: 'center' });
      
      // ===== PÁGINA 2: IDENTIFICACIÓN =====
      doc.addPage();
      yPos = 20;
      
      doc.setFontSize(16);
      doc.setTextColor(139, 92, 246);
      doc.text('1. IDENTIFICACIÓN DE LA PISCINA', 14, yPos);
      yPos += 12;
      
      // Datos generales
      doc.setFontSize(11);
      doc.setTextColor(59, 130, 246);
      doc.text('Datos Generales', 14, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      const datosGenerales = [
        ['Nombre', id.nombrePiscina || piscinaNombre],
        ['Dirección', id.direccion || 'N/A'],
        ['Municipio', id.municipio || 'N/A'],
        ['Código Postal', id.codigoPostal || 'N/A'],
        ['Provincia', id.provincia || 'N/A'],
        ['Tipo de Piscina', id.tipoPiscina || 'N/A'],
        ['Uso', id.uso || 'N/A'],
        ['Apertura Temporada', id.fechaAperturaTemporada || 'N/A'],
        ['Cierre Temporada', id.fechaCierreTemporada || 'N/A']
      ];
      
      autoTable(doc, {
        startY: yPos,
        head: [['Campo', 'Valor']],
        body: datosGenerales,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [139, 92, 246] },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
        margin: { left: 14, right: 14 }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 12;
      
      // Datos del titular
      doc.setFontSize(11);
      doc.setTextColor(59, 130, 246);
      doc.text('Datos del Titular', 14, yPos);
      yPos += 8;
      
      const datosTitular = [
        ['Nombre/Razón Social', id.titular?.nombre || 'N/A'],
        ['NIF/CIF', id.titular?.nifCif || 'N/A'],
        ['Teléfono', id.titular?.telefono || 'N/A'],
        ['Email', id.titular?.email || 'N/A']
      ];
      
      autoTable(doc, {
        startY: yPos,
        head: [['Campo', 'Valor']],
        body: datosTitular,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [139, 92, 246] },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
        margin: { left: 14, right: 14 }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 15;
      
      // ===== DATOS DE VASOS =====
      if (libro.datosVasos && libro.datosVasos.length > 0) {
        if (yPos > 200) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(16);
        doc.setTextColor(139, 92, 246);
        doc.text('2. DATOS DE LOS VASOS', 14, yPos);
        yPos += 10;
        
        const datosVasos = libro.datosVasos.map(v => [
          v.idVaso || '-',
          v.tipoVaso || '-',
          v.usoVaso || '-',
          v.volumenM3?.toString() || '-',
          v.superficieM2?.toString() || '-',
          `${v.profundidadMinimaM || '-'} - ${v.profundidadMaximaM || '-'}`,
          v.sistemaTratamiento || '-',
          v.tipoDesinfectante || '-'
        ]);
        
        autoTable(doc, {
          startY: yPos,
          head: [['ID', 'Tipo', 'Uso', 'Vol (m³)', 'Sup (m²)', 'Prof (m)', 'Tratamiento', 'Desinfectante']],
          body: datosVasos,
          styles: { fontSize: 7 },
          headStyles: { fillColor: [16, 185, 129] },
          margin: { left: 14, right: 14 }
        });
        
        yPos = (doc as any).lastAutoTable.finalY + 15;
      }
      
      // ===== CONTROLES DIARIOS DE AGUA =====
      doc.addPage();
      yPos = 20;
      
      doc.setFontSize(16);
      doc.setTextColor(139, 92, 246);
      doc.text('3. CONTROLES DIARIOS DE AGUA', 14, yPos);
      yPos += 10;
      
      if (libro.controlesDiariosAgua && libro.controlesDiariosAgua.length > 0) {
        const datosControles = libro.controlesDiariosAgua.map(c => [
          c.fecha || '-',
          c.hora || '-',
          c.idVaso || '-',
          c.ph?.toString() || '-',
          c.desinfectanteResidualLibreMgL?.toString() || '-',
          c.desinfectanteResidualCombinadoMgL?.toString() || '-',
          c.turbidezNTU?.toString() || '-',
          c.temperaturaAguaC?.toString() || '-',
          c.transparenciaCorrecta ? 'Sí' : 'No'
        ]);
        
        autoTable(doc, {
          startY: yPos,
          head: [['Fecha', 'Hora', 'Vaso', 'pH', 'Cl Libre', 'Cl Comb.', 'Turbidez', 'Temp', 'Transp.']],
          body: datosControles,
          styles: { fontSize: 7 },
          headStyles: { fillColor: [59, 130, 246] },
          margin: { left: 14, right: 14 },
          didDrawPage: (data: any) => {
            yPos = data.cursor.y;
          }
        });
        
        yPos = (doc as any).lastAutoTable.finalY + 15;
      } else {
        doc.setFontSize(10);
        doc.setTextColor(128, 128, 128);
        doc.text('No hay controles diarios registrados', 14, yPos);
        yPos += 15;
      }
      
      // ===== CONTROLES DE AIRE (PISCINAS CUBIERTAS) =====
      if (libro.controlesAirePiscinaCubierta && libro.controlesAirePiscinaCubierta.length > 0) {
        doc.addPage();
        yPos = 20;
        
        doc.setFontSize(16);
        doc.setTextColor(139, 92, 246);
        doc.text('4. CONTROLES DE AIRE (PISCINA CUBIERTA)', 14, yPos);
        yPos += 10;
        
        const datosAire = libro.controlesAirePiscinaCubierta.map(c => [
          c.fecha || '-',
          c.hora || '-',
          c.temperaturaAmbienteC?.toString() || '-',
          c.humedadRelativaPorcentaje?.toString() || '-',
          c.co2Ppm?.toString() || '-',
          c.cloroAmbienteMgM3?.toString() || '-',
          c.observaciones?.substring(0, 25) || '-'
        ]);
        
        autoTable(doc, {
          startY: yPos,
          head: [['Fecha', 'Hora', 'Temp (°C)', 'Humedad (%)', 'CO₂ (ppm)', 'Cl Amb.', 'Observaciones']],
          body: datosAire,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [234, 179, 8] },
          margin: { left: 14, right: 14 }
        });
        
        yPos = (doc as any).lastAutoTable.finalY + 15;
      }
      
      // ===== CONTROLES PERIÓDICOS =====
      if (libro.controlesPeriodicosAgua && libro.controlesPeriodicosAgua.length > 0) {
        doc.addPage();
        yPos = 20;
        
        doc.setFontSize(16);
        doc.setTextColor(139, 92, 246);
        doc.text('5. CONTROLES PERIÓDICOS DE AGUA', 14, yPos);
        yPos += 10;
        
        const datosPeriodicos = libro.controlesPeriodicosAgua.map(c => [
          c.fechaMuestreo || '-',
          c.idVaso || '-',
          c.ph?.toString() || '-',
          c.desinfectanteResidualLibreMgL?.toString() || '-',
          c.turbidezNTU?.toString() || '-',
          c.eColiUfc100ml?.toString() || '-',
          c.pseudomonasAeruginosaUfc100ml?.toString() || '-',
          c.resultadoConforme ? 'Sí' : 'No',
          c.laboratorio || '-'
        ]);
        
        autoTable(doc, {
          startY: yPos,
          head: [['Fecha', 'Vaso', 'pH', 'Cl Libre', 'Turbidez', 'E.Coli', 'Pseudom.', 'Conforme', 'Lab.']],
          body: datosPeriodicos,
          styles: { fontSize: 7 },
          headStyles: { fillColor: [139, 92, 246] },
          margin: { left: 14, right: 14 }
        });
        
        yPos = (doc as any).lastAutoTable.finalY + 15;
      }
      
      // ===== INCIDENCIAS =====
      doc.addPage();
      yPos = 20;
      
      doc.setFontSize(16);
      doc.setTextColor(139, 92, 246);
      doc.text('6. INCIDENCIAS', 14, yPos);
      yPos += 10;
      
      if (libro.incidencias && libro.incidencias.length > 0) {
        const datosIncidencias = libro.incidencias.map(i => [
          i.fecha || '-',
          i.hora || '-',
          i.idVaso || '-',
          i.descripcionIncidencia?.substring(0, 30) || '-',
          i.parametroAfectado || '-',
          i.valorDetectado || '-',
          i.medidasCorrectoras?.substring(0, 25) || '-',
          i.fechaResolucion || 'Pendiente'
        ]);
        
        autoTable(doc, {
          startY: yPos,
          head: [['Fecha', 'Hora', 'Vaso', 'Descripción', 'Parámetro', 'Valor', 'Medidas', 'Resolución']],
          body: datosIncidencias,
          styles: { fontSize: 7 },
          headStyles: { fillColor: [239, 68, 68] },
          margin: { left: 14, right: 14 }
        });
        
        yPos = (doc as any).lastAutoTable.finalY + 15;
      } else {
        doc.setFontSize(10);
        doc.setTextColor(128, 128, 128);
        doc.text('No hay incidencias registradas', 14, yPos);
        yPos += 15;
      }
      
      // ===== TRATAMIENTOS DE AGUA =====
      doc.addPage();
      yPos = 20;
      
      doc.setFontSize(16);
      doc.setTextColor(139, 92, 246);
      doc.text('7. TRATAMIENTOS DE AGUA', 14, yPos);
      yPos += 10;
      
      if (libro.tratamientosAgua && libro.tratamientosAgua.length > 0) {
        const datosTratamientos = libro.tratamientosAgua.map(t => [
          t.fecha || '-',
          t.hora || '-',
          t.idVaso || '-',
          t.productoUtilizado || '-',
          t.dosisAplicada || '-',
          t.motivoTratamiento?.substring(0, 30) || '-',
          t.responsable || '-'
        ]);
        
        autoTable(doc, {
          startY: yPos,
          head: [['Fecha', 'Hora', 'Vaso', 'Producto', 'Dosis', 'Motivo', 'Responsable']],
          body: datosTratamientos,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [16, 185, 129] },
          margin: { left: 14, right: 14 }
        });
        
        yPos = (doc as any).lastAutoTable.finalY + 15;
      } else {
        doc.setFontSize(10);
        doc.setTextColor(128, 128, 128);
        doc.text('No hay tratamientos registrados', 14, yPos);
        yPos += 15;
      }
      
      // ===== MANTENIMIENTO DE INSTALACIONES =====
      if (yPos > 200) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(16);
      doc.setTextColor(139, 92, 246);
      doc.text('8. MANTENIMIENTO DE INSTALACIONES', 14, yPos);
      yPos += 10;
      
      if (libro.mantenimientoInstalaciones && libro.mantenimientoInstalaciones.length > 0) {
        const datosMantenimiento = libro.mantenimientoInstalaciones.map(m => [
          m.fecha || '-',
          m.tipoMantenimiento || '-',
          m.descripcion?.substring(0, 35) || '-',
          m.empresaResponsable || '-',
          m.tecnico || '-'
        ]);
        
        autoTable(doc, {
          startY: yPos,
          head: [['Fecha', 'Tipo', 'Descripción', 'Empresa', 'Técnico']],
          body: datosMantenimiento,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [107, 114, 128] },
          margin: { left: 14, right: 14 }
        });
        
        yPos = (doc as any).lastAutoTable.finalY + 15;
      } else {
        doc.setFontSize(10);
        doc.setTextColor(128, 128, 128);
        doc.text('No hay mantenimientos registrados', 14, yPos);
        yPos += 15;
      }
      
      // ===== RESUMEN ANUAL SILOE =====
      if (libro.resumenAnualSILOE) {
        if (yPos > 180) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(16);
        doc.setTextColor(139, 92, 246);
        doc.text('9. RESUMEN ANUAL SILOE', 14, yPos);
        yPos += 10;
        
        const s = libro.resumenAnualSILOE;
        const datosResumen = [
          ['Año', s.anio || 'N/A'],
          ['Nº Total Muestreos', s.numeroTotalMuestreos?.toString() || '0'],
          ['Nº Muestreos Conformes', s.numeroMuestreosConformes?.toString() || '0'],
          ['Nº Incidencias', s.numeroIncidencias?.toString() || '0'],
          ['pH Medio', s.valorMedioPh?.toString() || '-'],
          ['pH Mínimo', s.valorMinimoPh?.toString() || '-'],
          ['pH Máximo', s.valorMaximoPh?.toString() || '-'],
          ['Desinfectante Medio', s.valorMedioDesinfectante?.toString() || '-'],
          ['Desinfectante Mínimo', s.valorMinimoDesinfectante?.toString() || '-'],
          ['Desinfectante Máximo', s.valorMaximoDesinfectante?.toString() || '-']
        ];
        
        autoTable(doc, {
          startY: yPos,
          head: [['Indicador', 'Valor']],
          body: datosResumen,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [59, 130, 246] },
          columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } },
          margin: { left: 14, right: 100 }
        });
      }
      
      // ===== PIE DE PÁGINA EN TODAS LAS PÁGINAS =====
      const totalPaginas = doc.getNumberOfPages();
      for (let i = 1; i <= totalPaginas; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`Página ${i} de ${totalPaginas}`, 105, 290, { align: 'center' });
        if (i > 1) {
          doc.text(`${piscinaNombre} - Libro de Registro`, 14, 290);
        }
      }
      
      // Descargar
      doc.save(`Libro_Registro_${piscinaNombre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (error) {
      console.error('Error al generar PDF:', error);
      this.error.set('Error al generar el PDF');
    } finally {
      this.generandoPDF.set(false);
    }
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
