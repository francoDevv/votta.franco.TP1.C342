import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { rolGuard } from './guards/rol.guard';
import { conexionGuard } from './guards/conexion.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.Login),
  },
  {
    path: 'registro',
    loadComponent: () => import('./pages/registro/registro').then(m => m.Registro),
  },
  {
    path: 'perfil',
    canMatch: [authGuard],
    canActivate: [conexionGuard],
    loadComponent: () => import('./pages/perfil/perfil').then(m => m.Perfil),
  },
  {
    path: 'cartelera',
    loadComponent: () => import('./pages/cartelera/cartelera').then(m => m.Cartelera),
  },
  {
    path: 'proximamente',
    loadComponent: () => import('./pages/proximamente/proximamente').then(m => m.Proximamente),
  },
  {
    path: 'gestor',
    canMatch: [rolGuard(['gestor', 'admin'])],
    loadChildren: () => import('./gestor/gestor.routes').then(m => m.GESTOR_ROUTES),
  },
  {
    path: 'peliculas/:id',
    loadComponent: () => import('./pages/pelicula-detalle/pelicula-detalle').then(m => m.PeliculaDetalle),
  },
  {
    path: 'peliculas/:id/funciones',
    loadComponent: () => import('./pages/funciones-pelicula/funciones-pelicula').then(m => m.FuncionesPelicula),
  },
  {
    path: 'funciones/:id/butacas',
    canActivate: [conexionGuard],
    loadComponent: () => import('./pages/seleccion-butacas/seleccion-butacas').then(m => m.SeleccionButacas),
  },
  {
    path: 'funciones/:id/candy',
    canActivate: [conexionGuard],
    loadComponent: () => import('./pages/candy-seleccion/candy-seleccion').then(m => m.CandySeleccion),
  },
  {
    path: 'mis-entradas',
    canMatch: [authGuard],
    canActivate: [conexionGuard],
    loadComponent: () => import('./pages/mis-entradas/mis-entradas').then(m => m.MisEntradas),
  },
  {
    path: 'empleado',
    canMatch: [rolGuard(['empleado', 'admin'])],
    loadComponent: () => import('./pages/validacion/validacion').then(m => m.Validacion),
  },
  {
    path: 'mis-peliculas',
    canMatch: [authGuard],
    loadComponent: () => import('./pages/mis-peliculas/mis-peliculas').then(m => m.MisPeliculas),
  },
  {
    path: 'sin-conexion',
    loadComponent: () => import('./pages/sin-conexion/sin-conexion').then(m => m.SinConexion),
  },
  { path: '', redirectTo: 'cartelera', pathMatch: 'full' },
];