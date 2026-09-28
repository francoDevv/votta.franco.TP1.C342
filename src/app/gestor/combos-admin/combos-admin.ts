import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CandyService, Combo } from '../../services/candy.service';

@Component({
  selector: 'app-combos-admin',
  imports: [RouterLink],
  templateUrl: './combos-admin.html',
  styleUrl: './combos-admin.css',
})
export class CombosAdmin implements OnInit {
  private candyService = inject(CandyService);

  combos = signal<Combo[]>([]);
  cargando = signal(true);

  async ngOnInit() {
    await this.cargar();
  }

  async cargar() {
    this.cargando.set(true);
    this.combos.set(await this.candyService.listarCombos());
    this.cargando.set(false);
  }

  async eliminar(c: Combo) {
    if (!confirm(`¿Eliminar "${c.nombre}"?`)) return;
    await this.candyService.eliminarCombo(c.id);
    await this.cargar();
  }
}