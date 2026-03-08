import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LibrosService } from '../../services/libros.service';
import { PiscinasService } from '../../services/piscinas.service';
import { Libro } from '../../models/libro';
import { Piscina } from '../../models/piscina';

interface LibroConPiscina {
  libro: Libro;
  piscina: Piscina | null;
}

@Component({
  selector: 'app-libros',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="contenedor">
      <div class="encabezado">
        <h1>📚 Libros de Registro</h1>
      </div>

      <div *ngIf="cargando()" class="cargando">
        <p>Cargando libros...</p>
      </div>

      <div *ngIf="error()" class="alerta alerta-error">
        {{ error() }}
      </div>

      <div *ngIf="!cargando() && librosConPiscina().length === 0" class="sin-datos">
        <p>No hay libros de registro creados</p>
      </div>

      <div class="tabla-responsive" *ngIf="!cargando() && librosConPiscina().length > 0">
        <table class="tabla">
          <thead>
            <tr>
              <th>Piscina</th>
              <th>Ubicación</th>
              <th>Tipo</th>
              <th>Vasos</th>
              <th>Controles Diarios</th>
              <th>Incidencias</th>
              <th>Última Actualización</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of librosConPiscina()">
              <td>
                <strong>{{ item.piscina?.nombre || 'Sin nombre' }}</strong>
              </td>
              <td>{{ item.piscina?.ubicacion || 'N/A' }}</td>
              <td>{{ item.libro.identificacionPiscina.tipoPiscina || 'N/A' }}</td>
              <td>{{ item.libro.datosVasos.length }}</td>
              <td>{{ item.libro.controlesDiariosAgua.length }}</td>
              <td>
                <span [class.tiene-incidencias]="item.libro.incidencias.length > 0">
                  {{ item.libro.incidencias.length }}
                </span>
              </td>
              <td>{{ formatearFecha(item.libro.fechaActualizacion) }}</td>
              <td>
                <a [routerLink]="['/libros', item.libro.piscinaId]" class="btn-ver">
                  👁️ Ver
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .contenedor {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
      font-family: 'Comfortaa', cursive;
    }

    .encabezado {
      margin-bottom: 24px;
    }

    .encabezado h1 {
      margin: 0;
      color: #333;
      font-size: 28px;
    }

    .cargando {
      text-align: center;
      padding: 60px 20px;
      color: #667eea;
      font-size: 16px;
    }

    .alerta {
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-weight: 600;
    }

    .alerta-error {
      background: #fee2e2;
      color: #dc2626;
      border-left: 4px solid #dc2626;
    }

    .sin-datos {
      text-align: center;
      padding: 60px 20px;
      color: #999;
      font-size: 15px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(102, 126, 234, 0.08);
    }

    .tabla-responsive {
      overflow-x: auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(102, 126, 234, 0.08);
    }

    .tabla {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }

    .tabla th {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 14px 12px;
      text-align: left;
      font-weight: 600;
      white-space: nowrap;
    }

    .tabla th:first-child {
      border-radius: 12px 0 0 0;
    }

    .tabla th:last-child {
      border-radius: 0 12px 0 0;
    }

    .tabla td {
      padding: 14px 12px;
      border-bottom: 1px solid #f0f0f0;
      color: #333;
    }

    .tabla tr:hover {
      background: #f8f9fa;
    }

    .tabla tr:last-child td:first-child {
      border-radius: 0 0 0 12px;
    }

    .tabla tr:last-child td:last-child {
      border-radius: 0 0 12px 0;
    }

    .tiene-incidencias {
      background: #fef3c7;
      color: #d97706;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 600;
    }

    .btn-ver {
      display: inline-flex;
      align-items: center;
      padding: 8px 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 13px;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .btn-ver:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    @media (max-width: 768px) {
      .contenedor {
        padding: 12px;
      }

      .tabla {
        font-size: 12px;
      }

      .tabla th,
      .tabla td {
        padding: 10px 8px;
      }
    }
  `]
})
export class LibrosComponent implements OnInit {
  librosConPiscina = signal<LibroConPiscina[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  private piscinas: Piscina[] = [];

  constructor(
    private librosService: LibrosService,
    private piscinasService: PiscinasService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  private cargarDatos(): void {
    this.cargando.set(true);
    
    // Primero cargar las piscinas
    this.piscinasService.obtenerPiscinas().subscribe({
      next: (piscinas: Piscina[]) => {
        this.piscinas = piscinas;
        this.cargarLibros();
      },
      error: () => {
        this.error.set('Error al cargar las piscinas');
        this.cargando.set(false);
      }
    });
  }

  private cargarLibros(): void {
    this.librosService.obtenerTodosLosLibros().subscribe({
      next: (libros: Libro[]) => {
        const librosConPiscina = libros.map(libro => ({
          libro,
          piscina: this.piscinas.find(p => p.id === libro.piscinaId) || null
        }));
        this.librosConPiscina.set(librosConPiscina);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('Error al cargar los libros');
        this.cargando.set(false);
      }
    });
  }

  formatearFecha(fecha: any): string {
    if (!fecha) return 'N/A';
    
    // Handle Firestore Timestamp
    if (fecha.toDate) {
      return fecha.toDate().toLocaleDateString('es-ES');
    }
    
    // Handle Date object or string
    return new Date(fecha).toLocaleDateString('es-ES');
  }
}
