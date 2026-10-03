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
  total: number;
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
    creditoAUsar?: number; // nuevo, opcional
  }): Promise<DetalleCompra> {
    const { data, error } = await this.supabase.rpc('confirmar_compra', {
      p_funcion_id: datos.funcionId,
      p_session_id: datos.sessionId,
      p_producto_ids: datos.productos.map((p) => p.productoId),
      p_producto_cantidades: datos.productos.map((p) => p.cantidad),
      p_combo_ids: datos.combos.map((c) => c.comboId),
      p_combo_cantidades: datos.combos.map((c) => c.cantidad),
      p_mail_contacto: datos.mailContacto || null,
      p_credito_a_usar: datos.creditoAUsar ?? 0, // nuevo
    });
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
    doc.text(`Función: ${new Date(detalle.inicio).toLocaleString('es-AR')}`, 20, y); y += 8;
    doc.text(`Formato: ${detalle.formato} · Idioma: ${detalle.idioma}`, 20, y); y += 8;

    if (detalle.restriccion_edad > 0) {
      doc.text(`Restricción +${detalle.restriccion_edad}. Debe asistir acompañado de un adulto.`, 20, y);
      y += 8;
    }

    y += 4;
    doc.text('Butacas:', 20, y); y += 8;
    for (const b of detalle.butacas) {
      doc.text(`  ${b.fila}${b.numero} (${b.tipo}) — $${b.precio}`, 20, y);
      y += 7;
    }

    if (detalle.productos.length > 0) {
      y += 4;
      doc.text('Candy:', 20, y); y += 8;
      for (const p of detalle.productos) {
        doc.text(`  ${p.cantidad}x ${p.nombre} — $${p.precio_unitario * p.cantidad}`, 20, y);
        y += 7;
      }
    }

    y += 4;
    if (detalle.cupon_nombre) {
      doc.text(`Cupón aplicado: ${detalle.cupon_nombre} (−$${detalle.descuento})`, 20, y);
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