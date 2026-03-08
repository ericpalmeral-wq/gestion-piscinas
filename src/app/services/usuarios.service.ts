import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  Query
} from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Usuario, UsuarioData } from '../models/usuario';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  private firestore = inject(Firestore);
  private usuariosCollection = collection(this.firestore, 'usuarios');

  obtenerUsuarios(): Observable<Usuario[]> {
    return from(getDocs(this.usuariosCollection)).pipe(
      map(snapshot => {
        return snapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        } as Usuario));
      })
    );
  }

  obtenerUsuarioPorId(uid: string): Observable<Usuario | null> {
    const docRef = doc(this.firestore, 'usuarios', uid);
    return from(getDoc(docRef)).pipe(
      map(docSnap => {
        if (docSnap.exists()) {
          return {
            uid: docSnap.id,
            ...docSnap.data()
          } as Usuario;
        }
        return null;
      })
    );
  }

  obtenerUsuarioPorEmail(email: string): Observable<Usuario | null> {
    const emailNormalizado = email.toLowerCase().trim();
    const q = query(this.usuariosCollection, where('email', '==', emailNormalizado));
    return from(getDocs(q)).pipe(
      map(snapshot => {
        if (snapshot.docs.length > 0) {
          const doc = snapshot.docs[0];
          return {
            uid: doc.id,
            ...doc.data()
          } as Usuario;
        }
        return null;
      })
    );
  }

  async crearUsuario(usuario: Partial<Usuario>): Promise<string> {
    // Normalizar email
    const emailNormalizado = (usuario.email || '').toLowerCase().trim();
    
    // Verificar si ya existe un usuario con este email
    const existente = await this.obtenerUsuarioPorEmail(emailNormalizado).toPromise();
    if (existente) {
      console.log('Usuario ya existe con email:', emailNormalizado);
      return existente.uid;
    }
    
    const usuarioData = new UsuarioData({ ...usuario, email: emailNormalizado });
    const usuarioObj = {
      email: usuarioData.email,
      nombre: usuarioData.nombre,
      rol: usuarioData.rol,
      estado: usuarioData.estado,
      fechaCreacion: usuarioData.fechaCreacion
    };

    return addDoc(this.usuariosCollection, usuarioObj).then(
      docRef => docRef.id
    );
  }

  actualizarUsuario(uid: string, cambios: Partial<Usuario>): Promise<void> {
    const docRef = doc(this.firestore, 'usuarios', uid);
    return updateDoc(docRef, { ...cambios });
  }

  asignarRol(uid: string, rol: string): Promise<void> {
    const docRef = doc(this.firestore, 'usuarios', uid);
    return updateDoc(docRef, { rol });
  }

  cambiarEstado(uid: string, estado: 'activo' | 'inactivo'): Promise<void> {
    const docRef = doc(this.firestore, 'usuarios', uid);
    return updateDoc(docRef, { estado });
  }

  eliminarUsuario(uid: string): Promise<void> {
    const docRef = doc(this.firestore, 'usuarios', uid);
    return deleteDoc(docRef);
  }
}
