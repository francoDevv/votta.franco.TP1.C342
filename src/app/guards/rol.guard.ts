import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';
import { AuthService, Rol } from '../services/auth.service';

export function rolGuard(rolesPermitidos: Rol[]): CanMatchFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    return toObservable(auth.cargando).pipe(
      filter((cargando) => !cargando),
      take(1),
      map(() => {
        if (!auth.logueado()) return router.parseUrl('/login');
        return rolesPermitidos.includes(auth.rol())
          ? true
          : router.parseUrl('/'); // logueado, pero sin permiso: no muestra el admin
      })
    );
  };
}