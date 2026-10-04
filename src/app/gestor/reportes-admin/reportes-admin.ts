import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  FilaFacturacion,
  Periodo,
  ProductoVendido,
  RankingPeliculas,
  ReportesService,
} from '../../services/reportes.service';
import { ExportacionService } from '../../services/exportacion.service';
import { SelectorFecha } from '../../shared/selector-fecha/selector-fecha';
import { BarraGrafico, GraficoBarras } from '../../shared/grafico-barras/grafico-barras';
import { aIso, desdeIso, hoy, sumarDias } from '../../shared/fechas';

type Pestania = 'facturacion' | 'peliculas' | 'candy';

function primeroDeMes(d: Date, desplazamiento = 0): Date {
  return new Date(d.getFullYear(), d.getMonth() + desplazamiento, 1);
}

function ultimoDeMes(d: Date, desplazamiento = 0): Date {
  return new Date(d.getFullYear(), d.getMonth() + desplazamiento + 1, 0);
}

@Component({
  selector: 'app-reportes-admin',
  imports: [ReactiveFormsModule, SelectorFecha, GraficoBarras],
  templateUrl: './reportes-admin.html',
  styleUrl: './reportes-admin.css',
})
export class ReportesAdmin implements OnInit {
  private fb = inject(FormBuilder).nonNullable;
  private reportes = inject(ReportesService);
  private exportacion = inject(ExportacionService);
  private destroyRef = inject(DestroyRef);

  pestania = signal<Pestania>('facturacion');
  error = signal('');

  // ---------- Rango (facturación y candy) ----------
  rango = this.fb.group({
    desde: this.fb.control<string | null>(aIso(sumarDias(hoy(), -29))),
    hasta: this.fb.control<string | null>(aIso(hoy())),
  });
  mostrarFechas = signal(false);

  protected atajos = [
    { etiqueta: 'Últimos 7 días', desde: () => sumarDias(hoy(), -6), hasta: () => hoy() },
    { etiqueta: 'Últimos 30 días', desde: () => sumarDias(hoy(), -29), hasta: () => hoy() },
    { etiqueta: 'Este mes', desde: () => primeroDeMes(hoy()), hasta: () => hoy() },
    { etiqueta: 'Mes anterior', desde: () => primeroDeMes(hoy(), -1), hasta: () => ultimoDeMes(hoy(), -1) },
  ];

  // ---------- Facturación ----------
  filas = signal<FilaFacturacion[]>([]);
  cargandoFacturacion = signal(true);
  exportando = signal<'pdf' | 'excel' | null>(null);
  totales = computed(() => this.reportes.totales(this.filas()));
  maximoCobrado = computed(() => Math.max(1, ...this.filas().map((f) => f.cobrado)));

  // ---------- Películas más vistas ----------
  periodo = signal<Periodo>('semana');
  referencia = signal(aIso(hoy()));
  ranking = signal<RankingPeliculas>({ desde: null, hasta: null, peliculas: [] });
  cargandoRanking = signal(true);
  barrasPeliculas = computed<BarraGrafico[]>(() =>
    this.ranking().peliculas.map((p) => ({ etiqueta: p.pelicula, valor: p.entradas }))
  );

  // ---------- Candy ----------
  productos = signal<ProductoVendido[]>([]);
  cargandoProductos = signal(true);
  barrasProductos = computed<BarraGrafico[]>(() =>
    this.productos().map((p) => ({ etiqueta: p.producto, valor: p.unidades }))
  );

  async ngOnInit() {
    this.rango.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.cargarRango());
    await Promise.all([this.cargarRango(), this.cargarRanking()]);
  }

  // ---------- Carga ----------
  private async cargarRango() {
    const { desde, hasta } = this.rango.getRawValue();
    if (!desde || !hasta) return;
    if (hasta < desde) {
      this.error.set('La fecha "hasta" no puede ser anterior a "desde".');
      return;
    }
    this.error.set('');
    this.cargandoFacturacion.set(true);
    this.cargandoProductos.set(true);
    try {
      const [filas, productos] = await Promise.all([
        this.reportes.facturacion(desde, hasta),
        this.reportes.productosMasVendidos(desde, hasta),
      ]);
      this.filas.set(filas);
      this.productos.set(productos);
    } catch (e: any) {
      console.error(e);
      this.error.set(e?.message ?? 'No se pudo cargar el reporte.');
    } finally {
      this.cargandoFacturacion.set(false);
      this.cargandoProductos.set(false);
    }
  }

  private async cargarRanking() {
    this.cargandoRanking.set(true);
    try {
      this.ranking.set(await this.reportes.peliculasMasVistas(this.periodo(), this.referencia()));
    } catch (e: any) {
      console.error(e);
      this.error.set(e?.message ?? 'No se pudo cargar el ranking de películas.');
    } finally {
      this.cargandoRanking.set(false);
    }
  }

  // ---------- Acciones ----------
  aplicarAtajo(a: { desde: () => Date; hasta: () => Date }) {
    this.rango.setValue({ desde: aIso(a.desde()), hasta: aIso(a.hasta()) });
  }

  cambiarPeriodo(p: Periodo) {
    if (p === this.periodo()) return;
    this.periodo.set(p);
    this.referencia.set(aIso(hoy()));
    this.cargarRanking();
  }

  moverPeriodo(delta: number) {
    const ref = desdeIso(this.referencia());
    const nueva = this.periodo() === 'semana' ? sumarDias(ref, 7 * delta) : primeroDeMes(ref, delta);
    this.referencia.set(aIso(nueva));
    this.cargarRanking();
  }

  async exportar(formato: 'pdf' | 'excel') {
    const { desde, hasta } = this.rango.getRawValue();
    if (!desde || !hasta) return;
    this.exportando.set(formato);
    try {
      if (formato === 'pdf') {
        await this.exportacion.facturacionPdf(this.filas(), this.totales(), desde, hasta);
      } else {
        await this.exportacion.facturacionExcel(this.filas(), this.totales(), desde, hasta);
      }
    } catch (e) {
      console.error(e);
      this.error.set('No se pudo generar el archivo.');
    } finally {
      this.exportando.set(null);
    }
  }

  // ---------- Formatos ----------
  pesos(n: number): string {
    return '$' + n.toLocaleString('es-AR', { maximumFractionDigits: 2 });
  }

  fechaFila(iso: string): string {
    return desdeIso(iso).toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: '2-digit' });
  }

  textoRango(): string {
    const { desde, hasta } = this.rango.getRawValue();
    if (!desde || !hasta) return '';
    const f = (iso: string) => desdeIso(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${f(desde)} al ${f(hasta)}`;
  }

  textoPeriodo(): string {
    const ref = desdeIso(this.referencia());
    if (this.periodo() === 'mes') {
      const texto = ref.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
      return texto.charAt(0).toUpperCase() + texto.slice(1);
    }
    const lunes = sumarDias(ref, -((ref.getDay() + 6) % 7));
    const domingo = sumarDias(lunes, 6);
    const f = (d: Date) => d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
    return `Semana del ${f(lunes)} al ${f(domingo)}`;
  }

  anchoBarra(valor: number): string {
    return `${(valor / this.maximoCobrado()) * 100}%`;
  }
}
