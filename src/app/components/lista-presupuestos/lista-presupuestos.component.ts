import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PresupuestosService } from '../../services/presupuestos.service';
import { Presupuesto } from '../../models/presupuesto';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-lista-presupuestos',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './lista-presupuestos.component.html',
  styleUrls: ['./lista-presupuestos.component.css']
})
export class ListaPresupuestosComponent implements OnInit {
  presupuestos: Presupuesto[] = [];
  cargando = true;
  error: string | null = null;
  paginaActual: number = 0;
  terminoBuscador: string = '';
  readonly elementosPorPagina = 10;

  // Modal
  presupuestoSeleccionado: Presupuesto | null = null;
  mostrarModal = false;

  private presupuestosService = inject(PresupuestosService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.cargarPresupuestos();
  }

  cargarPresupuestos(): void {
    this.cargando = true;
    this.error = null;
    this.presupuestosService.obtenerTodosLosPresupuestos().subscribe({
      next: (presupuestos) => {
        this.presupuestos = presupuestos.sort((a, b) => 
          new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
        );
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = 'Error al cargar los presupuestos: ' + (err?.message || 'desconocido');
        this.cargando = false;
        this.cdr.markForCheck();
      }
    });
  }

  verPresupuesto(id: string | undefined): void {
    if (id) {
      this.router.navigate(['/presupuestos', id]);
    }
  }

  eliminarPresupuesto(id: string | undefined): void {
    if (id && confirm('¿Estás seguro de que deseas eliminar este presupuesto?')) {
      this.presupuestosService.eliminarPresupuesto(id).then(() => {
        this.cargarPresupuestos();
      });
    }
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  obtenerClaseEstado(estado: string): string {
    return estado === 'aceptado' ? 'estado-aceptado' : 'estado-pendiente';
  }

  cambiarEstado(presupuesto: Presupuesto): void {
    const nuevoEstado = presupuesto.estado === 'pendiente' ? 'aceptado' : 'pendiente';
    this.presupuestosService.actualizarPresupuesto(presupuesto.id!, { estado: nuevoEstado }).then(() => {
      presupuesto.estado = nuevoEstado;
      this.cdr.markForCheck();
    }).catch(err => {
      console.error('Error al cambiar estado:', err);
    });
  }

  calcularTotal(lineas: { total: number }[]): number {
    return lineas.reduce((acc, l) => acc + l.total, 0);
  }

  descargarPDF(presupuesto: Presupuesto): void {
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
    doc.text('Presupuesto', 20, 42);

    // Información del presupuesto
    yPosition = 60;
    doc.setFontSize(14);
    doc.setTextColor(102, 126, 234);
    doc.setFont('helvetica', 'bold');
    doc.text('Descripción:', 20, yPosition);

    yPosition += 8;
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    const descLines = doc.splitTextToSize(presupuesto.descripcion, 170);
    doc.text(descLines, 20, yPosition);
    yPosition += descLines.length * 5 + 5;

    // Fecha
    doc.setFontSize(11);
    doc.setTextColor(102, 126, 234);
    doc.setFont('helvetica', 'bold');
    doc.text('Fecha:', 20, yPosition);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text(this.formatearFecha(presupuesto.fechaCreacion), 60, yPosition);
    yPosition += 10;

    // Estado
    doc.setTextColor(102, 126, 234);
    doc.setFont('helvetica', 'bold');
    doc.text('Estado:', 20, yPosition);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text(presupuesto.estado.toUpperCase(), 60, yPosition);
    yPosition += 15;

    // Tabla de líneas
    if (presupuesto.lineas && presupuesto.lineas.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(102, 126, 234);
      doc.setFont('helvetica', 'bold');
      doc.text('Líneas del Presupuesto:', 20, yPosition);
      yPosition += 10;

      // Encabezados de tabla
      doc.setFillColor(102, 126, 234);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.rect(20, yPosition - 5, 170, 7, 'F');
      doc.text('Descripción', 25, yPosition);
      doc.text('Cantidad', 120, yPosition);
      doc.text('Precio Unitario', 135, yPosition);
      doc.text('Total', 165, yPosition);
      yPosition += 8;

      // Filas de datos
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      presupuesto.lineas.forEach(linea => {
        doc.text((linea as any).descripcion.substring(0, 25), 25, yPosition);
        doc.text((linea as any).cantidad.toString(), 120, yPosition);
        doc.text('$' + (linea as any).precioUnitario.toFixed(2), 135, yPosition);
        doc.text('$' + linea.total.toFixed(2), 165, yPosition);
        yPosition += 6;
      });

      yPosition += 2;
      doc.setDrawColor(102, 126, 234);
      doc.line(20, yPosition, 190, yPosition);
      yPosition += 5;

      // Total
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(102, 126, 234);
      doc.text('TOTAL:', 135, yPosition);
      doc.setTextColor(0, 0, 0);
      doc.text('$' + this.calcularTotal(presupuesto.lineas).toFixed(2), 165, yPosition);
    }

    doc.save(`presupuesto-${presupuesto.descripcion.substring(0, 20)}.pdf`);
  }

  crearNuevoPresupuesto(): void {
    this.router.navigate(['/presupuestos/nuevo']);
  }

  // Filtrado
  get presupuestosFiltrados(): Presupuesto[] {
    const termino = this.terminoBuscador.toLowerCase().trim();
    if (!termino) {
      return this.presupuestos;
    }
    return this.presupuestos.filter(presupuesto =>
      presupuesto.descripcion.toLowerCase().includes(termino)
    );
  }

  // Paginación
  get presupuestosPaginados(): Presupuesto[] {
    const inicio = this.paginaActual * this.elementosPorPagina;
    const fin = inicio + this.elementosPorPagina;
    return this.presupuestosFiltrados.slice(inicio, fin);
  }

  get totalPaginas(): number {
    return Math.ceil(this.presupuestosFiltrados.length / this.elementosPorPagina);
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

  // Modal methods
  abrirModal(presupuesto: Presupuesto): void {
    this.presupuestoSeleccionado = { ...presupuesto, lineas: [...presupuesto.lineas] };
    this.mostrarModal = true;
    this.cdr.detectChanges();
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.presupuestoSeleccionado = null;
    this.cdr.detectChanges();
  }

  cambiarEstadoModal(nuevoEstado: 'pendiente' | 'aceptado'): void {
    console.log('cambiarEstadoModal llamado con:', nuevoEstado);
    if (!this.presupuestoSeleccionado?.id) {
      console.log('No hay presupuesto seleccionado o no tiene ID');
      return;
    }
    
    const id = this.presupuestoSeleccionado.id;
    console.log('Actualizando presupuesto con ID:', id);
    
    this.presupuestosService.actualizarPresupuesto(id, { estado: nuevoEstado }).then(() => {
      console.log('Actualización exitosa, nuevo estado:', nuevoEstado);
      // Actualizar en el modal - crear nuevo objeto para forzar detección
      if (this.presupuestoSeleccionado && this.presupuestoSeleccionado.id === id) {
        this.presupuestoSeleccionado = {
          ...this.presupuestoSeleccionado,
          estado: nuevoEstado
        };
      }
      // Actualizar en la lista principal
      const index = this.presupuestos.findIndex(p => p.id === id);
      if (index !== -1) {
        this.presupuestos[index] = { ...this.presupuestos[index], estado: nuevoEstado };
      }
      this.cdr.detectChanges();
    }).catch(err => {
      console.error('Error al cambiar estado:', err);
    });
  }
}
