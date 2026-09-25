import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PeliculasService, Pelicula } from '../../services/peliculas.service';

@Component({
  selector: 'app-peliculas-admin',
  imports: [RouterLink],
  templateUrl: './peliculas-admin.html',
  styleUrl: './peliculas-admin.css',
})
export class PeliculasAdmin implements OnInit {
  private peliculasService = inject(PeliculasService);

  peliculas = signal<Pelicula[]>([]);
  cargando = signal(true);

  async ngOnInit() {
    await this.cargar();
  }

  async cargar() {
    this.cargando.set(true);
    this.peliculas.set(await this.peliculasService.listarTodas());
    this.cargando.set(false);
  }

  async eliminar(p: Pelicula) {
    if (!confirm(`¿Eliminar "${p.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await this.peliculasService.eliminar(p.id);
      await this.cargar();
    } catch (e) {
      console.error(e);
      alert('No se pudo eliminar la película.');
    }
  }
}