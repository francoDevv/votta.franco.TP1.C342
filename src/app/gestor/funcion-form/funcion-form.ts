import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FuncionesService, ResultadoAsignacion } from '../../services/funciones.service';
import { PeliculasService, Pelicula } from '../../services/peliculas.service';

const DIAS = [
  { valor: 0, nombre: 'Domingo' }, { valor: 1, nombre: 'Lunes' }, { valor: 2, nombre: 'Martes' },
  { valor: 3, nombre: 'Miércoles' }, { valor: 4, nombre: 'Jueves' }, { valor: 5, nombre: 'Viernes' },
  { valor: 6, nombre: 'Sábado' },
];

@Component({
  selector: 'app-funcion-form',
  imports: [ReactiveFormsModule],
  templateUrl: './funcion-form.html',
  styleUrl: './funcion-form.css',
})
export class FuncionForm implements OnInit {
  private fb = inject(FormBuilder).nonNullable;
  private funcionesService = inject(FuncionesService);
  private peliculasService = inject(PeliculasService);
  private router = inject(Router);

  dias = DIAS;
  peliculas = signal<Pelicula[]>([]);
  diasSeleccionados = signal<Set<number>>(new Set());
  guardando = signal(false);
  error = signal('');
  resultado = signal<ResultadoAsignacion[] | null>(null);

  form = this.fb.group({
    peliculaId: [0, Validators.required],
    hora: ['18:00', Validators.required],
    fechaDesde: ['', Validators.required],
    fechaHasta: ['', Validators.required],
    formato: ['2D' as const, Validators.required],
    idioma: ['castellano' as const, Validators.required],
  });

  async ngOnInit() {
    this.peliculas.set(await this.peliculasService.listarTodas());
  }

  alternarDia(dia: number) {
    const nuevo = new Set(this.diasSeleccionados());
    nuevo.has(dia) ? nuevo.delete(dia) : nuevo.add(dia);
    this.diasSeleccionados.set(nuevo);
  }

  async guardar() {
    if (this.form.invalid || this.diasSeleccionados().size === 0) {
      this.error.set('Completá todos los campos y elegí al menos un día.');
      return;
    }
    this.guardando.set(true);
    this.error.set('');
    this.resultado.set(null);

    try {
      const v = this.form.getRawValue();
      const resultado = await this.funcionesService.crearRecurrentes({
        peliculaId: v.peliculaId,
        diasSemana: Array.from(this.diasSeleccionados()),
        hora: v.hora,
        fechaDesde: v.fechaDesde,
        fechaHasta: v.fechaHasta,
        formato: v.formato,
        idioma: v.idioma,
      });
      this.resultado.set(resultado);
    } catch (e) {
      console.error(e);
      this.error.set('No se pudieron crear las funciones.');
    } finally {
      this.guardando.set(false);
    }
  }
}