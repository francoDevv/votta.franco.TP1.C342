import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CuponesService, Cupon } from '../../services/cupones.service';

@Component({
  selector: 'app-cupones-admin',
  imports: [RouterLink],
  templateUrl: './cupones-admin.html',
  styleUrl: './cupones-admin.css',
})
export class CuponesAdmin implements OnInit {
  private cuponesService = inject(CuponesService);

  cupones = signal<Cupon[]>([]);
  cargando = signal(true);
  error = signal('');

  async ngOnInit() {
    await this.cargar();
  }

  async cargar() {
    this.cargando.set(true);
    this.cupones.set(await this.cuponesService.listar());
    this.cargando.set(false);
  }

  aQuienAplica(c: Cupon): string {
    return c.tipo === 'bienvenida'
      ? 'Primera compra de un cliente registrado'
      : `Clientes de más de ${c.edad_mayor_a} años`;
  }

  async eliminar(c: Cupon) {
    if (!confirm(`¿Eliminar "${c.nombre}"?`)) return;
    this.error.set('');
    try {
      await this.cuponesService.eliminar(c.id);
      await this.cargar();
    } catch (e) {
      console.error(e);
      this.error.set('No se pudo eliminar el cupón.');
    }
  }
}