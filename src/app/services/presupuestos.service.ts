import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, query, where, doc, deleteDoc, updateDoc, getDoc } from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Presupuesto } from '../models/presupuesto';
import { LineaPresupuesto } from '../models/linea-presupuesto';

@Injectable({ providedIn: 'root' })
export class PresupuestosService {
  private firestore = inject(Firestore);
  private presupuestosCollection = collection(this.firestore, 'presupuestos');

  obtenerTodosLosPresupuestos(): Observable<Presupuesto[]> {
    return from(getDocs(this.presupuestosCollection)).pipe(
      map(snapshot => snapshot.docs.map(doc => this.formatearPresupuesto(doc)))
    );
  }

  obtenerPresupuesto(id: string): Observable<Presupuesto | null> {
    const docRef = doc(this.firestore, 'presupuestos', id);
    return from(getDoc(docRef)).pipe(
      map(docSnapshot => {
        if (!docSnapshot.exists()) {
          return null;
        }
        return this.formatearPresupuesto(docSnapshot);
      })
    );
  }

  obtenerPresupuestosPorPiscina(piscinaId: string): Observable<Presupuesto[]> {
    const q = query(this.presupuestosCollection, where('piscinaId', '==', piscinaId));
    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(doc => this.formatearPresupuesto(doc)))
    );
  }

  agregarPresupuesto(presupuesto: Omit<Presupuesto, 'id'>): Promise<string> {
    // Asegura que fechaCreacion y estado estén presentes
    const data = {
      ...presupuesto,
      fechaCreacion: presupuesto.fechaCreacion || new Date().toISOString(),
      lineas: presupuesto.lineas || [],
      estado: presupuesto.estado || 'pendiente'
    };
    return addDoc(this.presupuestosCollection, data).then(docRef => docRef.id);
  }

  actualizarPresupuesto(id: string, presupuesto: Partial<Presupuesto>): Promise<void> {
    const docRef = doc(this.firestore, 'presupuestos', id);
    return updateDoc(docRef, presupuesto);
  }

  eliminarPresupuesto(id: string): Promise<void> {
    const docRef = doc(this.firestore, 'presupuestos', id);
    return deleteDoc(docRef);
  }

  private formatearPresupuesto(doc: any): Presupuesto {
    const data = doc.data();
    return {
      id: doc.id,
      piscinaId: data['piscinaId'],
      fechaCreacion: data['fechaCreacion'],
      descripcion: data['descripcion'],
      lineas: data['lineas'] || [],
      estado: typeof data['estado'] === 'string' ? data['estado'] : 'pendiente'
    } as Presupuesto;
  }

  /**
   * Agrega datos de prueba para testing
   */
  async agregarDatosPrueba(piscinasIds: string[]): Promise<void> {
    const presupuestosPrueba: Omit<Presupuesto, 'id'>[] = [
      {
        piscinaId: piscinasIds[0],
        fechaCreacion: new Date().toISOString(),
        descripcion: 'Mantenimiento trimestral Centro',
        lineas: [
          { descripcion: 'Limpieza profunda de filtros', cantidad: 1, precioUnitario: 250, total: 250 },
          { descripcion: 'Inspección de bombas', cantidad: 1, precioUnitario: 150, total: 150 },
          { descripcion: 'Balanceo químico', cantidad: 1, precioUnitario: 100, total: 100 }
        ],
        estado: 'aceptado'
      },
      {
        piscinaId: piscinasIds[1],
        fechaCreacion: new Date().toISOString(),
        descripcion: 'Revisión seguridad infantil',
        lineas: [
          { descripcion: 'Inspección regulaciones de seguridad', cantidad: 1, precioUnitario: 200, total: 200 },
          { descripcion: 'Reemplazo de señalización', cantidad: 6, precioUnitario: 25, total: 150 }
        ],
        estado: 'pendiente'
      },
      {
        piscinaId: piscinasIds[2],
        fechaCreacion: new Date().toISOString(),
        descripcion: 'Certificación olímpica anual',
        lineas: [
          { descripcion: 'Certificación de estándares FINA', cantidad: 1, precioUnitario: 500, total: 500 },
          { descripcion: 'Calibración de equipos de medición', cantidad: 1, precioUnitario: 300, total: 300 }
        ],
        estado: 'aceptado'
      },
      {
        piscinaId: piscinasIds[3],
        fechaCreacion: new Date().toISOString(),
        descripcion: 'Mantenimiento resort mensual',
        lineas: [
          { descripcion: 'Limpieza y desinfección', cantidad: 4, precioUnitario: 100, total: 400 },
          { descripcion: 'Reembrazo de productos químicos', cantidad: 1, precioUnitario: 200, total: 200 },
          { descripcion: 'Verificación de sistemas automáticos', cantidad: 1, precioUnitario: 150, total: 150 }
        ],
        estado: 'aceptado'
      },
      {
        piscinaId: piscinasIds[4],
        fechaCreacion: new Date().toISOString(),
        descripcion: 'Reparación urgente filtración',
        lineas: [
          { descripcion: 'Reparación de válvulas de filtración', cantidad: 2, precioUnitario: 180, total: 360 },
          { descripcion: 'Reemplazo de mangueras', cantidad: 3, precioUnitario: 50, total: 150 }
        ],
        estado: 'pendiente'
      },
      {
        piscinaId: piscinasIds[5],
        fechaCreacion: new Date().toISOString(),
        descripcion: 'Mantenimiento sistema termal',
        lineas: [
          { descripcion: 'Inspección calentador termal', cantidad: 1, precioUnitario: 400, total: 400 },
          { descripcion: 'Limpieza de circuitos de agua caliente', cantidad: 1, precioUnitario: 250, total: 250 }
        ],
        estado: 'aceptado'
      },
      {
        piscinaId: piscinasIds[6],
        fechaCreacion: new Date().toISOString(),
        descripcion: 'Actualizaciones para educación',
        lineas: [
          { descripcion: 'Instalación sistemas de enseñanza', cantidad: 1, precioUnitario: 600, total: 600 },
          { descripcion: 'Equipo de salvamento y primeros auxilios', cantidad: 1, precioUnitario: 350, total: 350 }
        ],
        estado: 'pendiente'
      },
      {
        piscinaId: piscinasIds[7],
        fechaCreacion: new Date().toISOString(),
        descripcion: 'Reformas piscina residencial',
        lineas: [
          { descripcion: 'Repintado de líneas de carril', cantidad: 60, precioUnitario: 5, total: 300 },
          { descripcion: 'Reemplazo de juntas', cantidad: 1, precioUnitario: 200, total: 200 }
        ],
        estado: 'aceptado'
      },
      {
        piscinaId: piscinasIds[8],
        fechaCreacion: new Date().toISOString(),
        descripcion: 'Equipo terapéutico especializado',
        lineas: [
          { descripcion: 'Jets de masaje hidroterapia', cantidad: 4, precioUnitario: 150, total: 600 },
          { descripcion: 'Sistema de escalones ajustables', cantidad: 1, precioUnitario: 800, total: 800 }
        ],
        estado: 'pendiente'
      },
      {
        piscinaId: piscinasIds[9],
        fechaCreacion: new Date().toISOString(),
        descripcion: 'Mantenimiento parque acuático',
        lineas: [
          { descripcion: 'Inspección toboganes y estructuras', cantidad: 1, precioUnitario: 500, total: 500 },
          { descripcion: 'Reprogramación de sistema de recirculación', cantidad: 1, precioUnitario: 400, total: 400 },
          { descripcion: 'Mantenimiento de sistema de seguridad', cantidad: 1, precioUnitario: 300, total: 300 }
        ],
        estado: 'aceptado'
      }
    ];

    for (const presupuesto of presupuestosPrueba) {
      await this.agregarPresupuesto(presupuesto);
    }
  }
}
