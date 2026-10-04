import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export type TipoRecompensa = 'entrada' | 'producto';

export interface Recompensa {
  id: number;
  nombre: string;
  tipo: TipoRecompensa;
  producto_id: number | null;
  costo_puntos: number;
  activa: boolean;
  productos: { nombre: string; disponible: boolean } | null;
}

export interface RecompensaDatos {
  nombre: string;
  tipo: TipoRecompensa;
  producto_id: number | null;
  costo_puntos: number;
  activa: boolean;
}

export interface CanjeHistorial {
  compra_id: number;
  fecha: string;
  recompensa: string;
  puntos: number;
  pelicula: string | null;
  estado_compra: string;
}

@Injectable({ providedIn: 'root' })
export class PuntosService {
  private supabase = inject(SupabaseService).client;

  /** Recompensas configuradas. Para clientes, solo las que se pueden canjear hoy. */
  async listarRecompensas(soloCanjeables = true): Promise<Recompensa[]> {
    let query = this.supabase
      .from('recompensas')
      .select('id, nombre, tipo, producto_id, costo_puntos, activa, productos ( nombre, disponible )')
      .order('costo_puntos');
    if (soloCanjeables) query = query.eq('activa', true);
    const { data, error } = await query;
    if (error) throw error;
    const lista = (data ?? []) as any as Recompensa[];
    return soloCanjeables
      ? lista.filter((r) => r.tipo === 'entrada' || r.productos?.disponible)
      : lista;
  }

  async guardarRecompensa(datos: RecompensaDatos, id?: number): Promise<void> {
    const { error } = id
      ? await this.supabase.from('recompensas').update(datos).eq('id', id)
      : await this.supabase.from('recompensas').insert(datos);
    if (error) throw error;
  }

  async misPuntos(): Promise<number> {
    const { data, error } = await this.supabase.rpc('mis_puntos');
    if (error) throw error;
    return Number(data ?? 0);
  }

  async historialCanjes(): Promise<CanjeHistorial[]> {
    const { data, error } = await this.supabase.rpc('mi_historial_canjes');
    if (error) throw error;
    return (data ?? []) as CanjeHistorial[];
  }
}
