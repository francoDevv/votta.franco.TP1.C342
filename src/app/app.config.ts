import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
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
  ]
};
