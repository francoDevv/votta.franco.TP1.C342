import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

/** Película con alerta activa cuya venta ya abrió y el cliente todavía no vio el aviso. */
export interface AvisoEstreno {
  pelicula_id: number;
  nombre: string;
  fecha_estreno: string;
  en_preventa: boolean;
}

@Injectable({ providedIn: 'root' })
export class AlertasService {
  private supabase = inject(SupabaseService).client;

  /** Avisos pendientes del cliente logueado (los muestra la barra de avisos). */
  readonly avisos = signal<AvisoEstreno[]>([]);

  /** Ids de las películas en las que el cliente activó la alerta. */
  async misAlertas(): Promise<Set<number>> {
    const { data, error } = await this.supabase.from('alertas_estreno').select('pelicula_id');
    if (error) throw error;
    return new Set((data ?? []).map((a) => a.pelicula_id));
  }

  async activar(peliculaId: number, clienteId: string): Promise<void> {
    const { error } = await this.supabase
      .from('alertas_estreno')
      .insert({ pelicula_id: peliculaId, cliente_id: clienteId });
    if (error) throw error;
  }

  async desactivar(peliculaId: number): Promise<void> {
    const { error } = await this.supabase.from('alertas_estreno').delete().eq('pelicula_id', peliculaId);
    if (error) throw error;
  }

  async cargarAvisos(): Promise<void> {
    const { data, error } = await this.supabase.rpc('mis_avisos_estreno');
    if (error) throw error;
    this.avisos.set((data ?? []) as AvisoEstreno[]);
  }

  /** Marca el aviso como visto para que no vuelva a aparecer. */
  async marcarVisto(peliculaId: number): Promise<void> {
    this.avisos.update((lista) => lista.filter((a) => a.pelicula_id !== peliculaId));
    const { error } = await this.supabase
      .from('alertas_estreno')
      .update({ vista_en: new Date().toISOString() })
      .eq('pelicula_id', peliculaId);
    if (error) throw error;
  }

  limpiar() {
    this.avisos.set([]);
  }
}
