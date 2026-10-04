import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { DIAS_PREVENTA, aIso, hoy, sumarDias } from '../shared/fechas';

export interface Genero {
  id: number;
  nombre: string;
}

export interface Pelicula {
  id: number;
  nombre: string;
  sinopsis: string;
  duracion_minutos: number;
  imagen_url: string | null;
  restriccion_edad: number;
  visible_en_home: boolean;
  fecha_estreno: string | null;
  precio_preventa: number | null;
  generos: Genero[];
}

export interface PeliculaDatos {
  nombre: string;
  sinopsis: string;
  duracion_minutos: number;
  restriccion_edad: number;
  visible_en_home: boolean;
  imagen_url?: string;
  fecha_estreno?: string | null;
  precio_preventa?: number | null;
}

export interface Resena {
  id: number;
  pelicula_id: number;
  cliente_id: string;
  estrellas: number;
  comentario: string;
  creada_en: string;
  clientes: { nombre: string; apellido: string };
}

/** Película vista por el cliente (con al menos una entrada validada). */
export interface PeliculaVista {
  pelicula_id: number;
  nombre: string;
  imagen_url: string | null;
  ultima_vez: string;
  veces: number;
  estrellas: number | null;
  comentario: string | null;
}

/** Columnas comunes a todas las consultas que devuelven Pelicula. */
const SELECT_PELICULA = `
  id, nombre, sinopsis, duracion_minutos, imagen_url,
  restriccion_edad, visible_en_home, fecha_estreno, precio_preventa,
  pelicula_genero ( generos ( id, nombre ) )
`;

@Injectable({ providedIn: 'root' })
export class PeliculasService {
  private supabase = inject(SupabaseService).client;

  private mapear(p: any): Pelicula {
    return {
      ...p,
      precio_preventa: p.precio_preventa === null ? null : Number(p.precio_preventa),
      generos: p.pelicula_genero.map((pg: any) => pg.generos),
    };
  }

  // Cartelera

  /**
   * Películas visibles con la venta abierta: sin fecha de estreno o con estreno
   * dentro de los próximos 7 días (la venta abre 7 días antes).
   */
  async listarVisibles(): Promise<Pelicula[]> {
    const limiteEstreno = aIso(sumarDias(hoy(), DIAS_PREVENTA));
    const { data, error } = await this.supabase
      .from('peliculas')
      .select(SELECT_PELICULA)
      .eq('visible_en_home', true)
      .or(`fecha_estreno.is.null,fecha_estreno.lte.${limiteEstreno}`)
      .order('nombre');
    if (error) throw error;
    return (data ?? []).map((p) => this.mapear(p));
  }

  /** Películas visibles que todavía no se estrenaron, de la más próxima a la más lejana. */
  async listarProximamente(): Promise<Pelicula[]> {
    const { data, error } = await this.supabase
      .from('peliculas')
      .select(SELECT_PELICULA)
      .eq('visible_en_home', true)
      .gt('fecha_estreno', aIso(hoy()))
      .order('fecha_estreno');
    if (error) throw error;
    return (data ?? []).map((p) => this.mapear(p));
  }

  async listarGeneros(): Promise<Genero[]> {
    const { data, error } = await this.supabase
      .from('generos')
      .select('id, nombre')
      .order('nombre');
    if (error) throw error;
    return data ?? [];
  }

  urlImagen(path: string | null): string | null {
    if (!path) return null;
    const { data } = this.supabase.storage.from('peliculas').getPublicUrl(path);
    return data.publicUrl;
  }

  // CRUD gestor/admin

  async listarTodas(): Promise<Pelicula[]> {
    const { data, error } = await this.supabase
      .from('peliculas')
      .select(SELECT_PELICULA)
      .order('nombre');
    if (error) throw error;
    return (data ?? []).map((p) => this.mapear(p));
  }

  async obtenerPorId(id: number): Promise<Pelicula | null> {
    const { data, error } = await this.supabase
      .from('peliculas')
      .select(SELECT_PELICULA)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? this.mapear(data) : null;
  }

