import { Component, OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ButacasService, PRECIOS_BUTACA } from '../../services/butacas.service';
import { SalasService, Butaca } from '../../services/salas.service';
import { FuncionesService, Funcion } from '../../services/funciones.service';
import { CandyService, Producto, Combo } from '../../services/candy.service';
import { CuponesService, CuponAplicable } from '../../services/cupones.service';
import { ComprasService, DetalleCompra } from '../../services/compras.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-candy-seleccion',
  imports: [RouterLink, DatePipe],
  templateUrl: './candy-seleccion.html',
  styleUrl: './candy-seleccion.css',
})
export class CandySeleccion implements OnInit {
  private route = inject(ActivatedRoute);
  private butacasService = inject(ButacasService);
  private salasService = inject(SalasService);
  private funcionesService = inject(FuncionesService);
  private candyService = inject(CandyService);
  private cuponesService = inject(CuponesService);
  private comprasService = inject(ComprasService);
  protected auth = inject(AuthService);

  protected preciosButaca = PRECIOS_BUTACA;

  funcion = signal<Funcion | null>(null);
  entradasSeleccionadas = signal<Butaca[]>([]);
  productos = signal<Producto[]>([]);
  combos = signal<Combo[]>([]);
  cargando = signal(true);

  cupon = signal<CuponAplicable | null>(null);
  porcentajeBienvenida = signal<number | null>(null);

  mailContacto = signal('');
  confirmando = signal(false);
  errorConfirmar = signal('');
  detalleCompra = signal<DetalleCompra | null>(null);
  descargandoPdf = signal(false);

  private cantidadProductos = signal<Map<number, number>>(new Map());
  private cantidadCombos = signal<Map<number, number>>(new Map());

  totalButacas = computed(() =>
    this.entradasSeleccionadas().reduce((suma, b) => suma + (PRECIOS_BUTACA[b.tipo] ?? 0), 0)
  );

  productosSeleccionados = computed(() =>
    this.productos()
      .filter((p) => this.cantidadProductos().has(p.id))
      .map((p) => ({ producto: p, cantidad: this.cantidadProductos().get(p.id)! }))
  );

  combosSeleccionados = computed(() =>
    this.combos()
      .filter((c) => this.cantidadCombos().has(c.id))
      .map((c) => ({ combo: c, cantidad: this.cantidadCombos().get(c.id)! }))
  );

  totalCandy = computed(() =>
    this.productosSeleccionados().reduce((s, x) => s + x.producto.precio * x.cantidad, 0) +
    this.combosSeleccionados().reduce((s, x) => s + x.combo.precio * x.cantidad, 0)
  );

  totalGeneral = computed(() => this.totalButacas() + this.totalCandy());

  descuento = computed(() => {
    const c = this.cupon();
    return c ? Math.round((this.totalGeneral() * c.porcentaje) / 100) : 0;
  });

  totalFinal = computed(() => this.totalGeneral() - this.descuento());

  puedeConfirmar = computed(() => {
    if (this.entradasSeleccionadas().length === 0) return false;
    if (!this.auth.logueado() && !this.mailContacto().trim()) return false;
    return true;
  });

  constructor() {
    effect(() => {
      if (this.auth.cargando()) return;
      const rol = this.auth.rol();
      untracked(() => this.cargarCupon(rol));
    });
  }

  private async cargarCupon(rol: string) {
    try {
      if (rol === 'cliente') {
        this.cupon.set(await this.cuponesService.cuponAplicable());
      } else if (rol === 'anonimo') {
        this.cupon.set(null);
        this.porcentajeBienvenida.set(await this.cuponesService.porcentajeBienvenida());
      }
    } catch (e) {
      console.error('No se pudo cargar el cupón', e);
    }
  }

  async ngOnInit() {
    const funcionId = Number(this.route.snapshot.paramMap.get('id'));
    const [funcion, misIds, productos, combos] = await Promise.all([
      this.funcionesService.obtenerPorId(funcionId),
      this.butacasService.misReservas(funcionId),
      this.candyService.listarProductos(true),
      this.candyService.listarCombos(true),
    ]);

    this.funcion.set(funcion);
    this.productos.set(productos);
    this.combos.set(combos);

    if (funcion && misIds.length > 0) {
      const todas = await this.salasService.listarButacas(funcion.sala_id);
      this.entradasSeleccionadas.set(
        todas
          .filter((b) => misIds.includes(b.id))
          .sort((a, b) => a.orden_fila - b.orden_fila || a.columna - b.columna || a.numero - b.numero)
      );
    }
    this.cargando.set(false);
  }

  cantidadProducto(id: number): number {
    return this.cantidadProductos().get(id) ?? 0;
  }

  cambiarCantidadProducto(id: number, delta: number) {
    this.cantidadProductos.update((mapa) => {
      const nuevo = new Map(mapa);
      const siguiente = Math.max(0, (nuevo.get(id) ?? 0) + delta);
      siguiente === 0 ? nuevo.delete(id) : nuevo.set(id, siguiente);
      return nuevo;
    });
  }

  cantidadCombo(id: number): number {
    return this.cantidadCombos().get(id) ?? 0;
  }

  cambiarCantidadCombo(id: number, delta: number) {
    this.cantidadCombos.update((mapa) => {
      const nuevo = new Map(mapa);
      const siguiente = Math.max(0, (nuevo.get(id) ?? 0) + delta);
      siguiente === 0 ? nuevo.delete(id) : nuevo.set(id, siguiente);
      return nuevo;
    });
  }

  async confirmarCompra() {
    const funcion = this.funcion();
    if (!funcion || !this.puedeConfirmar()) return;

    this.confirmando.set(true);
    this.errorConfirmar.set('');
    try {
      const detalle = await this.comprasService.confirmar({
        funcionId: funcion.id,
        sessionId: this.butacasService.sessionId,
        productos: this.productosSeleccionados().map((p) => ({ productoId: p.producto.id, cantidad: p.cantidad })),
        combos: this.combosSeleccionados().map((c) => ({ comboId: c.combo.id, cantidad: c.cantidad })),
        mailContacto: this.mailContacto(),
        creditoAUsar: 0,
      });
      this.detalleCompra.set(detalle);
    } catch (e: any) {
      console.error('Error al confirmar la compra', e);
      this.errorConfirmar.set(e?.message ?? 'No se pudo confirmar la compra. Intentá de nuevo.');
    } finally {
      this.confirmando.set(false);
    }
  }

  async descargarPdf() {
    const detalle = this.detalleCompra();
    if (!detalle) return;
    this.descargandoPdf.set(true);
    try {
      await this.comprasService.generarPdf(detalle);
    } catch (e) {
      console.error('No se pudo generar el PDF', e);
    } finally {
      this.descargandoPdf.set(false);
    }
  }
}