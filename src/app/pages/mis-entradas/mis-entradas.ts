import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe, registerLocaleData } from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';
import { EntradasService, MiCompra } from '../../services/entradas.service';
import { AuthService } from '../../services/auth.service';

registerLocaleData(localeEsAr);

const LIMITE_CANCELACION_MS = 2 * 60 * 60 * 1000;

@Component({
  selector: 'app-mis-entradas',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './mis-entradas.html',
  styleUrl: './mis-entradas.css',
})
export class MisEntradas implements OnInit {
  private entradasService = inject(EntradasService);
  private auth = inject(AuthService);

  compras = signal<MiCompra[]>([]);
  credito = signal(0);
  cargando = signal(true);
  cancelando = signal<number | null>(null);
  error = signal('');

  async ngOnInit() {
    await this.cargar();
  }

  async cargar() {
    const clienteId = this.auth.usuario()!.id;
    this.cargando.set(true);
    const [compras, credito] = await Promise.all([
      this.entradasService.listarMiasAgrupadas(clienteId),
      this.entradasService.creditoDisponible(clienteId),
    ]);
    this.compras.set(compras);
    this.credito.set(credito);
    this.cargando.set(false);
  }

  subtotalEntradas(c: MiCompra): number {
    return c.entradas.reduce((s, e) => s + e.precio, 0);
  }

  /** Total realmente pagado (guardado en compras.total). */
  totalCompra(c: MiCompra): number {
    return c.total;
  }

  /** Diferencia entre lo que valía la compra y lo que se pagó (cupón y/o crédito usado). */
  ajuste(c: MiCompra): number {
    return this.subtotalEntradas(c) + c.totalCandy - c.total;
  }

  /** Devuelve el precio si todas las butacas cuestan lo mismo, si no null. */
  precioUnitario(c: MiCompra): number | null {
    const precios = new Set(c.entradas.map((e) => e.precio));
    return precios.size === 1 ? c.entradas[0].precio : null;
  }

  /** Motivo por el que una compra confirmada no se puede cancelar (null = se puede). */
  motivoNoCancelable(c: MiCompra): string | null {
    if (c.estado !== 'confirmada') return null;

    const ahora = Date.now();
    const inicio = new Date(c.inicio).getTime();
    const fin = new Date(c.fin).getTime();

    if (ahora >= fin) return 'Función finalizada.';
    if (ahora >= inicio) return 'La función ya comenzó.';

    if (c.entradas.some((e) => e.estado === 'validada')) {
      return 'No se puede cancelar: ya se validaron entradas de esta compra.';
    }
    if (c.entradas.some((e) => e.estado !== 'activa')) {
      return 'No se puede cancelar: la compra tiene entradas que no están activas.';
    }
    if (inicio - ahora < LIMITE_CANCELACION_MS) {
      return 'Ya no se puede cancelar: faltan menos de 2 horas para la función.';
    }
    return null;
  }

  puedeCancelar(c: MiCompra): boolean {
    return c.estado === 'confirmada' && this.motivoNoCancelable(c) === null;
  }

  async cancelar(c: MiCompra) {
    const monto = this.totalCompra(c).toLocaleString('es-AR');
    const confirmado = confirm(
      `¿Cancelar toda la compra (${c.entradas.length} butaca(s) + candy)? Se te acreditarán $${monto} como crédito.`
    );
    if (!confirmado) return;

    this.cancelando.set(c.compra_id);
    this.error.set('');
    try {
      await this.entradasService.cancelarCompra(c.compra_id);
      await this.cargar();
    } catch (err: any) {
      console.error(err);
      this.error.set(err?.message ?? 'No se pudo cancelar la compra.');
    } finally {
      this.cancelando.set(null);
    }
  }
}