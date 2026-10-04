import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

const TIPOS_SANGRE = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-'];
const EDAD_MAXIMA = 120;

/** 'DD/MM/AAAA' → 'AAAA-MM-DD', o null si no es una fecha real. */
function aIsoDesdeTexto(texto: string): string | null {
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto);
  if (!partes) return null;
  const [, dd, mm, aaaa] = partes;
  const fecha = new Date(Number(aaaa), Number(mm) - 1, Number(dd));
  // Descarta fechas inexistentes como 31/02/2000 (Date las "corre" al mes siguiente)
  const esReal =
    fecha.getFullYear() === Number(aaaa) &&
    fecha.getMonth() === Number(mm) - 1 &&
    fecha.getDate() === Number(dd);
  return esReal ? `${aaaa}-${mm}-${dd}` : null;
}

/** Valida formato DD/MM/AAAA, que la fecha exista, que no sea futura y una edad razonable. */
function fechaNacimientoValida(control: AbstractControl): ValidationErrors | null {
  const texto: string = control.value ?? '';
  if (!texto) return null; // de esto se ocupa Validators.required
  const iso = aIsoDesdeTexto(texto);
  if (!iso) return { fechaInvalida: true };

  const nacimiento = new Date(iso + 'T00:00:00');
  const hoy = new Date();
  if (nacimiento > hoy) return { fechaFutura: true };

  const limite = new Date(hoy.getFullYear() - EDAD_MAXIMA, hoy.getMonth(), hoy.getDate());
  if (nacimiento < limite) return { fechaInvalida: true };
  return null;
}

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule],
  templateUrl: './registro.html',
  styleUrl: './registro.css',
})
export class Registro {
  private fb = inject(FormBuilder).nonNullable;
  private auth = inject(AuthService);
  private router = inject(Router);

  tiposSangre = TIPOS_SANGRE;
  error = signal('');
  enviando = signal(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    fechaNacimiento: ['', [Validators.required, fechaNacimientoValida]],
    tipoSangre: ['', Validators.required],
    colorOjos: ['', Validators.required],
    diasVacaciones: [0, [Validators.required, Validators.min(0), Validators.max(365)]],
  });

  /** Mientras se escribe, deja solo números y agrega las barras: 15081990 → 15/08/1990 */
  formatearFecha(evento: Event) {
    const input = evento.target as HTMLInputElement;
    const numeros = input.value.replace(/\D/g, '').slice(0, 8);
    let texto = numeros;
    if (numeros.length > 4) texto = `${numeros.slice(0, 2)}/${numeros.slice(2, 4)}/${numeros.slice(4)}`;
    else if (numeros.length > 2) texto = `${numeros.slice(0, 2)}/${numeros.slice(2)}`;
    input.value = texto;
    this.form.controls.fechaNacimiento.setValue(texto);
  }

  /** Mensaje de error de la fecha, solo cuando el usuario ya salió del campo. */
  errorFecha(): string | null {
    const control = this.form.controls.fechaNacimiento;
    if (!control.touched || control.valid) return null;
    if (control.hasError('required')) return 'Ingresá tu fecha de nacimiento.';
    if (control.hasError('fechaFutura')) return 'La fecha no puede ser posterior a hoy.';
    return 'Ingresá una fecha válida con el formato DD/MM/AAAA.';
  }

  async registrar() {
    if (this.form.invalid) return;
    this.enviando.set(true);
    this.error.set('');
    try {
      const datos = this.form.getRawValue();
      await this.auth.registrar({
        ...datos,
        fechaNacimiento: aIsoDesdeTexto(datos.fechaNacimiento)!,
      });
      this.router.navigateByUrl('/login');
    } catch (e) {
      console.error(e);
      this.error.set('No se pudo completar el registro');
    } finally {
      this.enviando.set(false);
    }
  }
}