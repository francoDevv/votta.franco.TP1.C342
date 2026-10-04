import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { LOCALE_ID } from '@angular/core';
import { DATE_PIPE_DEFAULT_OPTIONS, registerLocaleData } from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';

registerLocaleData(localeEsAr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    { provide: LOCALE_ID, useValue: 'es-AR' },
    // Todas las fechas y horas se muestran en hora de Argentina, sin importar
    // la zona horaria configurada en el dispositivo (Argentina no tiene horario de verano)
    { provide: DATE_PIPE_DEFAULT_OPTIONS, useValue: { timezone: '-0300' } },
    // PWA: el service worker se activa solo en producción (en "ng serve" quedaría cacheando el código viejo).
    // Se registra cuando la app termina de cargar (o a los 30 s), para no competir con la carga inicial.
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ]
};
