import { LineaPresupuesto } from './linea-presupuesto';

export interface Presupuesto {
  id?: string;
  piscinaId: string;
  fechaCreacion: string;
  descripcion: string;
  lineas: LineaPresupuesto[];
  estado: 'pendiente' | 'aceptado';
}
