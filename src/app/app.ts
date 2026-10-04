import { Component, HostListener, computed, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './services/auth.service';
import { PwaService } from './services/pwa.service';
import { AvisosEstreno } from './shared/avisos-estreno/avisos-estreno';
import { BarraPwa } from './shared/barra-pwa/barra-pwa';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AvisosEstreno, BarraPwa],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected auth = inject(AuthService);
  protected pwa = inject(PwaService);

  protected esGestion = computed(() => !this.auth.cargando() && ['gestor', 'admin'].includes(this.auth.rol()));
  protected esAdmin = computed(() => !this.auth.cargando() && this.auth.rol() === 'admin');
  protected esValidador = computed(() => !this.auth.cargando() && ['empleado', 'admin'].includes(this.auth.rol()));

  /** Un clic fuera de un menú (o sobre una de sus opciones) lo cierra. */
  @HostListener('document:click', ['$event'])
  cerrarMenus(evento: Event) {
    const destino = evento.target as HTMLElement | null;
    document.querySelectorAll('details.menu[open]').forEach((menu) => {
      if (!destino || !menu.contains(destino) || destino.closest('a')) menu.removeAttribute('open');
    });
  }

  @HostListener('document:keydown.escape')
  cerrarMenusConEscape() {
    document.querySelectorAll('details.menu[open]').forEach((menu) => menu.removeAttribute('open'));
  }
}
