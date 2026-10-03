import { AfterViewInit, Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Html5Qrcode } from 'html5-qrcode';
import { CompraQr, ValidacionService } from '../../services/validacion.service';

type Modo = 'camara' | 'manual';

@Component({
  selector: 'app-validacion',
  imports: [DatePipe],
  templateUrl: './validacion.html',
  styleUrl: './validacion.css',
})
export class Validacion implements AfterViewInit, OnDestroy {
  private servicio = inject(ValidacionService);
  private lector: Html5Qrcode | null = null;

  modo = signal<Modo>('camara');
  escaneando = signal(false);
  codigoManual = signal('');
  compra = signal<CompraQr | null>(null);
  buscando = signal(false);
  validando = signal(false);
  error = signal('');
  exito = signal('');

  tieneCandy = computed(() => (this.compra()?.productos.length ?? 0) > 0);

  /** Motivo por el que el QR no se puede validar (null = se puede). */
  bloqueo = computed<string | null>(() => {
    const c = this.compra();
    if (!c) return null;
    if (c.estado !== 'confirmada') return `Compra ${c.estado}: este QR no se puede usar.`;
    if (c.utilizada) return 'Este QR ya fue utilizado.';
    return null;
  });

  async ngAfterViewInit() {
    await this.iniciarCamara();
  }

  async ngOnDestroy() {
    await this.detenerCamara();
  }

  // ---------- Cámara ----------
  async iniciarCamara() {
    this.error.set('');
    // Espera a que el <div id="lector-qr"> esté en pantalla
    await new Promise((r) => setTimeout(r));
    try {
      this.lector = new Html5Qrcode('lector-qr');
      await this.lector.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (texto) => this.onLectura(texto),
        () => {} // errores de lectura frame a frame: se ignoran
      );
      this.escaneando.set(true);
    } catch (err) {
      console.error(err);
      this.lector = null;
      this.error.set('No se pudo acceder a la cámara. Revisá los permisos o ingresá el código a mano.');
    }
  }

  async detenerCamara() {
    if (this.lector && this.escaneando()) {
      try {
        await this.lector.stop();
      } catch {}
    }
    try {
      this.lector?.clear();
    } catch {}
    this.lector = null;
    this.escaneando.set(false);
  }

  private async onLectura(texto: string) {
    if (this.buscando()) return;
    await this.detenerCamara();
    await this.buscar(texto);
  }

  async cambiarModo(m: Modo) {
    if (m === this.modo()) return;
    await this.detenerCamara();
    this.modo.set(m);
    this.error.set('');
    if (m === 'camara') await this.iniciarCamara();
  }

  // ---------- Búsqueda ----------
  async buscarManual(evento: Event) {
    evento.preventDefault();
    await this.buscar(this.codigoManual());
  }

  private async buscar(codigo: string) {
    this.buscando.set(true);
    this.error.set('');
    this.exito.set('');
    try {
      this.compra.set(await this.servicio.consultar(codigo.trim()));
    } catch (err: any) {
      this.error.set(err?.message ?? 'No se pudo leer el código.');
      if (this.modo() === 'camara') await this.iniciarCamara();
    } finally {
      this.buscando.set(false);
    }
  }

  // ---------- Validación ----------
  async validar() {
    const c = this.compra();
    if (!c) return;
    this.validando.set(true);
    this.error.set('');
    this.exito.set('');
    try {
      const r = await this.servicio.validar(c.codigo_qr);
      const entradas = r.entradas_validadas === 1 ? '1 entrada validada' : `${r.entradas_validadas} entradas validadas`;
      this.exito.set(r.candy_entregado ? `${entradas} y candy entregado.` : `${entradas}.`);
      this.compra.set(await this.servicio.consultar(c.codigo_qr));
    } catch (err: any) {
      this.error.set(err?.message ?? 'No se pudo validar el QR.');
    } finally {
      this.validando.set(false);
    }
  }

  async siguiente() {
    this.compra.set(null);
    this.exito.set('');
    this.error.set('');
    this.codigoManual.set('');
    if (this.modo() === 'camara') await this.iniciarCamara();
  }

  textoBoton(): string {
    if (this.validando()) return 'Validando…';
    if (this.compra()?.utilizada) return 'QR ya utilizado';
    return this.tieneCandy() ? 'Validar entradas y entregar candy' : 'Validar entradas';
  }
}