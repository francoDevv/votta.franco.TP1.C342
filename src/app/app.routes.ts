import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { rolGuard } from './guards/rol.guard';

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
    loadComponent: () => import('./pages/perfil/perfil').then(m => m.Perfil),
  },
  {
    path: 'cartelera',
    loadComponent: () => import('./pages/cartelera/cartelera').then(m => m.Cartelera),
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
  { path: '', redirectTo: 'cartelera', pathMatch: 'full' },
];