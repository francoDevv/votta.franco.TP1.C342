import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CandyService, Producto } from '../../services/candy.service';

interface ItemSeleccionado { producto_id: number; cantidad: number; }

@Component({
  selector: 'app-combo-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './combo-form.html',
  styleUrl: './combo-form.css',
})
export class ComboForm implements OnInit {
  private fb = inject(FormBuilder).nonNullable;
  private candyService = inject(CandyService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  comboId = signal<number | null>(null);
  productos = signal<Producto[]>([]);
  items = signal<ItemSeleccionado[]>([]);
  guardando = signal(false);
  error = signal('');

  form = this.fb.group({
    nombre: ['', Validators.required],
    descripcion: [''],
    precio: [0, [Validators.required, Validators.min(0)]],
    destacado: [false],
    disponible: [true],
  });

  async ngOnInit() {
    this.productos.set(await this.candyService.listarProductos(true));

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam && idParam !== 'nuevo') {
      const id = Number(idParam);
      this.comboId.set(id);
      const combo = await this.candyService.obtenerCombo(id);
      if (combo) {
        this.form.patchValue({
          nombre: combo.nombre,
          descripcion: combo.descripcion ?? '',
          precio: combo.precio,
          destacado: combo.destacado,
          disponible: combo.disponible,
        });
        this.items.set(combo.items.map((i) => ({ producto_id: i.producto_id, cantidad: i.cantidad })));
      }
    }
  }

  agregarItem() {
    const disponibles = this.productos().filter((p) => !this.items().some((i) => i.producto_id === p.id));
    if (disponibles.length === 0) return;
    this.items.update((lista) => [...lista, { producto_id: disponibles[0].id, cantidad: 1 }]);
  }

  quitarItem(index: number) {
    this.items.update((lista) => lista.filter((_, i) => i !== index));
  }

  actualizarProducto(index: number, productoId: number) {
    this.items.update((lista) => lista.map((it, i) => (i === index ? { ...it, producto_id: productoId } : it)));
  }

  actualizarCantidad(index: number, cantidad: number) {
    this.items.update((lista) => lista.map((it, i) => (i === index ? { ...it, cantidad } : it)));
  }

  async guardar() {
    if (this.form.invalid || this.items().length === 0) {
      this.error.set('Completá los datos y agregá al menos un producto.');
      return;
    }
    this.guardando.set(true);
    this.error.set('');
    try {
      await this.candyService.guardarCombo(this.form.getRawValue(), this.items(), this.comboId() ?? undefined);
      this.router.navigateByUrl('/gestor/combos');
    } catch (e) {
      console.error(e);
      this.error.set('No se pudo guardar el combo.');
    } finally {
      this.guardando.set(false);
    }
  }
}