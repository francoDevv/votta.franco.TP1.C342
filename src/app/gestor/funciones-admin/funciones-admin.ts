import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FuncionesService, Funcion } from '../../services/funciones.service';

@Component({
  selector: 'app-funciones-admin',
  imports: [RouterLink, DatePipe],
  templateUrl: './funciones-admin.html',
  styleUrl: './funciones-admin.css',
})
export class FuncionesAdmin implements OnInit {
  private funcionesService = inject(FuncionesService);

  funciones = signal<Funcion[]>([]);
  cargando = signal(true);

  async ngOnInit() {
    await this.cargar();
  }

  async cargar() {
    this.cargando.set(true);
    this.funciones.set(await this.funcionesService.listarProximas());
    this.cargando.set(false);
  }

  async eliminar(f: Funcion) {
    if (!confirm('¿Eliminar esta función?')) return;
    await this.funcionesService.eliminar(f.id);
    await this.cargar();
  }
}