import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import { InformesService } from '../../services/informes.service';
import { PiscinasService } from '../../services/piscinas.service';
import { Informe } from '../../models/informe';
import { Piscina } from '../../models/piscina';

@Component({
  selector: 'app-lista-informes',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './lista-informes.component.html',
  styleUrls: ['./lista-informes.component.css']
})
export class ListaInformesComponent implements OnInit {
  informes: Informe[] = [];
  piscinas: Piscina[] = [];
  cargando = true;
  error: string | null = null;
  paginaActual: number = 0;
  terminoBuscador: string = '';
  readonly elementosPorPagina = 10;

  private informesService = inject(InformesService);
  private piscinasService = inject(PiscinasService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.cargarPiscinas();
    this.cargarInformes();
  }

  cargarPiscinas(): void {
    this.piscinasService.obtenerPiscinas().subscribe({
      next: (piscinas) => {
        this.piscinas = piscinas;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al cargar piscinas:', err);
      }
    });
  }

  cargarInformes(): void {
    this.cargando = true;
    this.error = null;
    this.informesService.obtenerTodosLosInformes().subscribe({
      next: (informes) => {
        this.informes = informes.sort((a, b) => 
          new Date(b.fechaActualizacion).getTime() - new Date(a.fechaActualizacion).getTime()
        );
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = 'Error al cargar los informes: ' + (err?.message || 'desconocido');
        this.cargando = false;
        this.cdr.markForCheck();
      }
    });
  }

  verInforme(id: string | undefined): void {
    if (id) {
      this.router.navigate(['/informes', id]);
    }
  }

  eliminarInforme(id: string | undefined): void {
    if (id && confirm('¿Estás seguro de que deseas eliminar este informe?')) {
      this.informesService.eliminarInforme(id).then(() => {
        this.cargarInformes();
      });
    }
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  obtenerClaseEstado(estado: string): string {
    switch (estado) {
      case 'bien':
        return 'estado-bien';
      case 'regular':
        return 'estado-regular';
      case 'mal':
        return 'estado-mal';
      default:
        return 'estado-bien';
    }
  }

  obtenerNombrePiscina(piscinaId: string): string {
    const piscina = this.piscinas.find(p => p.id === piscinaId);
    return piscina ? piscina.nombre : 'Sin especificar';
  }

  generarPDFInforme(informe: Informe): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 15;

    // Fondo de encabezado elegante
    doc.setFillColor(245, 158, 11);
    doc.rect(0, 0, pageWidth, 50, 'F');

    // Encabezado principal
    doc.setFontSize(28);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('GestiPool', 20, 28);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(245, 220, 180);
    doc.text('Sistema de Gestión de Piscinas', 20, 36);

    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORME TÉCNICO', pageWidth - 20, 28, { align: 'right' });

    // Contenido principal
    yPosition = 58;
    
    // Información general
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'bold');
    doc.text('Información General', 20, yPosition);
    
    yPosition += 8;
    
    const infoItems = [
      { label: 'Piscina:', value: this.obtenerNombrePiscina(informe.piscinaId) },
      { label: 'Fecha Creación:', value: this.formatearFecha(informe.fechaCreacion) },
      { label: 'Última Actualización:', value: this.formatearFecha(informe.fechaActualizacion) }
    ];

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    infoItems.forEach((info, idx) => {
      doc.setTextColor(80, 80, 80);
      doc.setFont('helvetica', 'bold');
      doc.text(info.label, 20, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);
      doc.text(info.value, 70, yPosition);
      yPosition += 6;
    });

    // Badge de estado general
    yPosition -= 6;
    const estadoColor = informe.estadoGeneral === 'bien' ? [16, 185, 129] : 
                       informe.estadoGeneral === 'regular' ? [251, 146, 60] : [239, 68, 68];
    doc.setFillColor(estadoColor[0], estadoColor[1], estadoColor[2]);
    doc.rect(pageWidth - 70, yPosition - 2, 50, 5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(`Estado: ${informe.estadoGeneral.toUpperCase()}`, pageWidth - 45, yPosition + 1, { align: 'center' });

    yPosition += 15;

    // Observaciones
    if (informe.observacion) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(80, 80, 80);
      doc.text('Observaciones:', 20, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);
      const obsLines = doc.splitTextToSize(informe.observacion, pageWidth - 90);
      doc.text(obsLines, 70, yPosition);
      yPosition += Math.max(obsLines.length * 5, 6) + 4;
    }

    // Línea separadora
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(0.5);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 8;

