import { Routes } from '@angular/router';

export const GESTOR_ROUTES: Routes = [
  {
    path: 'peliculas',
    loadComponent: () => import('./peliculas-admin/peliculas-admin').then(m => m.PeliculasAdmin),
  },
  {
    path: 'peliculas/:id',
    loadComponent: () => import('./pelicula-form/pelicula-form').then(m => m.PeliculaForm),
  },
];