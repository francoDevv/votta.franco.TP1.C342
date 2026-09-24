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

@Injectable({ providedIn: 'root' })
export class PeliculasService {
  private supabase = inject(SupabaseService).client;

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

    return (data ?? []).map((p: any) => ({
      ...p,
      generos: p.pelicula_genero.map((pg: any) => pg.generos),
    }));
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
}