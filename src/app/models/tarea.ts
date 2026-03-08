export interface Tarea {
  id?: string;
  piscinaId: string;
  descripcion: string;
  estado: 'pendiente' | 'en progreso' | 'completada';
  prioridad: 'baja' | 'media' | 'alta';
  fechaCreacion: string;
  fechaVencimiento: string;
  responsable?: string;
}
