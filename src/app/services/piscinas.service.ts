import { Injectable } from '@angular/core';
import { Firestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc, getDoc } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { Piscina } from '../models/piscina';
@Injectable({
  providedIn: 'root'
})
export class PiscinasService {
  private readonly coleccion = 'piscinas';
  constructor(private firestore: Firestore) {}
  /**
   * Obtiene todas las piscinas de Firestore
   */
  obtenerPiscinas(): Observable<any[]> {
    return from(
      getDocs(collection(this.firestore, this.coleccion))
    ).pipe(
      map((snapshot) => {
        return snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
      })
    );
  }
  /**
   * Obtiene las piscinas asignadas a un técnico específico
   */
  obtenerPiscinasAsignadasATecnico(tecnicoUid: string): Observable<any[]> {
    return this.obtenerPiscinas().pipe(
      map((piscinas) => {
        return piscinas.filter((piscina) => {
          const tecnicosAsignados = piscina.tecnicosAsignados || [];
          return tecnicosAsignados.includes(tecnicoUid);
        });
      })
    );
  }
  /**
   * Obtiene las piscinas asignadas a un cliente específico
   */
  obtenerPiscinasDeCliente(clienteId: string): Observable<any[]> {
    return this.obtenerPiscinas().pipe(
      map((piscinas) => {
        return piscinas.filter((piscina) => piscina.clienteId === clienteId);
      })
    );
  }
  /**
   * Obtiene una piscina por ID
   */
  obtenerPiscinaPorId(id: string): Observable<any> {
    return from(
      getDoc(doc(this.firestore, this.coleccion, id))
    ).pipe(
      map((docSnapshot) => {
        if (docSnapshot.exists()) {
          return {
            id: docSnapshot.id,
            ...docSnapshot.data()
          };
        } else {
          throw new Error('Piscina no encontrada');
        }
      })
    );
  }
  /**
   * Añade una nueva piscina a Firestore
   */
  async agregarPiscina(piscina: Piscina): Promise<string> {
    try {
      const ref = collection(this.firestore, this.coleccion);
      const docRef = await addDoc(ref, {
        ...piscina,
        fechaCreacion: piscina.fechaCreacion instanceof Date ? piscina.fechaCreacion.toISOString() : piscina.fechaCreacion,
        ultimaLimpieza: piscina.ultimaLimpieza instanceof Date ? piscina.ultimaLimpieza.toISOString() : piscina.ultimaLimpieza
      });
      return docRef.id;
    } catch (error) {
      console.error('Error al agregar piscina:', error);
      throw error;
    }
  }
  /**
   * Actualiza una piscina existente
   */
  async actualizarPiscina(id: string, piscina: Partial<Piscina>): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.coleccion, id);
      await updateDoc(docRef, {
        ...piscina,
        ...(piscina.fechaCreacion instanceof Date && { fechaCreacion: piscina.fechaCreacion.toISOString() }),
        ...(piscina.ultimaLimpieza instanceof Date && { ultimaLimpieza: piscina.ultimaLimpieza.toISOString() })
      });
    } catch (error) {
      console.error('Error al actualizar piscina:', error);
      throw error;
    }
  }
  /**
   * Asigna un técnico a una piscina (solo puede haber 1 técnico por piscina)
   */
  async asignarTecnico(piscinaId: string, tecnicoUid: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.coleccion, piscinaId);
      const docSnapshot = await getDoc(docRef);
      if (!docSnapshot.exists()) {
        throw new Error('Piscina no encontrada');
      }
      // Solo un técnico por piscina - reemplaza al anterior
      await updateDoc(docRef, {
        tecnicosAsignados: [tecnicoUid]
      });
    } catch (error) {
      console.error('Error al asignar técnico:', error);
      throw error;
    }
  }
  /**
   * Desasigna un técnico de una piscina
   */
  async desasignarTecnico(piscinaId: string, tecnicoUid: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.coleccion, piscinaId);
      const docSnapshot = await getDoc(docRef);
      if (!docSnapshot.exists()) {
        throw new Error('Piscina no encontrada');
      }
      const tecnicosActuales = docSnapshot.data()['tecnicosAsignados'] || [];
      const tecnicosFiltrados = tecnicosActuales.filter((uid: string) => uid !== tecnicoUid);
      await updateDoc(docRef, {
        tecnicosAsignados: tecnicosFiltrados
      });
    } catch (error) {
      console.error('Error al desasignar técnico:', error);
      throw error;
    }
  }
  /**
   * Elimina una piscina
   */
  async eliminarPiscina(id: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.coleccion, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error al eliminar piscina:', error);
      throw error;
    }
  }
  /**
   * Agrega datos de prueba para testing
   */
  async agregarDatosPrueba(): Promise<void> {
    const piscinasPrueba: Piscina[] = [
      {
        nombre: 'Piscina Centro',
        ubicacion: 'Centro Deportivo Municipal',
        capacidadLitros: 50000,
        profundidadMaxima: 2.5,
        estado: 'abierta',
        fechaCreacion: new Date(),
        ultimaLimpieza: new Date(),
        nivelCloro: 2.5,
        pHAgua: 7.2,
        horasFiltracion: 8,
        consumoSemanal: 35000,
        cif: 'A12345678',
        tipo: 'comunidad',
        observaciones: 'Piscina principal en buen estado',
        tecnicosAsignados: []
      },
      {
        nombre: 'Piscina Infantil',
        ubicacion: 'Parque Infantil del Barrio',
        capacidadLitros: 20000,
        profundidadMaxima: 0.8,
        estado: 'abierta',
        fechaCreacion: new Date(),
        ultimaLimpieza: new Date(),
        nivelCloro: 2.0,
        pHAgua: 7.3,
        horasFiltracion: 6,
        consumoSemanal: 12000,
        cif: 'B98765432',
        tipo: 'comunidad',
        observaciones: 'Piscina para niños',
        tecnicosAsignados: []
      },
      {
        nombre: 'Piscina Olímpica',
        ubicacion: 'Estadio Deportivo',
        capacidadLitros: 2500000,
        profundidadMaxima: 3.0,
        estado: 'abierta',
        fechaCreacion: new Date(),
        ultimaLimpieza: new Date(),
        nivelCloro: 2.8,
        pHAgua: 7.1,
        horasFiltracion: 12,
        consumoSemanal: 180000,
        cif: 'C11223344',
        tipo: 'comunidad',
        observaciones: 'Piscina de competición',
        tecnicosAsignados: []
      },
      {
        nombre: 'Piscina Hotel Resort',
        ubicacion: 'Hotel Costa Azul',
        capacidadLitros: 80000,
        profundidadMaxima: 2.0,
        estado: 'abierta',
        fechaCreacion: new Date(),
        ultimaLimpieza: new Date(),
        nivelCloro: 2.3,
        pHAgua: 7.2,
        horasFiltracion: 10,
        consumoSemanal: 55000,
        cif: 'D55667788',
        tipo: 'privada',
        observaciones: 'Piscina de hotel con servicios premium',
        tecnicosAsignados: []
      },
      {
        nombre: 'Piscina Comunitaria Norte',
        ubicacion: 'Barrio Norte',
        capacidadLitros: 35000,
        profundidadMaxima: 2.2,
        estado: 'abierta',
        fechaCreacion: new Date(),
        ultimaLimpieza: new Date(),
        nivelCloro: 2.6,
        pHAgua: 7.4,
        horasFiltracion: 9,
        consumoSemanal: 24500,
        cif: 'E99001122',
        tipo: 'comunidad',
        observaciones: 'Piscina comunitaria',
        tecnicosAsignados: []
      },
      {
        nombre: 'Piscina Termal',
        ubicacion: 'Spa Wellness Center',
        capacidadLitros: 15000,
        profundidadMaxima: 1.5,
        estado: 'abierta',
        fechaCreacion: new Date(),
        ultimaLimpieza: new Date(),
        nivelCloro: 1.8,
        pHAgua: 7.5,
        horasFiltracion: 4,
        consumoSemanal: 8000,
        cif: 'F33445566',
        tipo: 'privada',
        observaciones: 'Piscina termal a temperatura controlada',
        tecnicosAsignados: []
      },
      {
        nombre: 'Piscina Campo Escuela',
        ubicacion: 'Colegio Educativo',
        capacidadLitros: 25000,
        profundidadMaxima: 1.8,
        estado: 'abierta',
        fechaCreacion: new Date(),
        ultimaLimpieza: new Date(),
        nivelCloro: 2.4,
        pHAgua: 7.2,
        horasFiltracion: 7,
        consumoSemanal: 18000,
        cif: 'G77889900',
        tipo: 'privada',
        observaciones: 'Piscina escolar',
        tecnicosAsignados: []
      },
      {
        nombre: 'Piscina Privada Residencial',
        ubicacion: 'Urb. Las Villas',
        capacidadLitros: 12000,
        profundidadMaxima: 1.6,
        estado: 'abierta',
        fechaCreacion: new Date(),
        ultimaLimpieza: new Date(),
        nivelCloro: 2.2,
        pHAgua: 7.3,
        horasFiltracion: 5,
        consumoSemanal: 6000,
        cif: 'H11223344',
        tipo: 'privada',
        observaciones: 'Piscina residencial privada',
        tecnicosAsignados: []
      },
      {
        nombre: 'Piscina Therapy',
        ubicacion: 'Centro Médico Rehabilitación',
        capacidadLitros: 8000,
        profundidadMaxima: 1.2,
        estado: 'abierta',
        fechaCreacion: new Date(),
        ultimaLimpieza: new Date(),
        nivelCloro: 1.5,
        pHAgua: 7.6,
        horasFiltracion: 3,
        consumoSemanal: 4000,
        cif: 'I55667788',
        tipo: 'privada',
        observaciones: 'Piscina terapéutica para rehabilitación',
        tecnicosAsignados: []
      },
      {
        nombre: 'Piscina Acuática Park',
        ubicacion: 'Parque de Atracciones',
        capacidadLitros: 120000,
        profundidadMaxima: 2.8,
        estado: 'cerrada',
        fechaCreacion: new Date(),
        ultimaLimpieza: new Date(),
        nivelCloro: 2.9,
        pHAgua: 7.0,
        horasFiltracion: 14,
        consumoSemanal: 95000,
        cif: 'J99001122',
        tipo: 'privada',
        observaciones: 'Piscina de parque acuático',
        tecnicosAsignados: []
      },
      {
        nombre: 'Piscina Comunitaria Sur',
        ubicacion: 'Barrio Sur',
        capacidadLitros: 40000,
        profundidadMaxima: 2.3,
        estado: 'abierta',
        fechaCreacion: new Date(),
        ultimaLimpieza: new Date(),
        nivelCloro: 2.5,
        pHAgua: 7.2,
        horasFiltracion: 9,
        consumoSemanal: 28000,
        cif: 'K33445566',
        tipo: 'comunidad',
        observaciones: 'Piscina comunitaria zona sur',
        tecnicosAsignados: []
      }
    ];
    for (const piscina of piscinasPrueba) {
      await this.agregarPiscina(piscina);
    }
    console.log('Datos de prueba de piscinas agregados correctamente');
  }
}
