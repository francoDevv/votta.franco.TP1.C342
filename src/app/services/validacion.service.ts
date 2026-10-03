import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface EntradaQr {
  fila: string;
  numero: number;
  tipo: string;
  estado: 'activa' | 'validada' | 'cancelada';
}

export interface ProductoQr {
  nombre: string;
  cantidad: number;
}

export interface CompraQr {
  compra_id: number;
  codigo_qr: string;
  estado: string;
  utilizada: boolean;
  pelicula: string;
  restriccion_edad: number;
  sala: string;
  inicio: string;
  fin: string;
  formato: string;
  idioma: string;
  entradas: EntradaQr[];
  productos: ProductoQr[];
}

export interface ResultadoValidacion {
  entradas_validadas: number;
  candy_entregado: boolean;
}

@Injectable({ providedIn: 'root' })
export class ValidacionService {
  private supabase = inject(SupabaseService).client;

  async consultar(codigo: string): Promise<CompraQr> {
    const { data, error } = await this.supabase.rpc('consultar_qr', { p_codigo: codigo });
    if (error) throw error;
    return data as CompraQr;
  }

  async validar(codigo: string): Promise<ResultadoValidacion> {
    const { data, error } = await this.supabase.rpc('validar_qr', { p_codigo: codigo });
    if (error) throw error;
    return data as ResultadoValidacion;
  }
}