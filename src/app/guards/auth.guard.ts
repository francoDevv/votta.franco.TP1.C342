import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return toObservable(auth.cargando).pipe(
    filter((cargando) => !cargando),
    take(1),
    map(() => auth.logueado() ? true : router.parseUrl('/login'))
  );
};