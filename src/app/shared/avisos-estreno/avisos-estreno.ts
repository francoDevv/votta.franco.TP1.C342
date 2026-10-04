import { Component, effect, inject, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AlertasService, AvisoEstreno } from '../../services/alertas.service';
import { AuthService } from '../../services/auth.service';

/**
 * Barra de avisos dentro de la app: muestra al cliente las películas
 * con alerta activa cuyas entradas ya salieron a la venta.
 */
@Component({
  selector: 'app-avisos-estreno',
  imports: [RouterLink],
  templateUrl: './avisos-estreno.html',
  styleUrl: './avisos-estreno.css',
})
export class AvisosEstreno {
  protected alertas = inject(AlertasService);
  private auth = inject(AuthService);

  constructor() {
    // Se recargan al iniciar sesión o cambiar de usuario
    effect(() => {
      if (this.auth.cargando()) return;
      const esCliente = this.auth.rol() === 'cliente';
      untracked(() => {
        if (esCliente) {
          this.alertas.cargarAvisos().catch((e) => console.error('No se pudieron cargar los avisos', e));
        } else {
          this.alertas.limpiar();
        }
      });
    });
  }

  async cerrar(aviso: AvisoEstreno) {
    try {
      await this.alertas.marcarVisto(aviso.pelicula_id);
    } catch (e) {
      console.error('No se pudo marcar el aviso como visto', e);
    }
  }
}
