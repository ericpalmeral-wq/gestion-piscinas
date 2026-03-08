export interface Usuario {
  uid: string;
  email: string;
  nombre: string;
  rol: 'tecnico' | 'cliente' | 'invitado' | 'administrador' | 'gestor';
  estado: 'activo' | 'inactivo';
  fechaCreacion: string;
}

export class UsuarioData implements Usuario {
  uid: string;
  email: string;
  nombre: string;
  rol: 'tecnico' | 'cliente' | 'invitado' | 'administrador' | 'gestor';
  estado: 'activo' | 'inactivo';
  fechaCreacion: string;

  constructor(data: Partial<Usuario> = {}) {
    this.uid = data.uid || '';
    this.email = data.email || '';
    this.nombre = data.nombre || '';
    this.rol = data.rol || 'cliente';
    this.estado = data.estado || 'activo';
    this.fechaCreacion = data.fechaCreacion || new Date().toISOString();
  }
}
