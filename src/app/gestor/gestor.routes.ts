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
    {
        path: 'salas',
        loadComponent: () => import('./salas-admin/salas-admin').then(m => m.SalasAdmin),
    },
    {
        path: 'salas/:id',
        loadComponent: () => import('./sala-mapa/sala-mapa').then(m => m.SalaMapa),
    },
    {
        path: 'funciones',
        loadComponent: () => import('./funciones-admin/funciones-admin').then(m => m.FuncionesAdmin),
    },
    {
        path: 'funciones/nueva',
        loadComponent: () => import('./funcion-form/funcion-form').then(m => m.FuncionForm),
    },
];