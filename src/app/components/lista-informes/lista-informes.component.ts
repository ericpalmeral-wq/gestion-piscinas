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
      // Tabla de inspecciones
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.setFillColor(245, 158, 11);
      
      const headers = ['#', 'Descripción', 'Estado'];
      const columnWidths = [15, 130, 35];
      let xPos = 20;

      headers.forEach((header, idx) => {
        doc.rect(xPos, yPosition, columnWidths[idx], 8, 'F');
        doc.text(header, xPos + columnWidths[idx] / 2, yPosition + 5, { align: 'center' });
        xPos += columnWidths[idx];
      });

      yPosition += 8;

      // Filas de inspecciones
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);
      
      informe.lineas.forEach((linea, idx) => {
        const bgColor = idx % 2 === 0 ? [245, 250, 255] : [255, 255, 255];
        const estadoColor = linea.estado === 'bien' ? [16, 185, 129] : 
                           linea.estado === 'regular' ? [251, 146, 60] : [239, 68, 68];

        // Dibuja fila - Número
        xPos = 20;
        doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        doc.rect(xPos, yPosition, columnWidths[0], 8, 'F');
        doc.setTextColor(50, 50, 50);
        doc.setFont('helvetica', 'normal');
        doc.text((idx + 1).toString(), xPos + columnWidths[0] / 2, yPosition + 5, { align: 'center' });
        
        // Dibuja fila - Descripción
        xPos += columnWidths[0];
        doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        doc.rect(xPos, yPosition, columnWidths[1], 8, 'F');
        doc.setTextColor(50, 50, 50);
        doc.setFont('helvetica', 'normal');
        const descripcionTruncada = linea.descripcion.length > 40 ? 
          linea.descripcion.substring(0, 37) + '...' : linea.descripcion;
        doc.text(descripcionTruncada, xPos + 3, yPosition + 5);
        
        // Dibuja fila - Estado
        xPos += columnWidths[1];
        doc.setFillColor(estadoColor[0], estadoColor[1], estadoColor[2]);
        doc.rect(xPos, yPosition, columnWidths[2], 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text(linea.estado.toUpperCase(), xPos + columnWidths[2] / 2, yPosition + 5, { align: 'center' });

        yPosition += 8;
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
