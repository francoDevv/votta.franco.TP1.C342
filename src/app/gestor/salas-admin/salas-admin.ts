import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SalasService, Sala } from '../../services/salas.service';

@Component({
  selector: 'app-salas-admin',
  imports: [RouterLink],
  templateUrl: './salas-admin.html',
  styleUrl: './salas-admin.css',
})
export class SalasAdmin implements OnInit {
  private salasService = inject(SalasService);

  salas = signal<Sala[]>([]);
  cargando = signal(true);
  nombreNuevo = signal('');
  creando = signal(false);
  error = signal('');

  async ngOnInit() {
    await this.cargar();
  }

  async cargar() {
    this.cargando.set(true);
    this.salas.set(await this.salasService.listar());
    this.cargando.set(false);
  }

  async crear() {
    if (!this.nombreNuevo().trim()) return;
    this.creando.set(true);
    this.error.set('');
    try {
      await this.salasService.crear(this.nombreNuevo().trim());
      this.nombreNuevo.set('');
      await this.cargar();
    } catch (e) {
      console.error(e);
      this.error.set('No se pudo crear la sala. ¿El nombre ya existe?');
    } finally {
      this.creando.set(false);
    }
  }

  async eliminar(s: Sala) {
    if (!confirm(`¿Eliminar "${s.nombre}" y todas sus butacas?`)) return;
    await this.salasService.eliminar(s.id);
    await this.cargar();
  }
}