import { Injectable } from '@angular/core';
import { 
  Firestore, 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  getDoc,
  query,
  where 
} from '@angular/fire/firestore';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
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
} from '../models/libro';

@Injectable({
  providedIn: 'root'
})
export class LibrosService {
  private readonly coleccion = 'libros';

  constructor(private firestore: Firestore) {}

  /**
   * Obtiene todos los libros
   */
  obtenerTodosLosLibros(): Observable<Libro[]> {
    return from(
      getDocs(collection(this.firestore, this.coleccion))
    ).pipe(
      map((snapshot) => {
        return snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        } as Libro));
      })
    );
  }

  /**
   * Obtiene el libro de una piscina específica
   */
  obtenerLibroPorPiscina(piscinaId: string): Observable<Libro | null> {
    const librosRef = collection(this.firestore, this.coleccion);
    const q = query(librosRef, where('piscinaId', '==', piscinaId));
    
    return from(getDocs(q)).pipe(
      map((snapshot) => {
        if (snapshot.empty) {
          return null;
        }
        const doc = snapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data()
        } as Libro;
      }),
      catchError((error) => {
        console.error('Error al obtener libro:', error);
        return of(null);
      })
    );
  }

  /**
   * Obtiene un libro por su ID
   */
  obtenerLibroPorId(id: string): Observable<Libro | null> {
    const docRef = doc(this.firestore, this.coleccion, id);
    return from(getDoc(docRef)).pipe(
      map((docSnap) => {
        if (docSnap.exists()) {
          return {
            id: docSnap.id,
            ...docSnap.data()
          } as Libro;
        }
        return null;
      })
    );
  }

  /**
   * Crea un nuevo libro para una piscina
   */
  async crearLibro(piscinaId: string): Promise<string> {
    const libro = crearLibroVacio(piscinaId);
    const docRef = await addDoc(collection(this.firestore, this.coleccion), {
      ...libro,
      fechaCreacion: new Date(),
      fechaActualizacion: new Date()
    });
    return docRef.id;
  }

  /**
   * Actualiza un libro existente
   */
  async actualizarLibro(id: string, cambios: Partial<Libro>): Promise<void> {
    const docRef = doc(this.firestore, this.coleccion, id);
    await updateDoc(docRef, {
      ...cambios,
      fechaActualizacion: new Date()
    });
  }

  /**
   * Elimina un libro
   */
  async eliminarLibro(id: string): Promise<void> {
    const docRef = doc(this.firestore, this.coleccion, id);
    await deleteDoc(docRef);
  }

  // ===== Métodos para agregar registros a las listas =====

  /**
   * Agrega un control diario de agua
   */
  async agregarControlDiarioAgua(libroId: string, control: ControlDiarioAgua): Promise<void> {
    const libro = await this.obtenerLibroPorId(libroId).toPromise();
    if (libro) {
      const controles = [...libro.controlesDiariosAgua, control];
      await this.actualizarLibro(libroId, { controlesDiariosAgua: controles });
    }
  }

  /**
   * Agrega un control de aire de piscina cubierta
   */
  async agregarControlAire(libroId: string, control: ControlAirePiscinaCubierta): Promise<void> {
    const libro = await this.obtenerLibroPorId(libroId).toPromise();
    if (libro) {
      const controles = [...libro.controlesAirePiscinaCubierta, control];
      await this.actualizarLibro(libroId, { controlesAirePiscinaCubierta: controles });
    }
  }

  /**
   * Agrega un control periódico de agua
   */
  async agregarControlPeriodicoAgua(libroId: string, control: ControlPeriodicoAgua): Promise<void> {
    const libro = await this.obtenerLibroPorId(libroId).toPromise();
    if (libro) {
      const controles = [...libro.controlesPeriodicosAgua, control];
      await this.actualizarLibro(libroId, { controlesPeriodicosAgua: controles });
    }
  }

  /**
   * Agrega una incidencia
   */
  async agregarIncidencia(libroId: string, incidencia: Incidencia): Promise<void> {
    const libro = await this.obtenerLibroPorId(libroId).toPromise();
    if (libro) {
      const incidencias = [...libro.incidencias, incidencia];
      await this.actualizarLibro(libroId, { incidencias: incidencias });
    }
  }

  /**
   * Agrega un tratamiento de agua
   */
  async agregarTratamientoAgua(libroId: string, tratamiento: TratamientoAgua): Promise<void> {
    const libro = await this.obtenerLibroPorId(libroId).toPromise();
    if (libro) {
      const tratamientos = [...libro.tratamientosAgua, tratamiento];
      await this.actualizarLibro(libroId, { tratamientosAgua: tratamientos });
    }
  }

  /**
   * Agrega un registro de mantenimiento
   */
  async agregarMantenimiento(libroId: string, mantenimiento: MantenimientoInstalacion): Promise<void> {
    const libro = await this.obtenerLibroPorId(libroId).toPromise();
    if (libro) {
      const mantenimientos = [...libro.mantenimientoInstalaciones, mantenimiento];
      await this.actualizarLibro(libroId, { mantenimientoInstalaciones: mantenimientos });
    }
  }

  /**
   * Agrega un vaso a la piscina
   */
  async agregarVaso(libroId: string, vaso: DatoVaso): Promise<void> {
    const libro = await this.obtenerLibroPorId(libroId).toPromise();
    if (libro) {
      const vasos = [...libro.datosVasos, vaso];
      await this.actualizarLibro(libroId, { datosVasos: vasos });
    }
  }

  /**
   * Elimina un vaso por su ID
   */
  async eliminarVaso(libroId: string, idVaso: string): Promise<void> {
    const libro = await this.obtenerLibroPorId(libroId).toPromise();
    if (libro) {
      const vasos = libro.datosVasos.filter(v => v.idVaso !== idVaso);
      await this.actualizarLibro(libroId, { datosVasos: vasos });
    }
  }
}
