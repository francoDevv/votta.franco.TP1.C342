import { Injectable, computed, inject, signal } from '@angular/core';
import { Session } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

export type Rol = 'anonimo' | 'cliente' | 'empleado' | 'gestor' | 'admin';

export interface DatosRegistro {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  tipoSangre: string;
  colorOjos: string;
  diasVacaciones: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase = inject(SupabaseService).client;

  readonly sesion = signal<Session | null>(null);
  readonly rol = signal<Rol>('anonimo');
  readonly cargando = signal(true);

  readonly usuario = computed(() => this.sesion()?.user ?? null);
  readonly logueado = computed(() => this.sesion() !== null);
  readonly esPersonal = computed(() =>
    ['empleado', 'gestor', 'admin'].includes(this.rol())
  );

  constructor() {
    this.supabase.auth.onAuthStateChange((_evento, sesion) => {
        const cambioUsuario = sesion?.user.id !== this.sesion()?.user.id;
        this.sesion.set(sesion);
        if (sesion && cambioUsuario) this.cargando.set(true);

        setTimeout(() => this.cargarRol(sesion), 0);
        });
    }

  private async cargarRol(sesion: Session | null) {
    if (!sesion) {
      this.rol.set('anonimo');
    } else {
      const { data, error } = await this.supabase
        .from('personal')
        .select('rol')
        .eq('id', sesion.user.id)
        .maybeSingle();
      if (error) console.error('No se pudo leer el rol', error);
      this.rol.set((data?.rol as Rol) ?? 'cliente');
    }
    this.cargando.set(false);
  }

  async registrar(d: DatosRegistro) {
    const { data, error } = await this.supabase.auth.signUp({
      email: d.email,
      password: d.password,
      options: {
        data: {
          nombre: d.nombre,
          apellido: d.apellido,
          fecha_nacimiento: d.fechaNacimiento,
          tipo_sangre: d.tipoSangre,
          color_ojos: d.colorOjos,
          dias_vacaciones: d.diasVacaciones,
        },
      },
    });
    if (error) throw error;
    return data;
  }

  async iniciarSesion(email: string, password: string) {
    const { error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async cerrarSesion() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }
}