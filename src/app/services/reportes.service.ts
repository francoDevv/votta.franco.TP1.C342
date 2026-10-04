import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface FilaFacturacion {
  fecha: string;
  compras: number;
  entradas_vendidas: number;
  cobrado: number;
  pasado_a_credito: number;
}

export interface TotalesFacturacion {
  compras: number;
  entradas_vendidas: number;
  cobrado: number;
  pasado_a_credito: number;
}

export interface PeliculaVistaReporte {
  pelicula: string;
  entradas: number;
}

export interface RankingPeliculas {
  desde: string | null;
  hasta: string | null;
  peliculas: PeliculaVistaReporte[];
}

export interface ProductoVendido {
  producto: string;
  unidades: number;
}

export type Periodo = 'semana' | 'mes';

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private supabase = inject(SupabaseService).client;

  async facturacion(desde: string, hasta: string): Promise<FilaFacturacion[]> {
    const { data, error } = await this.supabase.rpc('reporte_facturacion', { p_desde: desde, p_hasta: hasta });
    if (error) throw error;
    return ((data ?? []) as any[]).map((f) => ({
      fecha: f.fecha,
      compras: Number(f.compras),
      entradas_vendidas: Number(f.entradas_vendidas),
      cobrado: Number(f.cobrado),
      pasado_a_credito: Number(f.pasado_a_credito),
    }));
  }

  totales(filas: FilaFacturacion[]): TotalesFacturacion {
    return filas.reduce(
      (t, f) => ({
        compras: t.compras + f.compras,
        entradas_vendidas: t.entradas_vendidas + f.entradas_vendidas,
        cobrado: t.cobrado + f.cobrado,
        pasado_a_credito: t.pasado_a_credito + f.pasado_a_credito,
      }),
      { compras: 0, entradas_vendidas: 0, cobrado: 0, pasado_a_credito: 0 }
    );
  }

  async peliculasMasVistas(periodo: Periodo, referencia: string): Promise<RankingPeliculas> {
    const { data, error } = await this.supabase.rpc('peliculas_mas_vistas', {
      p_periodo: periodo,
      p_referencia: referencia,
      p_limite: 5,
    });
    if (error) throw error;
    const filas = (data ?? []) as any[];
    return {
      desde: filas[0]?.desde ?? null,
      hasta: filas[0]?.hasta ?? null,
      peliculas: filas.map((f) => ({ pelicula: f.pelicula, entradas: Number(f.entradas) })),
    };
  }

  async productosMasVendidos(desde: string, hasta: string): Promise<ProductoVendido[]> {
    const { data, error } = await this.supabase.rpc('productos_mas_vendidos', {
      p_desde: desde,
      p_hasta: hasta,
      p_limite: 5,
    });
    if (error) throw error;
    return ((data ?? []) as any[]).map((p) => ({ producto: p.producto, unidades: Number(p.unidades) }));
  }
}