    // Inspecciones / Notas
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text('Inspecciones / Notas', 20, yPosition);
    yPosition += 8;

    if (informe.lineas.length === 0) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      doc.text('Sin inspecciones registradas', 20, yPosition);
    } else {
      // Nuevo formato: fila 1 = num + descripcion | fila 2 = observacion + estado
      const marginLeft = 20;
      const numWidth = 12;
      const totalWidth = pageWidth - 40;
      const estadoWidth = 40;
      const row1Height = 8;
      const row2Height = 20;
      const itemHeight = row1Height + row2Height;
      const bodyX = marginLeft + numWidth;
      const bodyWidth = totalWidth - numWidth;
      const obsWidth = bodyWidth - estadoWidth;
      const estadoX = bodyX + obsWidth;

      informe.lineas.forEach((linea, idx) => {
        if (yPosition + itemHeight > pageHeight - 25) {
          doc.addPage();
          yPosition = 20;
        }

        const bgColor: [number, number, number] = idx % 2 === 0 ? [245, 250, 255] : [255, 255, 255];
        const estadoColor: [number, number, number] = linea.estado === 'bien' ? [16, 185, 129] :
          linea.estado === 'regular' ? [251, 146, 60] : [239, 68, 68];
        const row2Y = yPosition + row1Height;

        // Num (abarca las dos filas)
        doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        doc.rect(marginLeft, yPosition, numWidth, itemHeight, 'F');
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'bold');
        doc.text((idx + 1).toString(), marginLeft + numWidth / 2, yPosition + row1Height / 2 + 2, { align: 'center' });

        // Fila 1 - Descripción (ancho completo)
        doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        doc.rect(bodyX, yPosition, bodyWidth, row1Height, 'F');
        doc.setFontSize(9);
        doc.setTextColor(30, 30, 30);
        doc.setFont('helvetica', 'bold');
        const descLines = doc.splitTextToSize(linea.descripcion || '', bodyWidth - 4);
        doc.text(descLines[0] || '', bodyX + 2, yPosition + 5);

        // Fila 2 - Observación
        doc.setFillColor(252, 252, 252);
        doc.rect(bodyX, row2Y, obsWidth, row2Height, 'F');
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        doc.setFont('helvetica', 'normal');
        const obsLines = doc.splitTextToSize(linea.observacion || '', obsWidth - 4);
        doc.text(obsLines.slice(0, 2), bodyX + 2, row2Y + 5);

        // Fila 2 - Estado
        doc.setFillColor(estadoColor[0], estadoColor[1], estadoColor[2]);
        doc.rect(estadoX, row2Y, estadoWidth, row2Height, 'F');
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text(linea.estado.toUpperCase(), estadoX + estadoWidth / 2, row2Y + row2Height / 2 + 2, { align: 'center' });

        // Bordes
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.3);
        doc.rect(marginLeft, yPosition, numWidth, itemHeight);
        doc.rect(bodyX, yPosition, bodyWidth, row1Height);
        doc.rect(bodyX, row2Y, obsWidth, row2Height);
        doc.rect(estadoX, row2Y, estadoWidth, row2Height);

        yPosition += itemHeight + 2;
      });
    }

    // Footer
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
    const nombreArchivo = `Informe_${this.obtenerNombrePiscina(informe.piscinaId).replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
    doc.save(nombreArchivo);
  }

  crearNuevoInforme(): void {
    this.router.navigate(['/informes/nuevo']);
  }

  // Filtrado
  get informesFiltrados(): Informe[] {
    const termino = this.terminoBuscador.toLowerCase().trim();
    if (!termino) {
      return this.informes;
    }
    return this.informes.filter(informe =>
      this.obtenerNombrePiscina(informe.piscinaId).toLowerCase().includes(termino)
    );
  }

  // Paginación
  get informesPaginados(): Informe[] {
    const inicio = this.paginaActual * this.elementosPorPagina;
    const fin = inicio + this.elementosPorPagina;
    return this.informesFiltrados.slice(inicio, fin);
  }

  get totalPaginas(): number {
    return Math.ceil(this.informesFiltrados.length / this.elementosPorPagina);
  }

  irAPagina(numero: number): void {
    if (numero >= 0 && numero < this.totalPaginas) {
      this.paginaActual = numero;
    }
  }

  paginaAnterior(): void {
    if (this.paginaActual > 0) {
      this.paginaActual--;
    }
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas - 1) {
      this.paginaActual++;
    }
  }

  actualizarBuscador(termino: string): void {
    this.terminoBuscador = termino;
    this.paginaActual = 0; // Volver a primera página al buscar
  }
}
