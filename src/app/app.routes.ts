import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { ListaPiscinasComponent } from './components/lista-piscinas/lista-piscinas.component';
import { PiscinaDetalleComponent } from './components/piscina-detalle/piscina-detalle.component';
import { ListaUsuariosComponent } from './components/lista-usuarios/lista-usuarios.component';
import { InformesComponent } from './components/informes/informes.component';
import { PresupuestosComponent } from './components/presupuestos/presupuestos.component';
import { PresupuestoDetalleComponent } from './components/presupuesto-detalle/presupuesto-detalle.component';
import { InformeDetalleComponent } from './components/informe-detalle/informe-detalle.component';
import { TareasComponent } from './components/tareas/tareas.component';
import { TareaDetalleComponent } from './components/tarea-detalle/tarea-detalle.component';
import { LibrosComponent } from './components/libros/libros.component';
import { LibroDetalleComponent } from './components/libros/libro-detalle.component';
import { PiscinaPublicaComponent } from './components/piscina-publica/piscina-publica.component';
import { requiereAutenticacion } from './guards/auth.guard';
import { requiereRol } from './guards/rol.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  // Página pública: accesible sin autenticación
  {
    path: 'publica/piscinas/:id',
    component: PiscinaPublicaComponent
  },
  // Inicio: accesible por todos los usuarios autenticados
  {
    path: '',
    component: HomeComponent,
    canActivate: [requiereAutenticacion]
  },
  // Detalle de piscina: accesible por todos los usuarios autenticados
  {
    path: 'piscinas/:id',
    component: PiscinaDetalleComponent,
    canActivate: [requiereAutenticacion]
  },
  // === Rutas solo para administrador ===
  {
    path: 'piscinas',
    component: ListaPiscinasComponent,
    canActivate: [requiereAutenticacion, requiereRol('administrador')]
  },
  {
    path: 'usuarios',
    component: ListaUsuariosComponent,
    canActivate: [requiereAutenticacion, requiereRol('administrador')]
  },
  {
    path: 'informes',
    component: InformesComponent,
    canActivate: [requiereAutenticacion, requiereRol('administrador')]
  },
  {
    path: 'informes/:id',
    component: InformeDetalleComponent,
    canActivate: [requiereAutenticacion, requiereRol('administrador')]
  },
  {
    path: 'presupuestos',
    component: PresupuestosComponent,
    canActivate: [requiereAutenticacion, requiereRol('administrador')]
  },
  {
    path: 'presupuestos/:id',
    component: PresupuestoDetalleComponent,
    canActivate: [requiereAutenticacion, requiereRol('administrador')]
  },
  {
    path: 'tareas',
    component: TareasComponent,
    canActivate: [requiereAutenticacion, requiereRol('administrador')]
  },
  {
    path: 'tareas/:id',
    component: TareaDetalleComponent,
    canActivate: [requiereAutenticacion, requiereRol('administrador')]
  },
  {
    path: 'libros',
    component: LibrosComponent,
    canActivate: [requiereAutenticacion, requiereRol('administrador')]
  },
  {
    path: 'libros/:piscinaId',
    component: LibroDetalleComponent,
    canActivate: [requiereAutenticacion, requiereRol('administrador', 'tecnico')]
  }
];
