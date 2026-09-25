import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { PeliculasService, Pelicula, Genero } from '../../services/peliculas.service';
import { RouterLink } from '@angular/router';


@Component({
  selector: 'app-cartelera',
  imports: [RouterLink],
  templateUrl: './cartelera.html',
  styleUrl: './cartelera.css',
})
export class Cartelera implements OnInit {
  private peliculasService = inject(PeliculasService);

  peliculas = signal<Pelicula[]>([]);
  generos = signal<Genero[]>([]);
  cargando = signal(true);

  busqueda = signal('');
  generoSeleccionado = signal<number | null>(null);

  peliculasFiltradas = computed(() => {
    const texto = this.busqueda().toLowerCase().trim();
    const genero = this.generoSeleccionado();

    return this.peliculas().filter((p) => {
      const coincideTexto = !texto || p.nombre.toLowerCase().includes(texto);
      const coincideGenero = !genero || p.generos.some((g) => g.id === genero);
      return coincideTexto && coincideGenero;
    });
  });

  async ngOnInit() {
    try {
      const [peliculas, generos] = await Promise.all([
        this.peliculasService.listarVisibles(),
        this.peliculasService.listarGeneros(),
      ]);
      this.peliculas.set(peliculas);
      this.generos.set(generos);
    } catch (e) {
      console.error('Error al cargar la cartelera', e);
    } finally {
      this.cargando.set(false);
    }
  }

  urlImagen(path: string | null) {
    return this.peliculasService.urlImagen(path);
  }
}