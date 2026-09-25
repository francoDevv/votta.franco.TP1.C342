import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

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
  generos: Genero[];
}

export interface PeliculaDatos {
  nombre: string;
  sinopsis: string;
  duracion_minutos: number;
  restriccion_edad: number;
  visible_en_home: boolean;
  imagen_url?: string;
}

@Injectable({ providedIn: 'root' })
export class PeliculasService {
  private supabase = inject(SupabaseService).client;

  private mapear(p: any): Pelicula {
    return { ...p, generos: p.pelicula_genero.map((pg: any) => pg.generos) };
  }

  async listarVisibles(): Promise<Pelicula[]> {
    const { data, error } = await this.supabase
      .from('peliculas')
      .select(`
        id, nombre, sinopsis, duracion_minutos, imagen_url,
        restriccion_edad, visible_en_home,
        pelicula_genero ( generos ( id, nombre ) )
      `)
      .eq('visible_en_home', true)
      .order('nombre');
    if (error) throw error;
    return (data ?? []).map((p) => this.mapear(p));
  }

  // A diferencia de listarVisibles, esta trae TODAS las películas
  // (incluidas las ocultas), para la pantalla de gestión.
  async listarTodas(): Promise<Pelicula[]> {
    const { data, error } = await this.supabase
      .from('peliculas')
      .select(`
        id, nombre, sinopsis, duracion_minutos, imagen_url,
        restriccion_edad, visible_en_home,
        pelicula_genero ( generos ( id, nombre ) )
      `)
      .order('nombre');
    if (error) throw error;
    return (data ?? []).map((p) => this.mapear(p));
  }

  async obtenerPorId(id: number): Promise<Pelicula | null> {
    const { data, error } = await this.supabase
      .from('peliculas')
      .select(`
        id, nombre, sinopsis, duracion_minutos, imagen_url,
        restriccion_edad, visible_en_home,
        pelicula_genero ( generos ( id, nombre ) )
      `)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? this.mapear(data) : null;
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

  async subirImagen(file: File): Promise<string> {
    const extension = file.name.split('.').pop();
    const path = `${crypto.randomUUID()}.${extension}`;
    const { error } = await this.supabase.storage.from('peliculas').upload(path, file);
    if (error) throw error;
    return path;
  }

  // Crea (sin id) o edita (con id) una película, y sincroniza sus géneros.
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

    // Reescribimos la relación de géneros: se borra todo y se vuelve a
    // insertar lo que quedó tildado. Más simple que calcular altas y bajas.
    await this.supabase.from('pelicula_genero').delete().eq('pelicula_id', peliculaId);
    if (generoIds.length > 0) {
      const filas = generoIds.map((generoId) => ({ pelicula_id: peliculaId, genero_id: generoId }));
      const { error } = await this.supabase.from('pelicula_genero').insert(filas);
      if (error) throw error;
    }

    return peliculaId!;
  }

  async eliminar(id: number): Promise<void> {
    // pelicula_genero se borra solo, por el "on delete cascade" de la FK.
    const { error } = await this.supabase.from('peliculas').delete().eq('id', id);
    if (error) throw error;
  }
}