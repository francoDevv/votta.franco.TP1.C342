import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { RealtimeChannel } from '@supabase/supabase-js';
import { ButacasService, PreciosFuncion, PRECIOS_VACIOS } from '../../services/butacas.service';
import { PwaService } from '../../services/pwa.service';
import { SalasService, Butaca } from '../../services/salas.service';
import { FuncionesService, Funcion } from '../../services/funciones.service';

interface FilaAgrupada { fila: string; columnas: Butaca[][]; }

@Component({
  selector: 'app-seleccion-butacas',
  imports: [RouterLink, DatePipe],
  templateUrl: './seleccion-butacas.html',
  styleUrl: './seleccion-butacas.css',
})
export class SeleccionButacas implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private butacasService = inject(ButacasService);
  private salasService = inject(SalasService);
  private funcionesService = inject(FuncionesService);
  private router = inject(Router);
  protected pwa = inject(PwaService);

  funcion = signal<Funcion | null>(null);
  butacas = signal<Butaca[]>([]);
  precios = signal<PreciosFuncion>(PRECIOS_VACIOS);
  disponibilidad = signal<Map<number, string>>(new Map());
  misButacas = signal<Set<number>>(new Set());
  cargando = signal(true);
  error = signal('');
  errorCarga = signal(false);
  private canal?: RealtimeChannel;
  private funcionId = 0;

  filas = computed<FilaAgrupada[]>(() => {
    const porFila = new Map<string, Butaca[]>();
    for (const b of this.butacas()) {
      if (!porFila.has(b.fila)) porFila.set(b.fila, []);
      porFila.get(b.fila)!.push(b);
    }
    return Array.from(porFila.entries())
      .sort((a, b) => a[1][0].orden_fila - b[1][0].orden_fila)
      .map(([fila, butacasFila]) => ({
        fila,
        columnas: [1, 2, 3].map((col) => butacasFila.filter((b) => b.columna === col).sort((a, b) => a.numero - b.numero)),
      }));
  });

  seleccionActual = computed(() => this.butacas().filter((b) => this.misButacas().has(b.id)));
  total = computed(() =>
    this.seleccionActual().reduce((suma, b) => suma + (this.precios()[b.tipo] ?? 0), 0)
  );

  async ngOnInit() {
    this.funcionId = Number(this.route.snapshot.paramMap.get('id'));
    await this.cargar();
  }

  async cargar() {
    this.cargando.set(true);
    this.errorCarga.set(false);
    try {
      const funcion = await this.funcionesService.obtenerPorId(this.funcionId);
      this.funcion.set(funcion);

      if (funcion) {
        const [butacas, precios] = await Promise.all([
          this.salasService.listarButacas(funcion.sala_id),
          this.butacasService.precios(this.funcionId),
        ]);
        this.butacas.set(butacas);
        this.precios.set(precios);
        await this.actualizarDisponibilidad();
        const misIds = await this.butacasService.misReservas(this.funcionId);
        this.misButacas.set(new Set(misIds));
        if (!this.canal) {
          this.canal = this.butacasService.suscribirse(this.funcionId, () => this.actualizarDisponibilidad());
        }
      }
    } catch (err) {
      console.error(err);
      this.errorCarga.set(true);
    } finally {
      this.cargando.set(false);
    }
  }

  ngOnDestroy() {
    if (this.canal) this.butacasService.desuscribirse(this.canal);
  }

  private async actualizarDisponibilidad() {
    const datos = await this.butacasService.disponibilidad(this.funcionId);
    const mapa = new Map<number, string>();
    for (const d of datos) mapa.set(d.butaca_id, d.estado);
    this.disponibilidad.set(mapa);
  }

  claseButaca(b: Butaca): string {
    if (this.misButacas().has(b.id)) return 'seat-seleccionada';
    const estado = this.disponibilidad().get(b.id) ?? 'libre';
    if (estado === 'libre') {
      if (b.tipo === 'vip') return 'seat-vip';
      if (b.tipo === 'accesible') return 'seat-accesible';
      return 'seat-libre';
    }
    return 'seat-ocupada';
  }

  puedeClickear(b: Butaca): boolean {
    if (this.misButacas().has(b.id)) return true;
    return (this.disponibilidad().get(b.id) ?? 'libre') === 'libre';
  }

  async alternar(b: Butaca) {
    if (!this.puedeClickear(b)) return;
    if (!this.pwa.online()) {
      this.error.set('Sin conexión: necesitás internet para elegir butacas.');
      return;
    }
    this.error.set('');

    if (this.misButacas().has(b.id)) {
      const nuevo = new Set(this.misButacas());
      nuevo.delete(b.id);
      this.misButacas.set(nuevo);
      await this.butacasService.liberar(this.funcionId, b.id);
      await this.actualizarDisponibilidad();
      return;
    }

    const resultado = await this.butacasService.reservar(this.funcionId, [b.id]);
    const ok = resultado.find((r) => r.butaca_id === b.id)?.reservada;
    if (ok) {
      const nuevo = new Set(this.misButacas());
      nuevo.add(b.id);
      this.misButacas.set(nuevo);
    } else {
      this.error.set('Alguien más reservó esa butaca justo antes. Elegí otra.');
    }
    await this.actualizarDisponibilidad();
  }

  continuar() {
    this.router.navigate(['/funciones', this.funcionId, 'candy']);
  }
}