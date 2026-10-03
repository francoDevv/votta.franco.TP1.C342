import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { EntradasService, MiCompra } from '../../services/entradas.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-mis-entradas',
  imports: [DatePipe],
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

  totalCompra(c: MiCompra): number {
    return c.entradas.reduce((s, e) => s + e.precio, 0) + c.totalCandy;
  }

  puedeCancelar(c: MiCompra): boolean {
    if (c.estado !== 'confirmada') return false;
    if (c.entradas.some((e) => e.estado !== 'activa')) return false;
    const dosHorasAntes = new Date(c.inicio).getTime() - 2 * 60 * 60 * 1000;
    return Date.now() < dosHorasAntes;
  }

  async cancelar(c: MiCompra) {
    const confirmado = confirm(
      `¿Cancelar toda la compra (${c.entradas.length} butaca(s) + candy)? Se te acreditará $${this.totalCompra(c)} como crédito.`
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