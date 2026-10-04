import { Component, OnInit, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PeliculasService, Pelicula } from '../../services/peliculas.service';
import { AlertasService } from '../../services/alertas.service';
import { AuthService } from '../../services/auth.service';
import { DIAS_PREVENTA, desdeIso, fechaLarga, hoy, sumarDias } from '../../shared/fechas';

@Component({
  selector: 'app-proximamente',
  imports: [RouterLink],
  templateUrl: './proximamente.html',
  styleUrl: './proximamente.css',
})
export class Proximamente implements OnInit {
  private peliculasService = inject(PeliculasService);
  private alertasService = inject(AlertasService);
  protected auth = inject(AuthService);

  peliculas = signal<Pelicula[]>([]);
  alertas = signal<Set<number>>(new Set());
  procesando = signal<number | null>(null);
  cargando = signal(true);
  error = signal('');

  constructor() {
    // Las alertas se cargan cuando se conoce el rol (la ruta no tiene guard que espere la sesión)
    effect(() => {
      if (this.auth.cargando()) return;
      const esCliente = this.auth.rol() === 'cliente';
      untracked(() => this.cargarAlertas(esCliente));
    });
  }

  private async cargarAlertas(esCliente: boolean) {
    try {
      this.alertas.set(esCliente ? await this.alertasService.misAlertas() : new Set());
    } catch (e) {
      console.error('No se pudieron cargar las alertas', e);
    }
  }

  async ngOnInit() {
    try {
      this.peliculas.set(await this.peliculasService.listarProximamente());
    } catch (e) {
      console.error(e);
      this.error.set('No se pudieron cargar los próximos estrenos.');
    } finally {
      this.cargando.set(false);
    }
  }

  urlImagen(path: string | null) {
    return this.peliculasService.urlImagen(path);
  }

  fechaEstreno(p: Pelicula): string {
    return fechaLarga(desdeIso(p.fecha_estreno!));
  }

  /** La venta ya abrió (película en preventa). */
  ventaAbierta(p: Pelicula): boolean {
    return hoy() >= sumarDias(desdeIso(p.fecha_estreno!), -DIAS_PREVENTA);
  }

  aperturaVenta(p: Pelicula): string {
    return fechaLarga(sumarDias(desdeIso(p.fecha_estreno!), -DIAS_PREVENTA));
  }

  async alternarAlerta(p: Pelicula) {
    const clienteId = this.auth.usuario()?.id;
    if (!clienteId) return;
    this.procesando.set(p.id);
    this.error.set('');
    try {
      const nuevas = new Set(this.alertas());
      if (nuevas.has(p.id)) {
        await this.alertasService.desactivar(p.id);
        nuevas.delete(p.id);
      } else {
        await this.alertasService.activar(p.id, clienteId);
        nuevas.add(p.id);
      }
      this.alertas.set(nuevas);
    } catch (e) {
      console.error(e);
      this.error.set('No se pudo actualizar la alerta.');
    } finally {
      this.procesando.set(null);
    }
  }
}
