import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface MiEntrada {
  id: number;
  compra_id: number;
  funcion_id: number;
  precio: number;
  estado: 'activa' | 'validada' | 'cancelada';
  fila: string;
  orden_fila: number;
  numero: number;
}

export interface MiCompra {
  compra_id: number;
  estado: string;
  pelicula: string;
  sala: string;
  inicio: string;
  fin: string;
  total: number;
  entradas: MiEntrada[];
  totalCandy: number;
}

@Injectable({ providedIn: 'root' })
export class EntradasService {
  private supabase = inject(SupabaseService).client;

  async listarMiasAgrupadas(clienteId: string): Promise<MiCompra[]> {
    const { data, error } = await this.supabase
      .from('entradas')
      .select(`
        id, compra_id, funcion_id, precio, estado,
        butacas ( fila, numero, orden_fila ),
        funciones ( inicio, fin, peliculas ( nombre ), salas ( nombre ) ),
        compras!inner ( cliente_id, estado, total )
      `)
      .eq('compras.cliente_id', clienteId)
      .order('compra_id', { ascending: false });
    if (error) throw error;

    const porCompra = new Map<number, MiCompra>();
    for (const e of (data ?? []) as any[]) {
      if (!porCompra.has(e.compra_id)) {
        porCompra.set(e.compra_id, {
          compra_id: e.compra_id,
          estado: e.compras.estado,
          pelicula: e.funciones.peliculas.nombre,
          sala: e.funciones.salas.nombre,
          inicio: e.funciones.inicio,
          fin: e.funciones.fin,
          total: Number(e.compras.total),
          entradas: [],
          totalCandy: 0,
        });
      }
      porCompra.get(e.compra_id)!.entradas.push({
        id: e.id,
        compra_id: e.compra_id,
        funcion_id: e.funcion_id,
        precio: Number(e.precio),
        estado: e.estado,
        fila: e.butacas.fila,
        orden_fila: e.butacas.orden_fila,
        numero: e.butacas.numero,
      });
    }

    const compras = Array.from(porCompra.values());
    await Promise.all(
      compras.map(async (c) => {
        const { data: candy } = await this.supabase
          .from('compra_productos')
          .select('precio_unitario, cantidad')
          .eq('compra_id', c.compra_id);
        c.totalCandy = (candy ?? []).reduce(
          (s, p) => s + Number(p.precio_unitario) * p.cantidad,
          0
        );
      })
    );

    for (const c of compras) {
      c.entradas.sort((a, b) => a.orden_fila - b.orden_fila || a.numero - b.numero);
    }

    return compras;
  }

  async cancelarCompra(
    compraId: number
  ): Promise<{ credito_acreditado: number; butacas_canceladas: number }> {
    const { data, error } = await this.supabase.rpc('cancelar_compra', { p_compra_id: compraId });
    if (error) throw error;
    return data;
  }

  async creditoDisponible(clienteId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('credito_disponible')
      .select('saldo')
      .eq('cliente_id', clienteId)
      .maybeSingle();
    if (error) throw error;
    return Number(data?.saldo ?? 0);
  }
}