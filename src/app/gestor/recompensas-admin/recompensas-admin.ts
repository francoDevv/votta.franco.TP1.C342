import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { PuntosService, Recompensa, TipoRecompensa } from '../../services/puntos.service';
import { CandyService, Producto } from '../../services/candy.service';

@Component({
  selector: 'app-recompensas-admin',
  imports: [ReactiveFormsModule],
  templateUrl: './recompensas-admin.html',
  styleUrl: './recompensas-admin.css',
})
export class RecompensasAdmin implements OnInit {
  private fb = inject(FormBuilder).nonNullable;
  private puntosService = inject(PuntosService);
  private candyService = inject(CandyService);

  recompensas = signal<Recompensa[]>([]);
  productos = signal<Producto[]>([]);
  editandoId = signal<number | null>(null);
  cargando = signal(true);
  guardando = signal(false);
  error = signal('');
  exito = signal('');

  form = this.fb.group({
    nombre: ['', Validators.required],
    tipo: this.fb.control<TipoRecompensa>('entrada'),
    productoId: this.fb.control<number | null>(null),
    costoPuntos: [500, [Validators.required, Validators.min(1)]],
    activa: [true],
  });

  tipo = toSignal(this.form.controls.tipo.valueChanges, { initialValue: this.form.controls.tipo.value });

  async ngOnInit() {
    try {
      this.productos.set(await this.candyService.listarProductos());
      await this.cargar();
    } catch (e) {
      console.error(e);
      this.error.set('No se pudieron cargar las recompensas.');
    } finally {
      this.cargando.set(false);
    }
  }

  private async cargar() {
    this.recompensas.set(await this.puntosService.listarRecompensas(false));
  }

  /** Al elegir un producto, sugiere su nombre si el campo está vacío. */
  productoElegido() {
    const id = this.form.controls.productoId.value;
    const producto = this.productos().find((p) => p.id === id);
    if (producto && !this.form.controls.nombre.value.trim()) {
      this.form.controls.nombre.setValue(producto.nombre);
    }
  }

  editar(r: Recompensa) {
    this.editandoId.set(r.id);
    this.exito.set('');
    this.error.set('');
    this.form.setValue({
      nombre: r.nombre,
      tipo: r.tipo,
      productoId: r.producto_id,
      costoPuntos: r.costo_puntos,
      activa: r.activa,
    });
  }

  cancelarEdicion() {
    this.editandoId.set(null);
    this.form.reset();
  }

  async guardar() {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    if (v.tipo === 'producto' && !v.productoId) {
      this.error.set('Elegí el producto del candy que se entrega con esta recompensa.');
      return;
    }

    this.guardando.set(true);
    this.error.set('');
    this.exito.set('');
    try {
      await this.puntosService.guardarRecompensa(
        {
          nombre: v.nombre.trim(),
          tipo: v.tipo,
          producto_id: v.tipo === 'producto' ? v.productoId : null,
          costo_puntos: v.costoPuntos,
          activa: v.activa,
        },
        this.editandoId() ?? undefined
      );
      this.exito.set(this.editandoId() ? 'Recompensa actualizada.' : 'Recompensa creada.');
      this.cancelarEdicion();
      await this.cargar();
    } catch (e: any) {
      console.error(e);
      this.error.set(e?.message ?? 'No se pudo guardar la recompensa.');
    } finally {
      this.guardando.set(false);
    }
  }

  async alternarActiva(r: Recompensa) {
    this.error.set('');
    try {
      await this.puntosService.guardarRecompensa(
        { nombre: r.nombre, tipo: r.tipo, producto_id: r.producto_id, costo_puntos: r.costo_puntos, activa: !r.activa },
        r.id
      );
      await this.cargar();
    } catch (e: any) {
      console.error(e);
      this.error.set(e?.message ?? 'No se pudo actualizar la recompensa.');
    }
  }
}
