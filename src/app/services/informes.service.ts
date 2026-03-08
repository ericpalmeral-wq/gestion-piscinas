import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, query, where, doc, deleteDoc, updateDoc, getDoc } from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Informe } from '../models/informe';
import { LineaInforme } from '../models/linea-informe';

@Injectable({ providedIn: 'root' })
export class InformesService {
  private firestore = inject(Firestore);
  private informesCollection = collection(this.firestore, 'informes');

  obtenerTodosLosInformes(): Observable<Informe[]> {
    return from(getDocs(this.informesCollection)).pipe(
      map(snapshot => snapshot.docs.map(doc => this.formatearInforme(doc)))
    );
  }

  obtenerInforme(id: string): Observable<Informe | null> {
    const docRef = doc(this.firestore, 'informes', id);
    return from(getDoc(docRef)).pipe(
      map(docSnapshot => {
        if (!docSnapshot.exists()) {
          return null;
        }
        return this.formatearInforme(docSnapshot);
      })
    );
  }

  obtenerInformesPorPiscina(piscinaId: string): Observable<Informe[]> {
    const q = query(this.informesCollection, where('piscinaId', '==', piscinaId));
    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(doc => this.formatearInforme(doc)))
    );
  }

  obtenerInformePorPiscina(piscinaId: string): Observable<Informe | null> {
    const q = query(this.informesCollection, where('piscinaId', '==', piscinaId));
    return from(getDocs(q)).pipe(
      map(snapshot => {
        if (snapshot.docs.length === 0) {
          return null;
        }
        return this.formatearInforme(snapshot.docs[0]);
      })
    );
  }

  agregarInforme(informe: Omit<Informe, 'id'>): Promise<string> {
    const data = {
      ...informe,
      fechaCreacion: informe.fechaCreacion || new Date().toISOString(),
      fechaActualizacion: informe.fechaActualizacion || new Date().toISOString(),
      lineas: informe.lineas || [],
      estadoGeneral: informe.estadoGeneral || 'bien'
    };
    return addDoc(this.informesCollection, data).then(docRef => docRef.id);
  }

  actualizarInforme(id: string, informe: Partial<Informe>): Promise<void> {
    const docRef = doc(this.firestore, 'informes', id);
    const data = {
      ...informe,
      fechaActualizacion: new Date().toISOString()
    };
    return updateDoc(docRef, data);
  }

  eliminarInforme(id: string): Promise<void> {
    const docRef = doc(this.firestore, 'informes', id);
    return deleteDoc(docRef);
  }

  private formatearInforme(doc: any): Informe {
    const data = doc.data();
    return {
      id: doc.id,
      piscinaId: data['piscinaId'],
      fechaCreacion: data['fechaCreacion'],
      fechaActualizacion: data['fechaActualizacion'],
      estadoGeneral: data['estadoGeneral'] || 'bien',
      lineas: data['lineas'] || []
    } as Informe;
  }

  /**
   * Agrega datos de prueba para testing
   */
  async agregarDatosPrueba(piscinasIds: string[]): Promise<void> {
    const informesPrueba: Omit<Informe, 'id'>[] = [
      {
        piscinaId: piscinasIds[0],
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
        estadoGeneral: 'bien',
        lineas: [
          { descripcion: 'Cloro dentro de los límites permitidos', estado: 'bien' },
          { descripcion: 'pH correctamente equilibrado', estado: 'bien' },
          { descripcion: 'Sistema de filtración funcionando correctamente', estado: 'bien' }
        ]
      },
      {
        piscinaId: piscinasIds[1],
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
        estadoGeneral: 'bien',
        lineas: [
          { descripcion: 'Agua cristalina y transparente', estado: 'bien' },
          { descripcion: 'Temperatura ideal mantenida', estado: 'bien' },
          { descripcion: 'Sin signos de contaminación', estado: 'bien' }
        ]
      },
      {
        piscinaId: piscinasIds[2],
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
        estadoGeneral: 'bien',
        lineas: [
          { descripcion: 'Cumple estándares olímpicos', estado: 'bien' },
          { descripcion: 'Recirculación funcionando perfectamente', estado: 'bien' },
          { descripcion: 'Señalización completa y visible', estado: 'bien' }
        ]
      },
      {
        piscinaId: piscinasIds[3],
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
        estadoGeneral: 'regular',
        lineas: [
          { descripcion: 'Cloro ligeramente elevado', estado: 'regular' },
          { descripcion: 'Materias flotantes removidas', estado: 'bien' },
          { descripcion: 'Requiere alcalinidad', estado: 'regular' }
        ]
      },
      {
        piscinaId: piscinasIds[4],
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
        estadoGeneral: 'bien',
        lineas: [
          { descripcion: 'Mantenimiento rutinario completado', estado: 'bien' },
          { descripcion: 'Equipos de seguridad inspeccionados', estado: 'bien' },
          { descripcion: 'Sistema de bombeo funcionando óptimamente', estado: 'bien' }
        ]
      },
      {
        piscinaId: piscinasIds[5],
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
        estadoGeneral: 'bien',
        lineas: [
          { descripcion: 'Temperatura termal mantenida en 32°C', estado: 'bien' },
          { descripcion: 'Sistemas de desinfección activos', estado: 'bien' },
          { descripcion: 'Calidad de agua óptima para terapia', estado: 'bien' }
        ]
      },
      {
        piscinaId: piscinasIds[6],
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
        estadoGeneral: 'bien',
        lineas: [
          { descripcion: 'Seguridad en niveles permitidos', estado: 'bien' },
          { descripcion: 'Profundidad controlada para educación', estado: 'bien' },
          { descripcion: 'Equipamiento educativo disponible', estado: 'bien' }
        ]
      },
      {
        piscinaId: piscinasIds[7],
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
        estadoGeneral: 'regular',
        lineas: [
          { descripcion: 'Cloro dentro de parámetros', estado: 'bien' },
          { descripcion: 'Requiere limpieza de paredes', estado: 'regular' },
          { descripcion: 'pH a normalizar', estado: 'regular' }
        ]
      },
      {
        piscinaId: piscinasIds[8],
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
        estadoGeneral: 'bien',
        lineas: [
          { descripcion: 'Aireación suficiente para terapia', estado: 'bien' },
          { descripcion: 'Niveles de cloro bajos y seguros', estado: 'bien' },
          { descripcion: 'Agua suave y segura', estado: 'bien' }
        ]
      },
      {
        piscinaId: piscinasIds[9],
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
        estadoGeneral: 'bien',
        lineas: [
          { descripcion: 'Sistema de recirculación activo', estado: 'bien' },
          { descripcion: 'Piscina lista para apertura', estado: 'bien' },
          { descripcion: 'Todas las medidas de seguridad en lugar', estado: 'bien' }
        ]
      }
    ];

    for (const informe of informesPrueba) {
      await this.agregarInforme(informe);
    }
  }
}
