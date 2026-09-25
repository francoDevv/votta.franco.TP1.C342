import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PeliculasService, Genero } from '../../services/peliculas.service';

@Component({
  selector: 'app-pelicula-form',
  imports: [ReactiveFormsModule],
  templateUrl: './pelicula-form.html',
  styleUrl: './pelicula-form.css',
})
export class PeliculaForm implements OnInit {
  private fb = inject(FormBuilder).nonNullable;
  private peliculasService = inject(PeliculasService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  peliculaId = signal<number | null>(null);
  generosDisponibles = signal<Genero[]>([]);
  generosSeleccionados = signal<Set<number>>(new Set());
  archivoImagen = signal<File | null>(null);
  imagenActualUrl = signal<string | null>(null);
  guardando = signal(false);
  error = signal('');

  form = this.fb.group({
    nombre: ['', Validators.required],
    sinopsis: ['', Validators.required],
    duracionMinutos: [90, [Validators.required, Validators.min(1)]],
    restriccionEdad: [0, Validators.required],
    visibleEnHome: [true],
  });

  async ngOnInit() {
    this.generosDisponibles.set(await this.peliculasService.listarGeneros());

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam && idParam !== 'nuevo') {
      const id = Number(idParam);
      this.peliculaId.set(id);

      const pelicula = await this.peliculasService.obtenerPorId(id);
      if (!pelicula) {
        this.error.set('Película no encontrada');
        return;
      }

      this.form.patchValue({
        nombre: pelicula.nombre,
        sinopsis: pelicula.sinopsis,
        duracionMinutos: pelicula.duracion_minutos,
        restriccionEdad: pelicula.restriccion_edad,
        visibleEnHome: pelicula.visible_en_home,
      });
      this.generosSeleccionados.set(new Set(pelicula.generos.map((g) => g.id)));
      this.imagenActualUrl.set(this.peliculasService.urlImagen(pelicula.imagen_url));
    }
  }

  alternarGenero(id: number) {
    const nuevo = new Set(this.generosSeleccionados());
    nuevo.has(id) ? nuevo.delete(id) : nuevo.add(id);
    this.generosSeleccionados.set(nuevo);
  }

  archivoSeleccionado(event: Event) {
    const input = event.target as HTMLInputElement;
    this.archivoImagen.set(input.files?.[0] ?? null);
  }

  async guardar() {
    if (this.form.invalid) return;
    this.guardando.set(true);
    this.error.set('');

    try {
      const v = this.form.getRawValue();
      const datos: any = {
        nombre: v.nombre,
        sinopsis: v.sinopsis,
        duracion_minutos: v.duracionMinutos,
        restriccion_edad: v.restriccionEdad,
        visible_en_home: v.visibleEnHome,
      };

      if (this.archivoImagen()) {
        datos.imagen_url = await this.peliculasService.subirImagen(this.archivoImagen()!);
      }

      await this.peliculasService.guardar(
        datos,
        Array.from(this.generosSeleccionados()),
        this.peliculaId() ?? undefined
      );
      this.router.navigateByUrl('/gestor/peliculas');
    } catch (e) {
      console.error(e);
      this.error.set('No se pudo guardar la película.');
    } finally {
      this.guardando.set(false);
    }
  }
}