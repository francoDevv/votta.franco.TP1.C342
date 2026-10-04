import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActividadService, RegistroLog, UsuarioLog } from '../../services/actividad.service';
import { SelectorFecha } from '../../shared/selector-fecha/selector-fecha';
import { aIso, fechaHoraAr, hoy, sumarDias } from '../../shared/fechas';

const POR_PAGINA = 50;

/** Nombre legible de cada acción registrada. */
const ACCIONES: Record<string, string> = {
  validar_qr: 'Validación de QR',
  crear_funcion: 'Creación de función',
  eliminar_funcion: 'Eliminación de función',
  modificar_precios: 'Cambio de precios de entradas',
  modificar_preventa: 'Cambio de estreno o preventa',
  crear_producto: 'Alta de producto',
  modificar_precio_producto: 'Cambio de precio de producto',
  crear_combo: 'Alta de combo',
  modificar_precio_combo: 'Cambio de precio de combo',
  crear_recompensa: 'Alta de recompensa',
  modificar_recompensa: 'Cambio de recompensa',
};

const ATAJOS = [
  { etiqueta: 'Hoy', dias: 0 },
  { etiqueta: 'Últimos 7 días', dias: 6 },
  { etiqueta: 'Últimos 30 días', dias: 29 },
];

function pesos(valor: unknown): string {
  return valor === null || valor === undefined ? '—' : '$' + Number(valor).toLocaleString('es-AR');
}

@Component({
  selector: 'app-actividad-admin',
  imports: [ReactiveFormsModule, SelectorFecha],
  templateUrl: './actividad-admin.html',
  styleUrl: './actividad-admin.css',
})
export class ActividadAdmin implements OnInit {
  private fb = inject(FormBuilder).nonNullable;
  private actividad = inject(ActividadService);
  private destroyRef = inject(DestroyRef);

  protected acciones = Object.entries(ACCIONES).map(([valor, etiqueta]) => ({ valor, etiqueta }));
  protected atajos = ATAJOS;
  protected porPagina = POR_PAGINA;

  registros = signal<RegistroLog[]>([]);
  total = signal(0);
  pagina = signal(0);
  usuarios = signal<UsuarioLog[]>([]);
  cargando = signal(true);
  error = signal('');

  filtros = this.fb.group({
    desde: this.fb.control<string | null>(aIso(sumarDias(hoy(), -6))),
    hasta: this.fb.control<string | null>(aIso(hoy())),
    accion: this.fb.control<string | null>(null),
    usuarioId: this.fb.control<string | null>(null),
  });

  async ngOnInit() {
    this.filtros.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.pagina.set(0);
      this.cargar();
    });

    try {
      this.usuarios.set(await this.actividad.usuarios());
    } catch (e) {
      console.error('No se pudieron cargar los usuarios del log', e);
    }
    await this.cargar();
  }

  async cargar() {
    const v = this.filtros.getRawValue();
    if (!v.desde || !v.hasta) return;
    if (v.hasta < v.desde) {
      this.error.set('La fecha "hasta" no puede ser anterior a "desde".');
      this.registros.set([]);
      this.total.set(0);
      return;
    }

    this.cargando.set(true);
    this.error.set('');
    try {
      const { registros, total } = await this.actividad.consultar(
        { desde: v.desde, hasta: v.hasta, accion: v.accion, usuarioId: v.usuarioId },
        POR_PAGINA,
        this.pagina() * POR_PAGINA
      );
      this.registros.set(registros);
      this.total.set(total);
    } catch (e: any) {
      console.error(e);
      this.error.set(e?.message ?? 'No se pudo cargar el log de actividad.');
    } finally {
      this.cargando.set(false);
    }
  }

  aplicarAtajo(dias: number) {
    this.filtros.patchValue({ desde: aIso(sumarDias(hoy(), -dias)), hasta: aIso(hoy()) });
  }

  cambiarPagina(delta: number) {
    this.pagina.update((p) => Math.max(0, p + delta));
    this.cargar();
  }

  hayPaginaSiguiente(): boolean {
    return (this.pagina() + 1) * POR_PAGINA < this.total();
  }

  rango(): string {
    if (this.total() === 0) return 'Sin resultados';
    const desde = this.pagina() * POR_PAGINA + 1;
    const hasta = Math.min(desde + POR_PAGINA - 1, this.total());
    return `Mostrando ${desde}–${hasta} de ${this.total()}`;
  }

  fecha(iso: string): string {
    return fechaHoraAr(iso);
  }

  nombreAccion(accion: string): string {
    return ACCIONES[accion] ?? accion;
  }

  /** Resume el detalle de cada acción en una línea legible. */
  describir(r: RegistroLog): string {
    const d = r.detalle ?? {};
    switch (r.accion) {
      case 'validar_qr':
        return `Compra #${r.entidad_id} · ${d.entradas_validadas} entrada(s)` +
          (d.candy_entregado ? ' · candy entregado' : '');
      case 'crear_funcion':
      case 'eliminar_funcion':
        return `${d.pelicula} · ${d.sala} · ${d.inicio ? fechaHoraAr(d.inicio) : '—'}`;
      case 'modificar_precios':
        return `Base ${pesos(d.anterior?.precio_base)} → ${pesos(d.nuevo?.precio_base)} · ` +
          `Recargo VIP ${pesos(d.anterior?.recargo_vip)} → ${pesos(d.nuevo?.recargo_vip)}`;
      case 'modificar_preventa': {
        const estreno = `Estreno ${d.anterior?.fecha_estreno ?? '—'} → ${d.nuevo?.fecha_estreno ?? '—'}`;
        const preventa = `preventa ${pesos(d.anterior?.precio_preventa)} → ${pesos(d.nuevo?.precio_preventa)}`;
        return `${d.pelicula} · ${estreno} · ${preventa}`;
      }
      case 'crear_producto':
      case 'crear_combo':
        return `${d.nombre} · ${pesos(d.nuevo?.precio)}`;
      case 'modificar_precio_producto':
      case 'modificar_precio_combo':
        return `${d.nombre} · ${pesos(d.anterior?.precio)} → ${pesos(d.nuevo?.precio)}`;
      case 'crear_recompensa':
        return `${d.nombre} · ${d.nuevo?.costo_puntos} pts`;
      case 'modificar_recompensa': {
        const estado = d.anterior?.activa !== d.nuevo?.activa
          ? ` · ${d.nuevo?.activa ? 'activada' : 'desactivada'}`
          : '';
        return `${d.nombre} · ${d.anterior?.costo_puntos} → ${d.nuevo?.costo_puntos} pts${estado}`;
      }
      default:
        return JSON.stringify(d);
    }
  }
}
