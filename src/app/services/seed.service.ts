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
    try {
      console.log('Iniciando inserción de datos de prueba...');
      
      // Paso 1: Agregar piscinas
      console.log('1. Agregando piscinas de prueba...');
      await this.piscinasService.agregarDatosPrueba();
      
      // Paso 2: Obtener los IDs de las piscinas creadas
      console.log('2. Obteniendo IDs de piscinas...');
      const piscinas = await this.obtenerPiscinas();
      const piscinasIds = piscinas.map(p => p.id).filter(id => id !== undefined) as string[];
      
      if (piscinasIds.length === 0) {
        throw new Error('No se pudieron obtener los IDs de las piscinas creadas');
      }
      
      console.log(`Piscinas creadas: ${piscinasIds.length}`);
      
      // Paso 3: Agregar informes
      console.log('3. Agregando informes de prueba...');
      await this.informesService.agregarDatosPrueba(piscinasIds);
      
      // Paso 4: Agregar presupuestos
      console.log('4. Agregando presupuestos de prueba...');
      await this.presupuestosService.agregarDatosPrueba(piscinasIds);
      
      console.log('✓ Todos los datos de prueba han sido agregados exitosamente');
    } catch (error) {
      console.error('Error al agregar datos de prueba:', error);
      throw error;
    }
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
