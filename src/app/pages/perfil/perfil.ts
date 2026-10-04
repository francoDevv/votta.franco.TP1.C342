import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SupabaseService } from '../../services/supabase.service';
import { EntradasService } from '../../services/entradas.service';
import { CanjeHistorial, PuntosService } from '../../services/puntos.service';

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
  imports: [DatePipe, RouterLink],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil implements OnInit {
  protected auth = inject(AuthService);
  private supabase = inject(SupabaseService).client;
  private router = inject(Router);
  private entradasService = inject(EntradasService);
  private puntosService = inject(PuntosService);

  datosCliente = signal<DatosCliente | null>(null);
  puntos = signal(0);
  credito = signal(0);
  canjes = signal<CanjeHistorial[]>([]);
  cargandoDatos = signal(true);

  async ngOnInit() {
    if (this.auth.rol() === 'cliente') {
      const clienteId = this.auth.usuario()!.id;
      try {
        const [datos, puntos, credito, canjes] = await Promise.all([
          this.supabase
            .from('clientes')
            .select('nombre, apellido, fecha_nacimiento, tipo_sangre, color_ojos, dias_vacaciones')
            .eq('id', clienteId)
            .single(),
          this.puntosService.misPuntos(),
          this.entradasService.creditoDisponible(clienteId),
          this.puntosService.historialCanjes(),
        ]);
        if (datos.error) console.error('No se pudieron cargar los datos del cliente', datos.error);
        this.datosCliente.set(datos.data);
        this.puntos.set(puntos);
        this.credito.set(credito);
        this.canjes.set(canjes);
      } catch (e) {
        console.error('No se pudo cargar el perfil', e);
      }
    }
    this.cargandoDatos.set(false);
  }

  formatear(monto: number): string {
    return monto.toLocaleString('es-AR');
  }

  async salir() {
    await this.auth.cerrarSesion();
    this.router.navigateByUrl('/login');
  }
}
