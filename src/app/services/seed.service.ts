import { Injectable, inject } from '@angular/core';
import { PiscinasService } from './piscinas.service';
import { InformesService } from './informes.service';
import { PresupuestosService } from './presupuestos.service';

@Injectable({
  providedIn: 'root'
})
export class SeedService {
  private piscinasService = inject(PiscinasService);
  private informesService = inject(InformesService);
  private presupuestosService = inject(PresupuestosService);

  /**
   * Agrega todos los datos de prueba necesarios
   * Primero piscinas, luego informes y presupuestos usando los IDs de las piscinas
   */
  async agregarTodosDatosPrueba(): Promise<void> {
    // Paso 1: Agregar piscinas
    await this.piscinasService.agregarDatosPrueba();
    
    // Paso 2: Obtener los IDs de las piscinas creadas
    const piscinas = await this.obtenerPiscinas();
    const piscinasIds = piscinas.map(p => p.id).filter(id => id !== undefined) as string[];
    
    if (piscinasIds.length === 0) {
      throw new Error('No se pudieron obtener los IDs de las piscinas creadas');
    }
    
    // Paso 3: Agregar informes
    await this.informesService.agregarDatosPrueba(piscinasIds);
    
    // Paso 4: Agregar presupuestos
    await this.presupuestosService.agregarDatosPrueba(piscinasIds);
  }

  /**
   * Obtiene todas las piscinas (promesa)
   */
  private async obtenerPiscinas(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.piscinasService.obtenerPiscinas().subscribe({
        next: (piscinas) => resolve(piscinas),
        error: (error) => reject(error)
      });
    });
  }
}
