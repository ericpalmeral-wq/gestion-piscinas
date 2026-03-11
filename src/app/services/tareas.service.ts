import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, query, where, doc, deleteDoc, updateDoc, getDoc } from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Tarea } from '../models/tarea';

@Injectable({ providedIn: 'root' })
export class TareasService {
  private firestore = inject(Firestore);
  private tareasCollection = collection(this.firestore, 'tareas');

  obtenerTodasLasTareas(): Observable<Tarea[]> {
    return from(getDocs(this.tareasCollection)).pipe(
      map(snapshot => snapshot.docs.map(doc => this.formatearTarea(doc)))
    );
  }

  obtenerTarea(id: string): Observable<Tarea | null> {
    const docRef = doc(this.firestore, 'tareas', id);
    return from(getDoc(docRef)).pipe(
      map(docSnapshot => {
        if (!docSnapshot.exists()) {
          return null;
        }
        return this.formatearTarea(docSnapshot);
      })
    );
  }

  obtenerTareasPorPiscina(piscinaId: string): Observable<Tarea[]> {
    const q = query(this.tareasCollection, where('piscinaId', '==', piscinaId));
    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(doc => this.formatearTarea(doc)))
    );
  }

  agregarTarea(tarea: Omit<Tarea, 'id'>): Promise<string> {
    const data = {
      ...tarea,
      fechaCreacion: tarea.fechaCreacion || new Date().toISOString(),
      estado: tarea.estado || 'pendiente',
      prioridad: tarea.prioridad || 'media'
    };
    return addDoc(this.tareasCollection, data).then(docRef => docRef.id);
  }

  actualizarTarea(id: string, tarea: Partial<Tarea>): Promise<void> {
    const docRef = doc(this.firestore, 'tareas', id);
    return updateDoc(docRef, tarea);
  }

  eliminarTarea(id: string): Promise<void> {
    const docRef = doc(this.firestore, 'tareas', id);
    return deleteDoc(docRef);
  }

  private formatearTarea(doc: any): Tarea {
    const data = doc.data();
    return {
      id: doc.id,
      piscinaId: data['piscinaId'],
      descripcion: data['descripcion'],
      estado: data['estado'] || 'pendiente',
      prioridad: data['prioridad'] || 'media',
      fechaCreacion: data['fechaCreacion'],
      fechaVencimiento: data['fechaVencimiento'],
      responsable: data['responsable'],
      resolucion: data['resolucion']
    } as Tarea;
  }
}
