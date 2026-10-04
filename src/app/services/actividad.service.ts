import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface RegistroLog {
  id: number;
  creado_en: string;
  accion: string;
  entidad: string;
  entidad_id: string | null;
  detalle: any;
  usuario_id: string | null;
  usuario_nombre: string;
  usuario_rol: string;
}

export interface UsuarioLog {
  usuario_id: string;
  nombre: string;
  rol: string;
}

export interface FiltrosLog {
  desde: string;
  hasta: string;
  accion: string | null;
  usuarioId: string | null;
}

@Injectable({ providedIn: 'root' })
export class ActividadService {
  private supabase = inject(SupabaseService).client;

  async consultar(
    filtros: FiltrosLog,
    limite: number,
    desplazamiento: number
  ): Promise<{ registros: RegistroLog[]; total: number }> {
    const { data, error } = await this.supabase.rpc('consultar_log', {
      p_desde: filtros.desde,
      p_hasta: filtros.hasta,
      p_accion: filtros.accion,
      p_usuario_id: filtros.usuarioId,
      p_limite: limite,
      p_desplazamiento: desplazamiento,
    });
    if (error) throw error;
    const filas = (data ?? []) as any[];
    return {
      registros: filas as RegistroLog[],
      total: filas.length > 0 ? Number(filas[0].total) : 0,
    };
  }

  async usuarios(): Promise<UsuarioLog[]> {
    const { data, error } = await this.supabase.rpc('usuarios_del_log');
    if (error) throw error;
    return (data ?? []) as UsuarioLog[];
  }
}
