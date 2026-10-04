import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ConfiguracionService, ConfiguracionPrecios } from '../../services/configuracion.service';

@Component({
  selector: 'app-precios-admin',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './precios-admin.html',
  styleUrl: './precios-admin.css',
})
export class PreciosAdmin implements OnInit {
  private fb = inject(FormBuilder).nonNullable;
  private configuracion = inject(ConfiguracionService);

  actual = signal<ConfiguracionPrecios | null>(null);
  cargando = signal(true);
  guardando = signal(false);
  error = signal('');
  exito = signal('');

  form = this.fb.group({
    precioBase: [0, [Validators.required, Validators.min(1)]],
    recargoVip: [0, [Validators.required, Validators.min(0)]],
  });

  private valores = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  /** Cómo quedarían los precios con los valores del formulario. */
  vistaPrevia = computed(() => {
    const v = this.valores();
    const base = Number(v.precioBase ?? 0);
    const recargo = Number(v.recargoVip ?? 0);
    return { normal: base, vip: base + recargo };
  });

  async ngOnInit() {
    await this.cargar();
  }

  private async cargar() {
    this.cargando.set(true);
    try {
      const precios = await this.configuracion.obtenerPrecios();
      this.actual.set(precios);
      this.form.setValue({ precioBase: precios.precio_base, recargoVip: precios.recargo_vip });
    } catch (e) {
      console.error(e);
      this.error.set('No se pudieron cargar los precios.');
    } finally {
      this.cargando.set(false);
    }
  }

  formatear(monto: number): string {
    return '$' + monto.toLocaleString('es-AR');
  }

  async guardar() {
    if (this.form.invalid) return;
    this.guardando.set(true);
    this.error.set('');
    this.exito.set('');
    try {
      const v = this.form.getRawValue();
      await this.configuracion.actualizarPrecios(v.precioBase, v.recargoVip);
      this.exito.set('Precios actualizados. Se aplican a las compras nuevas.');
      await this.cargar();
    } catch (e: any) {
      console.error(e);
      this.error.set(e?.message ?? 'No se pudieron guardar los precios.');
    } finally {
      this.guardando.set(false);
    }
  }
}