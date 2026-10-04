import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FuncionesService, Funcion } from '../../services/funciones.service';
import { PeliculasService, Pelicula } from '../../services/peliculas.service';
import { PwaService } from '../../services/pwa.service';
import { DIAS_PREVENTA, desdeIso, fechaLarga, hoy, sumarDias } from '../../shared/fechas';

@Component({
  selector: 'app-funciones-pelicula',
  imports: [RouterLink, DatePipe],
  templateUrl: './funciones-pelicula.html',
  styleUrl: './funciones-pelicula.css',
})
export class FuncionesPelicula implements OnInit {
  private funcionesService = inject(FuncionesService);
  private peliculasService = inject(PeliculasService);
  private route = inject(ActivatedRoute);
  protected pwa = inject(PwaService);

  pelicula = signal<Pelicula | null>(null);
  funciones = signal<Funcion[]>([]);
  cargando = signal(true);
  errorCarga = signal(false);

  /** Si la venta todavía no abrió, devuelve la fecha de apertura en texto; si no, null. */
  aperturaVenta = computed(() => {
    const p = this.pelicula();
    if (!p?.fecha_estreno) return null;
    const apertura = sumarDias(desdeIso(p.fecha_estreno), -DIAS_PREVENTA);
    return apertura > hoy() ? fechaLarga(apertura) : null;
  });

  /** Preventa vigente: entre 7 días antes del estreno y el día anterior, con precio especial cargado. */
  enPreventa = computed(() => {
    const p = this.pelicula();
    if (!p?.fecha_estreno || p.precio_preventa === null) return false;
    const estreno = desdeIso(p.fecha_estreno);
    const h = hoy();
    return h >= sumarDias(estreno, -DIAS_PREVENTA) && h < estreno;
  });

  async ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    try {
      const [pelicula, funciones] = await Promise.all([
        this.peliculasService.obtenerPorId(id),
        this.funcionesService.listarPorPelicula(id),
      ]);
      this.pelicula.set(pelicula);
      this.funciones.set(funciones);
    } catch (e) {
      console.error('Error al cargar las funciones', e);
      this.errorCarga.set(true);
    } finally {
      this.cargando.set(false);
    }
  }
}
