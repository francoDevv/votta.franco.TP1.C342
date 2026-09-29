import { Injectable, effect, inject, signal } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export interface DisponibilidadButaca {
  butaca_id: number;
  estado: 'libre' | 'reservada' | 'ocupada';
}

const KEY = 'cine_session_id';

function nuevoSessionId(): string {
  const id = crypto.randomUUID();
  sessionStorage.setItem(KEY, id);
  return id;
}

function obtenerSessionId(): string {
  return sessionStorage.getItem(KEY) ?? nuevoSessionId();
}

export const PRECIOS_BUTACA: Record<string, number> = { normal: 3500, accesible: 3500, vip: 5200 };

@Injectable({ providedIn: 'root' })
export class ButacasService {
  private supabase = inject(SupabaseService).client;
  private auth = inject(AuthService);

  private _sessionId = signal(obtenerSessionId());
  private ultimaIdentidad: string | null | undefined = undefined; // undefined = todavía no observado

  get sessionId(): string {
    return this._sessionId();
  }

  constructor() {
    effect(() => {
      if (this.auth.cargando()) return;
      const identidadActual = this.auth.usuario()?.id ?? 'anonimo';

      if (this.ultimaIdentidad !== undefined && this.ultimaIdentidad !== identidadActual) {
        const sessionIdViejo = this._sessionId();
        setTimeout(() => {
          this.liberarTodas(sessionIdViejo).catch((e) =>
            console.error('No se pudieron liberar las reservas de la sesión anterior', e)
          );
        }, 0);
        this._sessionId.set(nuevoSessionId());
      }
      this.ultimaIdentidad = identidadActual;
    });
  }

  async disponibilidad(funcionId: number): Promise<DisponibilidadButaca[]> {
    const { data, error } = await this.supabase.rpc('disponibilidad_funcion', { p_funcion_id: funcionId });
    if (error) throw error;
    return data ?? [];
  }

  async misReservas(funcionId: number): Promise<number[]> {
    const { data, error } = await this.supabase.rpc('mis_reservas', {
      p_funcion_id: funcionId,
      p_session_id: this.sessionId,
    });
    if (error) throw error;
    return (data ?? []).map((r: any) => r.butaca_id);
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

  async liberarTodas(sessionId: string): Promise<void> {
    const { error } = await this.supabase.rpc('liberar_mis_reservas', { p_session_id: sessionId });
    if (error) throw error;
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