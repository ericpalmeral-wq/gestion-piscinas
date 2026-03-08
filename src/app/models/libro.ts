/**
 * Interfaces para el Libro de Registro de Piscinas
 */

export interface TitularPiscina {
  nombre: string;
  nifCif: string;
  telefono: string;
  email: string;
}

export interface IdentificacionPiscina {
  nombrePiscina: string;
  direccion: string;
  municipio: string;
  codigoPostal: string;
  provincia: string;
  titular: TitularPiscina;
  tipoPiscina: string;
  uso: string;
  fechaAperturaTemporada: string;
  fechaCierreTemporada: string;
}

export interface DatoVaso {
  idVaso: string;
  tipoVaso: string;
  usoVaso: string;
  volumenM3: number;
  superficieM2: number;
  profundidadMinimaM: number;
  profundidadMaximaM: number;
  sistemaTratamiento: string;
  tipoDesinfectante: string;
}

export interface ControlDiarioAgua {
  fecha: string;
  hora: string;
  idVaso: string;
  ph: number;
  desinfectanteResidualLibreMgL: number;
  desinfectanteResidualCombinadoMgL: number;
  turbidezNTU: number;
  transparenciaCorrecta: boolean;
  color: string;
  olor: string;
  temperaturaAguaC: number;
  observaciones: string;
}

export interface ControlAirePiscinaCubierta {
  fecha: string;
  hora: string;
  temperaturaAmbienteC: number;
  humedadRelativaPorcentaje: number;
  co2Ppm: number;
  cloroAmbienteMgM3: number;
  observaciones: string;
}

export interface ControlPeriodicoAgua {
  fechaMuestreo: string;
  idVaso: string;
  ph: number;
  desinfectanteResidualLibreMgL: number;
  desinfectanteResidualCombinadoMgL: number;
  turbidezNTU: number;
  alcalinidadMgL: number;
  acidoIsocianuricoMgL: number;
  conductividadUsCm: number;
  eColiUfc100ml: number;
  pseudomonasAeruginosaUfc100ml: number;
  legionellaUfcL: number;
  resultadoConforme: boolean;
  laboratorio: string;
  observaciones: string;
}

export interface Incidencia {
  fecha: string;
  hora: string;
  idVaso: string;
  descripcionIncidencia: string;
  parametroAfectado: string;
  valorDetectado: string;
  valorPermitido: string;
  medidasCorrectoras: string;
  fechaResolucion: string;
  responsable: string;
}

export interface TratamientoAgua {
  fecha: string;
  hora: string;
  idVaso: string;
  productoUtilizado: string;
  dosisAplicada: string;
  motivoTratamiento: string;
  responsable: string;
}

export interface MantenimientoInstalacion {
  fecha: string;
  tipoMantenimiento: string;
  descripcion: string;
  empresaResponsable: string;
  tecnico: string;
}

export interface ResumenAnualSILOE {
  anio: string;
  numeroTotalMuestreos: number;
  numeroMuestreosConformes: number;
  numeroIncidencias: number;
  valorMedioPh: number;
  valorMinimoPh: number;
  valorMaximoPh: number;
  valorMedioDesinfectante: number;
  valorMinimoDesinfectante: number;
  valorMaximoDesinfectante: number;
}

export interface Libro {
  id?: string;
  piscinaId: string;
  identificacionPiscina: IdentificacionPiscina;
  datosVasos: DatoVaso[];
  controlesDiariosAgua: ControlDiarioAgua[];
  controlesAirePiscinaCubierta: ControlAirePiscinaCubierta[];
  controlesPeriodicosAgua: ControlPeriodicoAgua[];
  incidencias: Incidencia[];
  tratamientosAgua: TratamientoAgua[];
  mantenimientoInstalaciones: MantenimientoInstalacion[];
  resumenAnualSILOE: ResumenAnualSILOE;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

/**
 * Crea un libro vacío con valores por defecto
 */
export function crearLibroVacio(piscinaId: string): Libro {
  return {
    piscinaId,
    identificacionPiscina: {
      nombrePiscina: '',
      direccion: '',
      municipio: '',
      codigoPostal: '',
      provincia: '',
      titular: {
        nombre: '',
        nifCif: '',
        telefono: '',
        email: ''
      },
      tipoPiscina: '',
      uso: '',
      fechaAperturaTemporada: '',
      fechaCierreTemporada: ''
    },
    datosVasos: [],
    controlesDiariosAgua: [],
    controlesAirePiscinaCubierta: [],
    controlesPeriodicosAgua: [],
    incidencias: [],
    tratamientosAgua: [],
    mantenimientoInstalaciones: [],
    resumenAnualSILOE: {
      anio: new Date().getFullYear().toString(),
      numeroTotalMuestreos: 0,
      numeroMuestreosConformes: 0,
      numeroIncidencias: 0,
      valorMedioPh: 0,
      valorMinimoPh: 0,
      valorMaximoPh: 0,
      valorMedioDesinfectante: 0,
      valorMinimoDesinfectante: 0,
      valorMaximoDesinfectante: 0
    },
    fechaCreacion: new Date(),
    fechaActualizacion: new Date()
  };
}
