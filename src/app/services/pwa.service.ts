import { Injectable, inject, signal } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

/** Evento no estándar que dispara Chrome/Edge/Android cuando la app se puede instalar. */
interface EventoInstalacion extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const CLAVE_DESCARTADO = 'cine_pwa_instalar_descartado';
const DIAS_SIN_INSISTIR = 14;
const CADA_CUANTO_BUSCAR_VERSION = 60 * 60 * 1000; // 1 hora

function estaInstalada(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true // iOS
  );
}

function esIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
}

/**
 * Todo lo que tiene que ver con la PWA: estado de conexión, instalación y nuevas versiones.
 * Lo consume la barra de avisos y las pantallas que necesitan internet (compra, validación).
 */
@Injectable({ providedIn: 'root' })
export class PwaService {
  private swUpdate = inject(SwUpdate);
  private eventoInstalacion: EventoInstalacion | null = null;

  /** true si hay conexión (el navegador avisa cuando se pierde o vuelve). */
  readonly online = signal(navigator.onLine);
  /** Se puede instalar con el diálogo nativo (Chrome, Edge, Android). */
  readonly puedeInstalar = signal(false);
  /** iPhone/iPad en Safari: no hay diálogo, se instala desde "Compartir". */
  readonly instalarEnIos = signal(esIos() && !estaInstalada());
  readonly instalada = signal(estaInstalada());
  /** El usuario ya cerró el aviso de instalación hace poco: no insistimos. */
  readonly avisoInstalacionDescartado = signal(this.fueDescartado());
  /** Hay una versión nueva descargada, lista para activar. */
  readonly actualizacionLista = signal(false);

  constructor() {
    window.addEventListener('online', () => this.online.set(true));
    window.addEventListener('offline', () => this.online.set(false));

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault(); // evita el mini-aviso del navegador: lo mostramos nosotros
      this.eventoInstalacion = e as EventoInstalacion;
      this.puedeInstalar.set(true);
    });
    window.addEventListener('appinstalled', () => {
      this.eventoInstalacion = null;
      this.puedeInstalar.set(false);
      this.instalada.set(true);
    });

    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates
        .pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'))
        .subscribe(() => this.actualizacionLista.set(true));

      // Si el service worker queda en un estado inconsistente, lo más sano es recargar
      this.swUpdate.unrecoverable.subscribe(() => this.actualizacionLista.set(true));

      // Busca versiones nuevas cada tanto y cuando el usuario vuelve a la app
      setInterval(() => this.buscarActualizacion(), CADA_CUANTO_BUSCAR_VERSION);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') this.buscarActualizacion();
      });
    }
  }

  async instalar(): Promise<void> {
    const evento = this.eventoInstalacion;
    if (!evento) return;
    await evento.prompt();
    const { outcome } = await evento.userChoice;
    if (outcome === 'accepted') this.puedeInstalar.set(false);
    this.eventoInstalacion = null;
  }

  /** "Ahora no": no volvemos a mostrar el aviso por un tiempo. */
  descartarAvisoInstalacion(): void {
    try {
      localStorage.setItem(CLAVE_DESCARTADO, String(Date.now()));
    } catch {
      /* sin almacenamiento: el aviso vuelve en la próxima visita */
    }
    this.avisoInstalacionDescartado.set(true);
  }

  async actualizar(): Promise<void> {
    try {
      if (this.swUpdate.isEnabled) await this.swUpdate.activateUpdate();
    } finally {
      document.location.reload();
    }
  }

  private async buscarActualizacion(): Promise<void> {
    if (!this.online()) return;
    try {
      await this.swUpdate.checkForUpdate();
    } catch (e) {
      console.warn('No se pudo buscar una versión nueva', e);
    }
  }

  private fueDescartado(): boolean {
    try {
      const guardado = Number(localStorage.getItem(CLAVE_DESCARTADO));
      return guardado > 0 && Date.now() - guardado < DIAS_SIN_INSISTIR * 24 * 60 * 60 * 1000;
    } catch {
      return false;
    }
  }
}
