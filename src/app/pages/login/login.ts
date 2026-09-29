import { Component, effect, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private fb = inject(FormBuilder).nonNullable;
  private router = inject(Router);
  protected auth = inject(AuthService);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  error = signal('');
  enviando = signal(false);
  private yaRedirigido = false;

  constructor() {
    effect(() => {
      if (!this.auth.cargando() && this.auth.logueado() && !this.yaRedirigido) {
        this.yaRedirigido = true;
        setTimeout(() => this.router.navigateByUrl('/cartelera'), 900);
      }
    });
  }

  async entrar() {
    if (this.form.invalid) return;
    this.enviando.set(true);
    this.error.set('');
    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.iniciarSesion(email, password);
    } catch (e) {
      console.error(e);
      this.error.set('Mail o contraseña incorrectos');
    } finally {
      this.enviando.set(false);
    }
  }
}