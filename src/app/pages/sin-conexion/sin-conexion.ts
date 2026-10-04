import { Component, effect, inject, untracked } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PwaService } from '../../services/pwa.service';

@Component({
  selector: 'app-sin-conexion',
  imports: [RouterLink],
  templateUrl: './sin-conexion.html',
  styleUrl: './sin-conexion.css',
})
export class SinConexion {
  protected pwa = inject(PwaService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  /** Página a la que el usuario quería ir (solo rutas internas). */
  private destino: string | null = (() => {
    const volver = this.route.snapshot.queryParamMap.get('volver');
    return volver && volver.startsWith('/') && !volver.startsWith('//') ? volver : null;
  })();

  protected hayDestino = this.destino !== null;

  constructor() {
    // Cuando vuelve la conexión, el usuario sigue donde estaba, sin tocar nada
    effect(() => {
      if (this.pwa.online() && this.destino) {
        untracked(() => this.router.navigateByUrl(this.destino!));
      }
    });
  }

  protected reintentar() {
    if (this.pwa.online() && this.destino) this.router.navigateByUrl(this.destino);
  }
}
