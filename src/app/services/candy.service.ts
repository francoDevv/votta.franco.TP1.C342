import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface CategoriaCandy {
  id: number;
  nombre: string;
}

export interface Producto {
  id: number;
  categoria_id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  disponible: boolean;
  categorias_candy: { nombre: string };
}

export interface ProductoDatos {
  categoria_id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  disponible: boolean;
}

export interface Combo {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  destacado: boolean;
  disponible: boolean;
  items: { producto_id: number; cantidad: number; productos: { nombre: string } }[];
}

export interface ComboDatos {
  nombre: string;
  descripcion: string;
  precio: number;
  destacado: boolean;
  disponible: boolean;
}

@Injectable({ providedIn: 'root' })
export class CandyService {
  private supabase = inject(SupabaseService).client;

  async listarCategorias(): Promise<CategoriaCandy[]> {
    const { data, error } = await this.supabase.from('categorias_candy').select('id, nombre').order('nombre');
    if (error) throw error;
    return data ?? [];
  }

  async crearCategoria(nombre: string): Promise<void> {
    const { error } = await this.supabase.from('categorias_candy').insert({ nombre });
    if (error) throw error;
  }

  async eliminarCategoria(id: number): Promise<void> {
    const { error } = await this.supabase.from('categorias_candy').delete().eq('id', id);
    if (error) throw error;
  }

  async listarProductos(soloDisponibles = false): Promise<Producto[]> {
    let query = this.supabase
      .from('productos')
      .select('id, categoria_id, nombre, descripcion, precio, disponible, categorias_candy ( nombre )')
      .order('nombre');
    if (soloDisponibles) query = query.eq('disponible', true);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as any;
  }

  async obtenerProducto(id: number): Promise<Producto | null> {
    const { data, error } = await this.supabase
      .from('productos')
      .select('id, categoria_id, nombre, descripcion, precio, disponible, categorias_candy ( nombre )')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as any;
  }

  async guardarProducto(datos: ProductoDatos, id?: number): Promise<void> {
    if (id) {
      const { error } = await this.supabase.from('productos').update(datos).eq('id', id);
      if (error) throw error;
    } else {
      const { error } = await this.supabase.from('productos').insert(datos);
      if (error) throw error;
    }
  }

  async eliminarProducto(id: number): Promise<void> {
    const { error } = await this.supabase.from('productos').delete().eq('id', id);
    if (error) throw error;
  }

  async listarCombos(soloDisponibles = false): Promise<Combo[]> {
  let query = this.supabase
    .from('combos')
    .select('id, nombre, descripcion, precio, destacado, disponible, combo_items ( producto_id, cantidad, productos ( nombre ) )')
    .order('nombre');
  if (soloDisponibles) query = query.eq('disponible', true);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((c: any) => ({ ...c, items: c.combo_items }));
}

    async obtenerCombo(id: number): Promise<Combo | null> {
    const { data, error } = await this.supabase
        .from('combos')
        .select('id, nombre, descripcion, precio, destacado, disponible, combo_items ( producto_id, cantidad, productos ( nombre ) )')
        .eq('id', id)
        .maybeSingle();
    if (error) throw error;
    return data ? ({ ...data, items: (data as any).combo_items } as any) : null;
    }

    async guardarCombo(datos: ComboDatos, items: { producto_id: number; cantidad: number }[], id?: number): Promise<number> {
    let comboId = id;

    if (comboId) {
        const { error } = await this.supabase.from('combos').update(datos).eq('id', comboId);
        if (error) throw error;
    } else {
        const { data, error } = await this.supabase.from('combos').insert(datos).select('id').single();
        if (error) throw error;
        comboId = data.id;
    }

    await this.supabase.from('combo_items').delete().eq('combo_id', comboId);
    if (items.length > 0) {
        const filas = items.map((i) => ({ combo_id: comboId, producto_id: i.producto_id, cantidad: i.cantidad }));
        const { error } = await this.supabase.from('combo_items').insert(filas);
        if (error) throw error;
    }

    return comboId!;
    }

    async eliminarCombo(id: number): Promise<void> {
    const { error } = await this.supabase.from('combos').delete().eq('id', id);
    if (error) throw error;
    }
}