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

  /** Ids de las 3 más vendidas, en orden (mail del 16/01). */
  masVendidas = signal<number[]>([]);

  busqueda = signal('');
  generoSeleccionado = signal<number | null>(null);

  peliculasFiltradas = computed(() => {
    const texto = this.busqueda().toLowerCase().trim();
    const genero = this.generoSeleccionado();

    const filtradas = this.peliculas().filter((p) => {
      const coincideTexto = !texto || p.nombre.toLowerCase().includes(texto);
      const coincideGenero = !genero || p.generos.some((g) => g.id === genero);
      return coincideTexto && coincideGenero;
    });

    // Las más vendidas van primero, en su orden; el resto sigue por nombre
    const top = this.masVendidas();
    const puesto = (id: number) => {
      const i = top.indexOf(id);
      return i === -1 ? Number.MAX_SAFE_INTEGER : i;
    };
    return [...filtradas].sort((a, b) => puesto(a.id) - puesto(b.id) || a.nombre.localeCompare(b.nombre));
  });

  /** Puesto en el ranking (1, 2 o 3) o null si no está entre las más vendidas. */
  puestoTop(id: number): number | null {
    const i = this.masVendidas().indexOf(id);
    return i === -1 ? null : i + 1;
  }

  async ngOnInit() {
    try {
      // El ranking de más vendidas se pide aparte: es opcional y, sin conexión, no está guardado.
      // Así la cartelera se muestra igual (desde la copia guardada) aunque ese pedido falle.
      this.peliculasService
        .masVendidas(3)
        .then((ids) => this.masVendidas.set(ids))
        .catch((e) => console.warn('No se pudo cargar el ranking de más vendidas', e));

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