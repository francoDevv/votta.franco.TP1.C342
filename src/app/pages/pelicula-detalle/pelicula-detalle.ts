import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PeliculasService, Pelicula, Resena } from '../../services/peliculas.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-pelicula-detalle',
  imports: [FormsModule],
  templateUrl: './pelicula-detalle.html',
  styleUrl: './pelicula-detalle.css',
})
export class PeliculaDetalle implements OnInit {
  private peliculasService = inject(PeliculasService);
  private route = inject(ActivatedRoute);
  protected auth = inject(AuthService);

  pelicula = signal<Pelicula | null>(null);
  resenas = signal<Resena[]>([]);
  promedio = signal<{ promedio: number; cantidad: number } | null>(null);
  miResena = signal<Resena | null>(null);
  cargando = signal(true);

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
    try {
      const [pelicula, resenas, promedio] = await Promise.all([
        this.peliculasService.obtenerPorId(id),
        this.peliculasService.listarResenas(id),
        this.peliculasService.obtenerPromedio(id),
      ]);

      this.pelicula.set(pelicula);
      this.resenas.set(resenas);
      this.promedio.set(promedio);

      if (pelicula && this.auth.rol() === 'cliente') {
        const mia = await this.peliculasService.miResena(id, this.auth.usuario()!.id);
        this.miResena.set(mia);
        if (mia) {
          this.estrellasNuevas.set(mia.estrellas);
          this.comentarioNuevo.set(mia.comentario);
        }
      }
    } catch (e) {
      console.error('Error al cargar la pelicula', e);
      this.pelicula.set(null);
    } finally {
      this.cargando.set(false);
    }
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