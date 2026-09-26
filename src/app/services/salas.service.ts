import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export type TipoButaca = 'normal' | 'accesible' | 'vip';

export interface Sala {
  id: number;
  nombre: string;
}

export interface Butaca {
  id: number;
  sala_id: number;
  fila: string;
  orden_fila: number;
  columna: number;
  numero: number;
  tipo: TipoButaca;
}

@Injectable({ providedIn: 'root' })
export class SalasService {
  private supabase = inject(SupabaseService).client;

  async listar(): Promise<Sala[]> {
    const { data, error } = await this.supabase.from('salas').select('id, nombre').order('nombre');
    if (error) throw error;
    return data ?? [];
  }

  async crear(nombre: string): Promise<Sala> {
    const { data, error } = await this.supabase.from('salas').insert({ nombre }).select('id, nombre').single();
    if (error) throw error;
    return data;
  }

  async eliminar(id: number): Promise<void> {
    const { error } = await this.supabase.from('salas').delete().eq('id', id);
    if (error) throw error;
  }

  async listarButacas(salaId: number): Promise<Butaca[]> {
    const { data, error } = await this.supabase
      .from('butacas')
      .select('id, sala_id, fila, orden_fila, columna, numero, tipo')
      .eq('sala_id', salaId)
      .order('orden_fila')
      .order('columna')
      .order('numero');
    if (error) throw error;
    return data ?? [];
  }
}