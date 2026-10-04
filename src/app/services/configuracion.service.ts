import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface ConfiguracionPrecios {
  precio_base: number;
  recargo_vip: number;
  actualizado_en: string;
}

@Injectable({ providedIn: 'root' })
export class ConfiguracionService {
  private supabase = inject(SupabaseService).client;

  async obtenerPrecios(): Promise<ConfiguracionPrecios> {
    const { data, error } = await this.supabase
      .from('configuracion_precios')
      .select('precio_base, recargo_vip, actualizado_en')
      .eq('id', 1)
      .single();
    if (error) throw error;
    return {
      precio_base: Number(data.precio_base),
      recargo_vip: Number(data.recargo_vip),
      actualizado_en: data.actualizado_en,
    };
  }

  async actualizarPrecios(precioBase: number, recargoVip: number): Promise<void> {
    const { error } = await this.supabase.rpc('actualizar_precios', {
      p_precio_base: precioBase,
      p_recargo_vip: recargoVip,
    });
    if (error) throw error;
  }
}