import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { AuthService } from './services/auth.service';
import { AvisosEstreno } from './shared/avisos-estreno/avisos-estreno';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, AvisosEstreno],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected auth = inject(AuthService);
}