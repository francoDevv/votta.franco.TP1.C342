import { Injectable, inject } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

export interface DisponibilidadButaca {
  butaca_id: number;
  estado: 'libre' | 'reservada' | 'ocupada';
}

function obtenerSessionId(): string {
  const KEY = 'cine_session_id';
  let id = sessionStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(KEY, id);
  }
  return id;
}

@Injectable({ providedIn: 'root' })
export class ButacasService {
  private supabase = inject(SupabaseService).client;
  readonly sessionId = obtenerSessionId();

  async disponibilidad(funcionId: number): Promise<DisponibilidadButaca[]> {
    const { data, error } = await this.supabase.rpc('disponibilidad_funcion', { p_funcion_id: funcionId });
    if (error) throw error;
    return data ?? [];
  }

  async reservar(funcionId: number, butacaIds: number[]): Promise<{ butaca_id: number; reservada: boolean }[]> {
    const { data, error } = await this.supabase.rpc('reservar_butacas', {
      p_funcion_id: funcionId,
      p_butaca_ids: butacaIds,
      p_session_id: this.sessionId,
    });
    if (error) throw error;
    return data ?? [];
  }

  async liberar(funcionId: number, butacaId: number): Promise<void> {
    const { error } = await this.supabase.rpc('liberar_reserva', {
      p_funcion_id: funcionId,
      p_butaca_id: butacaId,
      p_session_id: this.sessionId,
    });
    if (error) throw error;
  }

  async misReservas(funcionId: number): Promise<number[]> {
    const { data, error } = await this.supabase.rpc('mis_reservas', {
        p_funcion_id: funcionId,
        p_session_id: this.sessionId,
    });
    if (error) throw error;
    return (data ?? []).map((r: any) => r.butaca_id);
    }

  suscribirse(funcionId: number, onCambio: () => void): RealtimeChannel {
    return this.supabase
      .channel(`funcion-${funcionId}-butacas`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservas_temporales', filter: `funcion_id=eq.${funcionId}` }, onCambio)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'entradas', filter: `funcion_id=eq.${funcionId}` }, onCambio)
      .subscribe();
  }

  desuscribirse(canal: RealtimeChannel) {
    this.supabase.removeChannel(canal);
  }
}