import { Routes } from '@angular/router';
import { rolGuard } from '../guards/rol.guard';

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
    {
        path: 'categorias',
        loadComponent: () => import('./categorias-admin/categorias-admin').then(m => m.CategoriasAdmin),
    },
    {
        path: 'productos',
        loadComponent: () => import('./productos-admin/productos-admin').then(m => m.ProductosAdmin),
    },
    {
        path: 'productos/:id',
        loadComponent: () => import('./producto-form/producto-form').then(m => m.ProductoForm),
    },
    {
        path: 'combos',
        loadComponent: () => import('./combos-admin/combos-admin').then(m => m.CombosAdmin),
    },
    {
        path: 'combos/:id',
        loadComponent: () => import('./combo-form/combo-form').then(m => m.ComboForm),
    },
    {
        path: 'cupones',
        loadComponent: () => import('./cupones-admin/cupones-admin').then(m => m.CuponesAdmin),
    },
    {
        path: 'cupones/:id',
        loadComponent: () => import('./cupon-form/cupon-form').then(m => m.CuponForm),
    },
    {
        path: 'reportes',
        canMatch: [rolGuard(['admin'])],
        loadComponent: () => import('./reportes-admin/reportes-admin').then(m => m.ReportesAdmin),
    },
    {
        path: 'actividad',
        canMatch: [rolGuard(['admin'])],
        loadComponent: () => import('./actividad-admin/actividad-admin').then(m => m.ActividadAdmin),
    },
    {
        path: 'recompensas',
        canMatch: [rolGuard(['admin'])],
        loadComponent: () => import('./recompensas-admin/recompensas-admin').then(m => m.RecompensasAdmin),
    },
    {
        path: 'precios',
        canMatch: [rolGuard(['admin'])],
        loadComponent: () => import('./precios-admin/precios-admin').then(m => m.PreciosAdmin),
    },
];