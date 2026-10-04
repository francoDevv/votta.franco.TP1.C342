import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PeliculasService, Pelicula, Resena } from '../../services/peliculas.service';
import { AuthService } from '../../services/auth.service';
import { PwaService } from '../../services/pwa.service';

@Component({
  selector: 'app-pelicula-detalle',
  imports: [FormsModule, RouterLink],
  templateUrl: './pelicula-detalle.html',
  styleUrl: './pelicula-detalle.css',
})
export class PeliculaDetalle implements OnInit {
  private peliculasService = inject(PeliculasService);
  private route = inject(ActivatedRoute);
  protected auth = inject(AuthService);
  protected pwa = inject(PwaService);

  pelicula = signal<Pelicula | null>(null);
  resenas = signal<Resena[]>([]);
  promedio = signal<{ promedio: number; cantidad: number } | null>(null);
  miResena = signal<Resena | null>(null);
  cargando = signal(true);
  /** No se pudo pedir la película (sin conexión o falla del servidor). */
  errorCarga = signal(false);
  /** La película se ve, pero no se pudieron traer las reseñas. */
  resenasNoDisponibles = signal(false);

  estrellasNuevas = signal(5);
  comentarioNuevo = signal('');
  guardandoResena = signal(false);
  errorResena = signal('');

  async ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    await this.cargarTodo(id);
  }

  async cargarTodo(id: number) {
    this.cargando.set(true);
    this.errorCarga.set(false);
    this.resenasNoDisponibles.set(false);

    // Se piden juntas, pero cada una se evalúa por separado: si fallan las reseñas
    // (por ejemplo, sin conexión) la película se muestra igual.
    const [pelicula, resenas, promedio] = await Promise.allSettled([
      this.peliculasService.obtenerPorId(id),
      this.peliculasService.listarResenas(id),
      this.peliculasService.obtenerPromedio(id),
    ]);

    if (pelicula.status === 'rejected') {
      console.error('Error al cargar la película', pelicula.reason);
      this.pelicula.set(null);
      this.errorCarga.set(true);
      this.cargando.set(false);
      return;
    }

    this.pelicula.set(pelicula.value);
    if (resenas.status === 'fulfilled') this.resenas.set(resenas.value);
    else this.resenasNoDisponibles.set(true);
    this.promedio.set(promedio.status === 'fulfilled' ? promedio.value : null);

    if (pelicula.value && this.auth.rol() === 'cliente') {
      try {
        const mia = await this.peliculasService.miResena(id, this.auth.usuario()!.id);
        this.miResena.set(mia);
        if (mia) {
          this.estrellasNuevas.set(mia.estrellas);
          this.comentarioNuevo.set(mia.comentario);
        }
      } catch (e) {
        console.warn('No se pudo cargar mi reseña', e);
      }
    }
    this.cargando.set(false);
  }

  async guardarResena() {
    const pelicula = this.pelicula();
    if (!pelicula) return;

    this.guardandoResena.set(true);
    this.errorResena.set('');
    try {
      await this.peliculasService.guardarResena(
        pelicula.id,
        this.auth.usuario()!.id,
        this.estrellasNuevas(),
        this.comentarioNuevo()
      );
      await this.cargarTodo(pelicula.id);
    } catch (e) {
      console.error(e);
      this.errorResena.set('No se pudo guardar la reseña.');
    } finally {
      this.guardandoResena.set(false);
    }
  }

  urlImagen(path: string | null) {
    return this.peliculasService.urlImagen(path);
  }
}