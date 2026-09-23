import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SupabaseService } from '../../services/supabase.service';

interface DatosCliente {
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  tipo_sangre: string;
  color_ojos: string;
  dias_vacaciones: number;
}

@Component({
  selector: 'app-perfil',
  imports: [],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil implements OnInit {
  protected auth = inject(AuthService);
  private supabase = inject(SupabaseService).client;
  private router = inject(Router);

  datosCliente = signal<DatosCliente | null>(null);
  cargandoDatos = signal(true);

  async ngOnInit() {
    if (this.auth.rol() === 'cliente') {
      const { data, error } = await this.supabase
        .from('clientes')
        .select('nombre, apellido, fecha_nacimiento, tipo_sangre, color_ojos, dias_vacaciones')
        .eq('id', this.auth.usuario()!.id)
        .single();
      if (error) console.error('No se pudieron cargar los datos del cliente', error);
      this.datosCliente.set(data);
    }
    this.cargandoDatos.set(false);
  }

  async salir() {
    await this.auth.cerrarSesion();
    this.router.navigateByUrl('/login');
  }
}