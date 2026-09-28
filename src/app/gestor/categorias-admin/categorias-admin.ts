import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CandyService, CategoriaCandy } from '../../services/candy.service';

@Component({
  selector: 'app-categorias-admin',
  imports: [RouterLink],
  templateUrl: './categorias-admin.html',
  styleUrl: './categorias-admin.css',
})
export class CategoriasAdmin implements OnInit {
  private candyService = inject(CandyService);

  categorias = signal<CategoriaCandy[]>([]);
  cargando = signal(true);
  nombreNuevo = signal('');
  error = signal('');

  async ngOnInit() {
    await this.cargar();
  }

  async cargar() {
    this.cargando.set(true);
    this.categorias.set(await this.candyService.listarCategorias());
    this.cargando.set(false);
  }

  async crear() {
    if (!this.nombreNuevo().trim()) return;
    this.error.set('');
    try {
      await this.candyService.crearCategoria(this.nombreNuevo().trim());
      this.nombreNuevo.set('');
      await this.cargar();
    } catch (e) {
      console.error(e);
      this.error.set('No se pudo crear (¿nombre repetido?)');
    }
  }

  async eliminar(c: CategoriaCandy) {
    if (!confirm(`¿Eliminar "${c.nombre}"?`)) return;
    try {
      await this.candyService.eliminarCategoria(c.id);
      await this.cargar();
    } catch (e) {
      console.error(e);
      this.error.set('No se pudo eliminar. Puede tener productos asociados.');
    }
  }
}