import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export interface ButacaCompra { fila: string; numero: number; tipo: string; precio: number; }
export interface ProductoCompra { nombre: string; cantidad: number; precio_unitario: number; }

export interface DetalleCompra {
  compra_id: number;
  codigo_qr: string;
  pelicula: string;
  sala: string;
  inicio: string;
  formato: string;
  idioma: string;
  restriccion_edad: number;
  mail_contacto: string;
  butacas: ButacaCompra[];
  productos: ProductoCompra[];
  subtotal: number;
  descuento: number;
  cupon_nombre: string | null;
  credito_usado?: number;
  puntos_canjeados?: number;
  puntos_ganados?: number;
  total: number;
}

/** Fecha y hora de la función en hora de Argentina. Ej: sábado 04/10/2026 · 20:00 hs */
function fechaHoraFuncion(iso: string): string {
  const fecha = new Date(iso);
  const zona = 'America/Argentina/Buenos_Aires';
  const dia = fecha.toLocaleDateString('es-AR', {
    timeZone: zona, weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
  });
  const hora = fecha.toLocaleTimeString('es-AR', {
    timeZone: zona, hour: '2-digit', minute: '2-digit', hour12: false,
  });
  return `${dia.replace(',', '')} · ${hora} hs`;
}

@Injectable({ providedIn: 'root' })
export class ComprasService {
  private supabase = inject(SupabaseService).client;

    async confirmar(datos: {
    funcionId: number;
    sessionId: string;
    productos: { productoId: number; cantidad: number }[];
    combos: { comboId: number; cantidad: number }[];
    mailContacto: string;
    creditoAUsar?: number;
    aceptaRestriccion?: boolean;
    recompensaIds?: number[];
  }): Promise<DetalleCompra> {
    const { data, error } = await this.supabase.rpc('confirmar_compra', {
      p_funcion_id: datos.funcionId,
      p_session_id: datos.sessionId,
      p_producto_ids: datos.productos.map((p) => p.productoId),
      p_producto_cantidades: datos.productos.map((p) => p.cantidad),
      p_combo_ids: datos.combos.map((c) => c.comboId),
      p_combo_cantidades: datos.combos.map((c) => c.cantidad),
      p_mail_contacto: datos.mailContacto || null,
      p_credito_a_usar: datos.creditoAUsar ?? 0,
      p_acepta_restriccion: datos.aceptaRestriccion ?? false,
      p_recompensa_ids: datos.recompensaIds ?? [],
    });
    if (error) throw error;
    return data as DetalleCompra;
  }

  /** Datos de una compra ya hecha, con el mismo formato que devuelve confirmar(). */
  async obtenerDetalle(compraId: number): Promise<DetalleCompra> {
    const { data, error } = await this.supabase.rpc('detalle_compra', { p_compra_id: compraId });
    if (error) throw error;
    return data as DetalleCompra;
  }

  async generarPdf(detalle: DetalleCompra): Promise<void> {
    const qrDataUrl = await QRCode.toDataURL(detalle.codigo_qr, { margin: 1, width: 200 });

    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(18);
    doc.text('Entrada de cine', 20, y);
    y += 12;

    doc.setFontSize(12);
    doc.text(`Película: ${detalle.pelicula}`, 20, y); y += 8;
    doc.text(`Sala: ${detalle.sala}`, 20, y); y += 8;
    doc.text(`Función: ${fechaHoraFuncion(detalle.inicio)}`, 20, y); y += 8;
    doc.text(`Formato: ${detalle.formato} · Idioma: ${detalle.idioma}`, 20, y); y += 8;

    if (detalle.restriccion_edad > 0) {
      doc.text(`Restricción +${detalle.restriccion_edad}. Debe asistir acompañado de un adulto.`, 20, y);
      y += 8;
    }

    y += 4;
    doc.text('Butacas:', 20, y); y += 8;
    for (const b of detalle.butacas) {
      const precio = Number(b.precio) === 0 ? 'canjeada con puntos' : `$${b.precio}`;
      doc.text(`  ${b.fila}${b.numero} (${b.tipo}) — ${precio}`, 20, y);
      y += 7;
    }

    if (detalle.productos.length > 0) {
      y += 4;
      doc.text('Candy:', 20, y); y += 8;
      for (const p of detalle.productos) {
        const precio = Number(p.precio_unitario) === 0 ? 'canjeado con puntos' : `$${p.precio_unitario * p.cantidad}`;
        doc.text(`  ${p.cantidad}x ${p.nombre} — ${precio}`, 20, y);
        y += 7;
      }
    }

    y += 4;
    if (detalle.cupon_nombre) {
      doc.text(`Cupón aplicado: ${detalle.cupon_nombre} (−$${detalle.descuento})`, 20, y);
      y += 8;
    } else if (detalle.descuento > 0) {
      doc.text(`Descuento / crédito aplicado: −$${detalle.descuento}`, 20, y);
      y += 8;
    }
    doc.setFontSize(14);
    doc.text(`Total pagado: $${detalle.total}`, 20, y);
    y += 14;

    doc.addImage(qrDataUrl, 'PNG', 20, y, 50, 50);
    doc.setFontSize(10);
    doc.text('Presentá este código QR en la entrada del cine.', 20, y + 56);
    doc.text(`Código: ${detalle.codigo_qr}`, 20, y + 63);

    doc.save(`entrada-compra-${detalle.compra_id}.pdf`);
  }
}