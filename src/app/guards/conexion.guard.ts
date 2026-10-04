import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PwaService } from '../services/pwa.service';

/**
 * Para las secciones que necesitan internet sí o sí (butacas, pago, mis entradas, perfil):
 * sin conexión, en lugar de quedar en "Cargando…", se muestra la pantalla "Sin conexión"
 * y se recuerda a dónde volver.
 */
export const conexionGuard: CanActivateFn = (_route, state) => {
  const pwa = inject(PwaService);
  const router = inject(Router);
  return pwa.online()
    ? true
    : router.createUrlTree(['/sin-conexion'], { queryParams: { volver: state.url } });
};
