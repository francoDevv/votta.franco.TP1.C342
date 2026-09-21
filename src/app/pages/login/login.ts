import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private fb = inject(FormBuilder).nonNullable;
  protected auth = inject(AuthService);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  error = signal('');
  enviando = signal(false);

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

  async salir() {
    await this.auth.cerrarSesion();
  }
}