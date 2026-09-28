import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CuponesService, TipoCupon } from '../../services/cupones.service';

@Component({
  selector: 'app-cupon-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './cupon-form.html',
  styleUrl: './cupon-form.css',
})
export class CuponForm implements OnInit {
  private fb = inject(FormBuilder).nonNullable;
  private cuponesService = inject(CuponesService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  cuponId = signal<number | null>(null);
  // Los cupones nuevos son siempre "para mayores"; el de bienvenida ya existe y solo se edita.
  tipo = signal<TipoCupon>('mayores');
  guardando = signal(false);
  error = signal('');

  form = this.fb.group({
    nombre: ['', Validators.required],
    porcentaje: [10, [Validators.required, Validators.min(1), Validators.max(100)]],
    edad_mayor_a: [50, [Validators.required, Validators.min(0)]],
    activo: [true],
  });

  async ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam && idParam !== 'nuevo') {
      const id = Number(idParam);
      this.cuponId.set(id);
      const cupon = await this.cuponesService.obtener(id);
      if (cupon) {
        this.tipo.set(cupon.tipo);
        this.form.patchValue({
          nombre: cupon.nombre,
          porcentaje: cupon.porcentaje,
          edad_mayor_a: cupon.edad_mayor_a ?? 50,
          activo: cupon.activo,
        });
      }
    }
  }

  async guardar() {
    if (this.form.invalid) return;
    this.guardando.set(true);
    this.error.set('');
    try {
      const v = this.form.getRawValue();
      await this.cuponesService.guardar(
        {
          nombre: v.nombre,
          tipo: this.tipo(),
          porcentaje: v.porcentaje,
          edad_mayor_a: this.tipo() === 'mayores' ? v.edad_mayor_a : null,
          activo: v.activo,
        },
        this.cuponId() ?? undefined
      );
      this.router.navigateByUrl('/gestor/cupones');
    } catch (e) {
      console.error(e);
      this.error.set('No se pudo guardar el cupón.');
    } finally {
      this.guardando.set(false);
    }
  }
}