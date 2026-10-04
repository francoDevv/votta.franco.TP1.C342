import { Component, computed, inject } from '@angular/core';
import { PwaService } from '../../services/pwa.service';

/**
 * Avisos de la PWA, fijos al pie de la pantalla (no mueven el contenido):
 * sin conexión, nueva versión disponible e invitación a instalar la app.
 */
@Component({
  selector: 'app-barra-pwa',
  templateUrl: './barra-pwa.html',
  styleUrl: './barra-pwa.css',
})
export class BarraPwa {
  protected pwa = inject(PwaService);

  protected mostrarInstalacion = computed(
    () => !this.pwa.instalada() && !this.pwa.avisoInstalacionDescartado() && this.pwa.puedeInstalar()
  );

  protected mostrarInstruccionesIos = computed(
    () => !this.pwa.avisoInstalacionDescartado() && this.pwa.instalarEnIos()
  );
}
