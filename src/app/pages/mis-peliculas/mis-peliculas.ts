import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PeliculasService, PeliculaVista } from '../../services/peliculas.service';

@Component({
  selector: 'app-mis-peliculas',
  imports: [DatePipe, RouterLink],
  templateUrl: './mis-peliculas.html',
  styleUrl: './mis-peliculas.css',
})
export class MisPeliculas implements OnInit {
  private peliculasService = inject(PeliculasService);

  peliculas = signal<PeliculaVista[]>([]);
  cargando = signal(true);
  error = signal('');

  async ngOnInit() {
    try {
      this.peliculas.set(await this.peliculasService.misPeliculas());
    } catch (e) {
      console.error(e);
      this.error.set('No se pudo cargar tu historial.');
    } finally {
      this.cargando.set(false);
    }
  }

  urlImagen(path: string | null) {
    return this.peliculasService.urlImagen(path);
  }

  estrellas(n: number): string {
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  }
}
