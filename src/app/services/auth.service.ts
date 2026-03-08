import { Injectable, inject } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  signOut,
  user,
  User
} from '@angular/fire/auth';
import { from, Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { UsuariosService } from './usuarios.service';
import { Usuario } from '../models/usuario';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private usuariosService = inject(UsuariosService);
  private usuarioActual = new BehaviorSubject<Usuario | null>(null);

  usuarioActual$ = this.usuarioActual.asObservable();

  constructor() {
    this.verificarSesion();
  }

  private verificarSesion(): void {
    const usuarioGuardado = localStorage.getItem('usuarioActual');
    if (usuarioGuardado) {
      try {
        const usuario = JSON.parse(usuarioGuardado);
        this.usuarioActual.next(usuario);
      } catch {
        localStorage.removeItem('usuarioActual');
      }
    }
  }

  async login(email: string, password: string): Promise<Usuario> {
    try {
      const emailNormalizado = email.toLowerCase().trim();
      
      const resultado = await signInWithEmailAndPassword(
        this.auth,
        emailNormalizado,
        password
      );

      // Obtener datos del usuario desde Firestore
      let usuarioFirestore = await this.usuariosService
        .obtenerUsuarioPorEmail(emailNormalizado)
        .toPromise();

      // Si el usuario no existe en Firestore, crearlo automáticamente
      if (!usuarioFirestore) {
        await this.usuariosService.crearUsuario({
          email: emailNormalizado,
          nombre: resultado.user?.displayName || emailNormalizado.split('@')[0],
          rol: 'cliente',
          estado: 'activo'
        });
        
        // Obtener el usuario recién creado
        usuarioFirestore = await this.usuariosService
          .obtenerUsuarioPorEmail(emailNormalizado)
          .toPromise();
          
        if (!usuarioFirestore) {
          throw new Error('Error al crear el usuario en el sistema');
        }
      }

      // Verificar si el usuario está activo
      if (usuarioFirestore.estado !== 'activo') {
        await signOut(this.auth);
        throw new Error('Tu cuenta ha sido desactivada. Contacta al administrador.');
      }

      // Guardar en localStorage
      localStorage.setItem('usuarioActual', JSON.stringify(usuarioFirestore));
      this.usuarioActual.next(usuarioFirestore);

      return usuarioFirestore;
    } catch (error: any) {
      throw new Error(
        error.message || 'Error al iniciar sesión'
      );
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      localStorage.removeItem('usuarioActual');
      this.usuarioActual.next(null);
    } catch (error: any) {
      throw new Error(error.message || 'Error al cerrar sesión');
    }
  }

  obtenerUsuarioActual(): Usuario | null {
    return this.usuarioActual.getValue();
  }

  estaAutenticado(): boolean {
    return this.usuarioActual.getValue() !== null;
  }

  obtenerRolActual(): string | null {
    return this.usuarioActual.getValue()?.rol || null;
  }
}