  async subirImagen(file: File): Promise<string> {
    const extension = file.name.split('.').pop();
    const path = `${crypto.randomUUID()}.${extension}`;
    const { error } = await this.supabase.storage.from('peliculas').upload(path, file);
    if (error) throw error;
    return path;
  }

  async guardar(datos: PeliculaDatos, generoIds: number[], id?: number): Promise<number> {
    let peliculaId = id;

    if (peliculaId) {
      const { error } = await this.supabase.from('peliculas').update(datos).eq('id', peliculaId);
      if (error) throw error;
    } else {
      const { data, error } = await this.supabase
        .from('peliculas')
        .insert(datos)
        .select('id')
        .single();
      if (error) throw error;
      peliculaId = data.id;
    }

    await this.supabase.from('pelicula_genero').delete().eq('pelicula_id', peliculaId);
    if (generoIds.length > 0) {
      const filas = generoIds.map((generoId) => ({ pelicula_id: peliculaId, genero_id: generoId }));
      const { error } = await this.supabase.from('pelicula_genero').insert(filas);
      if (error) throw error;
    }

    return peliculaId!;
  }

  async eliminar(id: number): Promise<void> {
    const { error } = await this.supabase.from('peliculas').delete().eq('id', id);
    if (error) throw error;
  }

  /** Historial de "Mis películas" del cliente logueado. */
  async misPeliculas(): Promise<PeliculaVista[]> {
    const { data, error } = await this.supabase.rpc('mis_peliculas');
    if (error) throw error;
    return ((data ?? []) as any[]).map((p) => ({ ...p, veces: Number(p.veces) }));
  }

  // Reseñas

  async listarResenas(peliculaId: number): Promise<Resena[]> {
    const { data, error } = await this.supabase
      .from('resenas')
      .select('id, pelicula_id, cliente_id, estrellas, comentario, creada_en')
      .eq('pelicula_id', peliculaId)
      .order('creada_en', { ascending: false });
    if (error) throw error;
    return this.conNombresDeCliente(data ?? []);
  }

  async obtenerPromedio(peliculaId: number): Promise<{ promedio: number; cantidad: number } | null> {
    const { data, error } = await this.supabase
      .from('promedio_resenas')
      .select('promedio, cantidad')
      .eq('pelicula_id', peliculaId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async miResena(peliculaId: number, clienteId: string): Promise<Resena | null> {
    const { data, error } = await this.supabase
      .from('resenas')
      .select('id, pelicula_id, cliente_id, estrellas, comentario, creada_en')
      .eq('pelicula_id', peliculaId)
      .eq('cliente_id', clienteId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const [conNombre] = await this.conNombresDeCliente([data]);
    return conNombre;
  }

  async guardarResena(peliculaId: number, clienteId: string, estrellas: number, comentario: string) {
    const { error } = await this.supabase
      .from('resenas')
      .upsert(
        { pelicula_id: peliculaId, cliente_id: clienteId, estrellas, comentario },
        { onConflict: 'pelicula_id,cliente_id' }
      );
    if (error) throw error;
  }

  async eliminarResena(id: number) {
    const { error } = await this.supabase.from('resenas').delete().eq('id', id);
    if (error) throw error;
  }

  private async conNombresDeCliente(resenas: any[]): Promise<Resena[]> {
    if (resenas.length === 0) return [];
    const ids = Array.from(new Set(resenas.map((r) => r.cliente_id)));
    const { data: clientesData, error } = await this.supabase
      .from('clientes_publicos')
      .select('id, nombre, apellido')
      .in('id', ids);
    if (error) throw error;
    const porId = new Map((clientesData ?? []).map((c) => [c.id, c]));
    return resenas.map((r) => ({
      ...r,
      clientes: porId.get(r.cliente_id) ?? { nombre: 'Usuario', apellido: '' },
    }));
  }
}