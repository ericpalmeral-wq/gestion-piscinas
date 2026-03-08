/**
 * Interfaz que representa una Piscina en el sistema GestiPool
 */
export interface Piscina {
  id?: string;
  nombre: string;
  ubicacion: string;
  capacidadLitros: number;
  profundidadMaxima: number;
  estado: 'abierta' | 'cerrada';
  fechaCreacion: Date;
  ultimaLimpieza: Date;
  fechaApertura?: Date | null;
  fechaCierre?: Date | null;
  nivelCloro: number;
  pHAgua: number;
  horasFiltracion: number;
  consumoSemanal: number;
  algibonL?: number;
  bajaPHL?: number;
  cif: string;
  tipo: 'comunidad' | 'privada';
  observaciones?: string;
  tecnicosAsignados?: string[];
  clienteId?: string;
  clienteNombre?: string;
}

/**
 * Clase para trabajar con objetos Piscina
 */
export class PiscinaData implements Piscina {
  id?: string;
  nombre: string;
  ubicacion: string;
  capacidadLitros: number;
  profundidadMaxima: number;
  estado: 'abierta' | 'cerrada';
  fechaCreacion: Date;
  ultimaLimpieza: Date;
  fechaApertura?: Date | null;
  fechaCierre?: Date | null;
  nivelCloro: number;
  pHAgua: number;
  horasFiltracion: number;
  consumoSemanal: number;
  algibonL?: number;
  bajaPHL?: number;
  cif: string;
  tipo: 'comunidad' | 'privada';
  observaciones?: string;
  tecnicosAsignados: string[];
  clienteId?: string;
  clienteNombre?: string;

  constructor(data: Piscina) {
    this.id = data.id;
    this.nombre = data.nombre;
    this.ubicacion = data.ubicacion;
    this.capacidadLitros = data.capacidadLitros;
    this.profundidadMaxima = data.profundidadMaxima;
    this.estado = data.estado;
    this.fechaCreacion = data.fechaCreacion;
    this.ultimaLimpieza = data.ultimaLimpieza;
    this.fechaApertura = data.fechaApertura;
    this.fechaCierre = data.fechaCierre;
    this.nivelCloro = data.nivelCloro;
    this.pHAgua = data.pHAgua;
    this.horasFiltracion = data.horasFiltracion;
    this.consumoSemanal = data.consumoSemanal;
    this.algibonL = data.algibonL ?? 0;
    this.bajaPHL = data.bajaPHL ?? 0;
    this.cif = data.cif;
    this.tipo = data.tipo;
    this.observaciones = data.observaciones;
    this.tecnicosAsignados = data.tecnicosAsignados || [];
    this.clienteId = data.clienteId;
    this.clienteNombre = data.clienteNombre;
  }

  /**
   * Verifica si la piscina necesita mantenimiento
   */
  necesitaMantenimiento(): boolean {
    return (
      this.nivelCloro < 0.5 ||
      this.nivelCloro > 3.0 ||
      this.pHAgua < 7.2 ||
      this.pHAgua > 7.8
    );
  }
}
