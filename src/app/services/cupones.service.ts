import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export type TipoCupon = 'bienvenida' | 'mayores';

export interface Cupon {
  id: number;
  nombre: string;
  tipo: TipoCupon;
  porcentaje: number;
  edad_mayor_a: number | null;
  activo: boolean;
}

export interface CuponDatos {
  nombre: string;
  tipo: TipoCupon;
  porcentaje: number;
  edad_mayor_a: number | null;
  activo: boolean;
}

export interface CuponAplicable {
  id: number;
  nombre: string;
  tipo: TipoCupon;
  porcentaje: number;
}

@Injectable({ providedIn: 'root' })
export class CuponesService {
  private supabase = inject(SupabaseService).client;

  async listar(): Promise<Cupon[]> {
    const { data, error } = await this.supabase
      .from('cupones')
      .select('id, nombre, tipo, porcentaje, edad_mayor_a, activo')
      .order('tipo')
      .order('porcentaje', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Cupon[];
  }

  async obtener(id: number): Promise<Cupon | null> {
    const { data, error } = await this.supabase
      .from('cupones')
      .select('id, nombre, tipo, porcentaje, edad_mayor_a, activo')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as Cupon | null;
  }

  async guardar(datos: CuponDatos, id?: number): Promise<void> {
    if (id) {
      const { error } = await this.supabase.from('cupones').update(datos).eq('id', id);
      if (error) throw error;
    } else {
      const { error } = await this.supabase.from('cupones').insert(datos);
      if (error) throw error;
    }
  }

  async eliminar(id: number): Promise<void> {
    const { error } = await this.supabase.from('cupones').delete().eq('id', id);
    if (error) throw error;
  }

  async cuponAplicable(): Promise<CuponAplicable | null> {
    const { data, error } = await this.supabase.rpc('cupon_aplicable');
    if (error) throw error;
    return (data as CuponAplicable[] | null)?.[0] ?? null;
  }

  async porcentajeBienvenida(): Promise<number | null> {
    const { data, error } = await this.supabase.rpc('porcentaje_bienvenida');
    if (error) throw error;
    return data ?? null;
  }
}