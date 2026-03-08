import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { signal } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  cargando = signal<boolean>(false);
  error = signal<string>('');
  mostrarPassword = signal<boolean>(false);

  async login(): Promise<void> {
    if (!this.validarFormulario()) {
      return;
    }

    this.cargando.set(true);
    this.error.set('');

    try {
      await this.authService.login(this.email, this.password);
      this.router.navigate(['/piscinas']);
    } catch (err: any) {
      if (err.message.includes('user-not-found')) {
        this.error.set('Usuario no encontrado');
      } else if (err.message.includes('wrong-password')) {
        this.error.set('Contraseña incorrecta');
      } else if (err.message.includes('invalid-credential')) {
        this.error.set('Email o contraseña incorrectos');
      } else {
        this.error.set(err.message || 'Error al iniciar sesión');
      }
    } finally {
      this.cargando.set(false);
    }
  }

  validarFormulario(): boolean {
    if (!this.email || !this.email.trim()) {
      this.error.set('El email es requerido');
      return false;
    }

    if (!this.esEmailValido(this.email)) {
      this.error.set('Ingresa un email válido');
      return false;
    }

    if (!this.password || !this.password.trim()) {
      this.error.set('La contraseña es requerida');
      return false;
    }

    if (this.password.length < 6) {
      this.error.set('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    return true;
  }

  esEmailValido(email: string): boolean {
    const expresion = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return expresion.test(email);
  }

  toggleMostrarPassword(): void {
    this.mostrarPassword.update(v => !v);
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.login();
    }
  }
}
