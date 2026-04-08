import { LineaInforme } from './linea-informe';

export interface Informe {
  id?: string;
  piscinaId: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  estadoGeneral: 'bien' | 'regular' | 'mal';
  observacion?: string;
  lineas: LineaInforme[];
}
