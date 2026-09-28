import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CandyService, Producto } from '../../services/candy.service';

@Component({
  selector: 'app-productos-admin',
  imports: [RouterLink],
  templateUrl: './productos-admin.html',
  styleUrl: './productos-admin.css',
})
export class ProductosAdmin implements OnInit {
  private candyService = inject(CandyService);

  productos = signal<Producto[]>([]);
  cargando = signal(true);

  async ngOnInit() {
    await this.cargar();
  }

  async cargar() {
    this.cargando.set(true);
    this.productos.set(await this.candyService.listarProductos());
    this.cargando.set(false);
  }

  async eliminar(p: Producto) {
    if (!confirm(`¿Eliminar "${p.nombre}"?`)) return;
    await this.candyService.eliminarProducto(p.id);
    await this.cargar();
  }
}