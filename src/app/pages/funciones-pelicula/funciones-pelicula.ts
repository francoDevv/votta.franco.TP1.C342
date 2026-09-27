import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FuncionesService, Funcion } from '../../services/funciones.service';
import { PeliculasService, Pelicula } from '../../services/peliculas.service';

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

  pelicula = signal<Pelicula | null>(null);
  funciones = signal<Funcion[]>([]);
  cargando = signal(true);

  async ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const [pelicula, funciones] = await Promise.all([
      this.peliculasService.obtenerPorId(id),
      this.funcionesService.listarPorPelicula(id),
    ]);
    this.pelicula.set(pelicula);
    this.funciones.set(funciones);
    this.cargando.set(false);
  }
}