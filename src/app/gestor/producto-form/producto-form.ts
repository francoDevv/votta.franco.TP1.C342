import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CandyService, CategoriaCandy } from '../../services/candy.service';

@Component({
  selector: 'app-producto-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './producto-form.html',
  styleUrl: './producto-form.css',
})
export class ProductoForm implements OnInit {
  private fb = inject(FormBuilder).nonNullable;
  private candyService = inject(CandyService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  productoId = signal<number | null>(null);
  categorias = signal<CategoriaCandy[]>([]);
  guardando = signal(false);
  error = signal('');

  form = this.fb.group({
    categoria_id: [0, Validators.required],
    nombre: ['', Validators.required],
    descripcion: [''],
    precio: [0, [Validators.required, Validators.min(0)]],
    disponible: [true],
  });

  async ngOnInit() {
    this.categorias.set(await this.candyService.listarCategorias());

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam && idParam !== 'nuevo') {
      const id = Number(idParam);
      this.productoId.set(id);
      const producto = await this.candyService.obtenerProducto(id);
      if (producto) {
        this.form.patchValue({
          categoria_id: producto.categoria_id,
          nombre: producto.nombre,
          descripcion: producto.descripcion ?? '',
          precio: producto.precio,
          disponible: producto.disponible,
        });
      }
    }
  }

  async guardar() {
    if (this.form.invalid) return;
    this.guardando.set(true);
    this.error.set('');
    try {
      await this.candyService.guardarProducto(this.form.getRawValue(), this.productoId() ?? undefined);
      this.router.navigateByUrl('/gestor/productos');
    } catch (e) {
      console.error(e);
      this.error.set('No se pudo guardar el producto.');
    } finally {
      this.guardando.set(false);
    }
  }
}