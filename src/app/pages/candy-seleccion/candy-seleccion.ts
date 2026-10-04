import { Component, OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ButacasService, PreciosFuncion, PRECIOS_VACIOS } from '../../services/butacas.service';
import { SalasService, Butaca } from '../../services/salas.service';
import { FuncionesService, Funcion } from '../../services/funciones.service';
import { CandyService, Producto, Combo } from '../../services/candy.service';
import { CuponesService, CuponAplicable } from '../../services/cupones.service';
import { ComprasService, DetalleCompra } from '../../services/compras.service';
import { AuthService } from '../../services/auth.service';
import { EntradasService } from '../../services/entradas.service';
import { PuntosService, Recompensa } from '../../services/puntos.service';
import { PwaService } from '../../services/pwa.service';

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
  private entradasService = inject(EntradasService);
  private puntosService = inject(PuntosService);
  protected pwa = inject(PwaService);
  protected auth = inject(AuthService);

  precios = signal<PreciosFuncion>(PRECIOS_VACIOS);

  funcion = signal<Funcion | null>(null);
  entradasSeleccionadas = signal<Butaca[]>([]);
  productos = signal<Producto[]>([]);
  combos = signal<Combo[]>([]);
  cargando = signal(true);

  cupon = signal<CuponAplicable | null>(null);
  porcentajeBienvenida = signal<number | null>(null);

  // Datos del cliente registrado: puntos, recompensas y crédito
  puntosDisponibles = signal(0);
  recompensas = signal<Recompensa[]>([]);
  creditoDisponible = signal(0);
  usarCredito = signal(false);
  private cantidadCanjes = signal<Map<number, number>>(new Map());

  mailContacto = signal('');
  aceptaRestriccion = signal(false);
  confirmando = signal(false);
  errorConfirmar = signal('');
  detalleCompra = signal<DetalleCompra | null>(null);
  descargandoPdf = signal(false);

  private cantidadProductos = signal<Map<number, number>>(new Map());
  private cantidadCombos = signal<Map<number, number>>(new Map());

  /** Edad mínima de la película (0 = sin restricción). */
  restriccion = computed(() => this.funcion()?.peliculas?.restriccion_edad ?? 0);

  /**
   * Quien no es cliente registrado no tiene fecha de nacimiento verificable:
   * debe leer el aviso y confirmar explícitamente.
   */
  requiereAviso = computed(() => this.restriccion() > 0 && this.auth.rol() !== 'cliente');

  totalButacas = computed(() =>
    this.entradasSeleccionadas().reduce((suma, b) => suma + (this.precios()[b.tipo] ?? 0), 0)
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

  // ---------- Canjes con puntos ----------
  canjesSeleccionados = computed(() =>
    this.recompensas()
      .filter((r) => this.cantidadCanjes().has(r.id))
      .map((r) => ({ recompensa: r, cantidad: this.cantidadCanjes().get(r.id)! }))
  );

  puntosACanjear = computed(() =>
    this.canjesSeleccionados().reduce((s, c) => s + c.recompensa.costo_puntos * c.cantidad, 0)
  );

  puntosRestantes = computed(() => this.puntosDisponibles() - this.puntosACanjear());

  entradasGratis = computed(() =>
    this.canjesSeleccionados()
      .filter((c) => c.recompensa.tipo === 'entrada')
      .reduce((s, c) => s + c.cantidad, 0)
  );

  /** Igual que en el servidor: las entradas gratis se aplican sobre las butacas más baratas. */
  descuentoEntradasGratis = computed(() => {
    const preciosOrdenados = this.entradasSeleccionadas()
      .map((b) => this.precios()[b.tipo] ?? 0)
      .sort((a, b) => a - b);
    return preciosOrdenados.slice(0, this.entradasGratis()).reduce((s, p) => s + p, 0);
  });

  productosCanjeados = computed(() =>
    this.canjesSeleccionados().filter((c) => c.recompensa.tipo === 'producto')
  );

  // ---------- Totales (mismo orden que el servidor) ----------
  // precio → canjes → cupón → crédito → pago restante
  totalGeneral = computed(() => this.totalButacas() - this.descuentoEntradasGratis() + this.totalCandy());

  descuento = computed(() => {
    const c = this.cupon();
    return c ? Math.round((this.totalGeneral() * c.porcentaje) / 100) : 0;
  });

  creditoAplicado = computed(() =>
    this.usarCredito()
      ? Math.max(0, Math.min(this.creditoDisponible(), this.totalGeneral() - this.descuento()))
      : 0
  );

  totalFinal = computed(() => this.totalGeneral() - this.descuento() - this.creditoAplicado());

  /** 1 punto por cada peso efectivamente pagado (solo clientes registrados). */
  puntosAGanar = computed(() => (this.auth.rol() === 'cliente' ? Math.floor(this.totalFinal()) : 0));

  puedeConfirmar = computed(() => {
    if (!this.pwa.online()) return false;
    if (this.entradasSeleccionadas().length === 0) return false;
    if (!this.auth.logueado() && !this.mailContacto().trim()) return false;
    if (this.requiereAviso() && !this.aceptaRestriccion()) return false;
    return true;
  });

  constructor() {
    effect(() => {
      if (this.auth.cargando()) return;
      const rol = this.auth.rol();
      untracked(() => {
        this.cargarCupon(rol);
        this.cargarDatosCliente(rol);
      });
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

  /** Puntos, recompensas canjeables y crédito: solo para clientes registrados. */
  private async cargarDatosCliente(rol: string) {
    if (rol !== 'cliente') {
      this.puntosDisponibles.set(0);
      this.recompensas.set([]);
      this.creditoDisponible.set(0);
      this.cantidadCanjes.set(new Map());
      this.usarCredito.set(false);
      return;
    }
    try {
      const [puntos, recompensas, credito] = await Promise.all([
        this.puntosService.misPuntos(),
        this.puntosService.listarRecompensas(),
        this.entradasService.creditoDisponible(this.auth.usuario()!.id),
      ]);
      this.puntosDisponibles.set(puntos);
      this.recompensas.set(recompensas);
      this.creditoDisponible.set(credito);
    } catch (e) {
      console.error('No se pudieron cargar los puntos y el crédito', e);
    }
  }

  async ngOnInit() {
    const funcionId = Number(this.route.snapshot.paramMap.get('id'));
    const [funcion, misIds, productos, combos, precios] = await Promise.all([
      this.funcionesService.obtenerPorId(funcionId),
      this.butacasService.misReservas(funcionId),
      this.candyService.listarProductos(true),
      this.candyService.listarCombos(true),
      this.butacasService.precios(funcionId),
    ]);

    this.funcion.set(funcion);
    this.productos.set(productos);
    this.combos.set(combos);
    this.precios.set(precios);

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

  urlImagen(path: string | null) {
    return this.candyService.urlImagen(path);
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

  cantidadCanje(id: number): number {
    return this.cantidadCanjes().get(id) ?? 0;
  }

  /** Se puede sumar si alcanzan los puntos y no hay más entradas gratis que butacas. */
  puedeSumarCanje(r: Recompensa): boolean {
    if (this.puntosRestantes() < r.costo_puntos) return false;
    if (r.tipo === 'entrada' && this.entradasGratis() >= this.entradasSeleccionadas().length) return false;
    return true;
  }

  cambiarCantidadCanje(r: Recompensa, delta: number) {
    if (delta > 0 && !this.puedeSumarCanje(r)) return;
    this.cantidadCanjes.update((mapa) => {
      const nuevo = new Map(mapa);
      const siguiente = Math.max(0, (nuevo.get(r.id) ?? 0) + delta);
      siguiente === 0 ? nuevo.delete(r.id) : nuevo.set(r.id, siguiente);
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
        creditoAUsar: this.creditoAplicado(),
        recompensaIds: this.canjesSeleccionados().flatMap((c) =>
          Array<number>(c.cantidad).fill(c.recompensa.id)
        ),
        aceptaRestriccion: this.requiereAviso() && this.aceptaRestriccion(),
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