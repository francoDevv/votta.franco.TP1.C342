import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { aIso, hoy, sumarDias } from '../shared/fechas';

export type Formato = '2D' | '3D' | '4D' | '5D';
export type Idioma = 'castellano' | 'subtitulada';

export interface ResultadoAsignacion {
  fecha: string;
  sala_id: number | null;
  funcion_id: number | null;
  asignada: boolean;
}

export interface Funcion {
  id: number;
  pelicula_id: number;
  sala_id: number;
  inicio: string;
  fin: string;
  formato: Formato;
  idioma: Idioma;
  peliculas: { nombre: string; restriccion_edad: number };
  salas: { nombre: string };
}

/** Columnas comunes a todas las consultas que devuelven Funcion. */
const SELECT_FUNCION =
  'id, pelicula_id, sala_id, inicio, fin, formato, idioma, peliculas ( nombre, restriccion_edad ), salas ( nombre )';

@Injectable({ providedIn: 'root' })
export class FuncionesService {
  private supabase = inject(SupabaseService).client;

  async crearRecurrentes(datos: {
    peliculaId: number;
    diasSemana: number[];
    hora: string;
    fechaDesde: string;
    fechaHasta: string;
    formato: Formato;
    idioma: Idioma;
  }): Promise<ResultadoAsignacion[]> {
    const { data, error } = await this.supabase.rpc('crear_funciones_recurrentes', {
      p_pelicula_id: datos.peliculaId,
      p_dias_semana: datos.diasSemana,
      p_hora: datos.hora,
      p_fecha_desde: datos.fechaDesde,
      p_fecha_hasta: datos.fechaHasta,
      p_formato: datos.formato,
      p_idioma: datos.idioma,
    });
    if (error) throw error;
    return data ?? [];
  }

  async listarProximas(): Promise<Funcion[]> {
    const { data, error } = await this.supabase
      .from('funciones')
      .select(SELECT_FUNCION)
      .gte('inicio', new Date().toISOString())
      .order('inicio');
    if (error) throw error;
    return (data ?? []) as any;
  }

  async eliminar(id: number): Promise<void> {
    const { error } = await this.supabase.from('funciones').delete().eq('id', id);
    if (error) throw error;
  }

   async listarPorPelicula(peliculaId: number): Promise<Funcion[]> {
    const { data, error } = await this.supabase
      .from('funciones')
      .select(SELECT_FUNCION)
      .eq('pelicula_id', peliculaId)
      .gte('inicio', aIso(sumarDias(hoy(), -1)))
      .order('inicio');
    if (error) throw error;
    const ahora = Date.now();
    return ((data ?? []) as any[]).filter((f) => new Date(f.inicio).getTime() >= ahora);
  }

  async obtenerPorId(id: number): Promise<Funcion | null> {
    const { data, error } = await this.supabase
      .from('funciones')
      .select(SELECT_FUNCION)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as any;
  }
}