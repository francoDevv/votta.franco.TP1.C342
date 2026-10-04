import { Component, OnDestroy, computed, input, output, signal } from '@angular/core';

/**
 * Elegir una imagen con vista previa inmediata.
 * Muestra la imagen actual (si hay) y la reemplaza por la nueva al elegir un archivo.
 */
@Component({
  selector: 'app-selector-imagen',
  templateUrl: './selector-imagen.html',
  styleUrl: './selector-imagen.css',
})
export class SelectorImagen implements OnDestroy {
  /** URL pública de la imagen guardada, si existe. */
  urlActual = input<string | null>(null);
  /** Emite el archivo elegido, o null si se quita. */
  archivoCambiado = output<File | null>();

  protected archivo = signal<File | null>(null);
  private urlPrevia = signal<string | null>(null);

  protected vista = computed(() => this.urlPrevia() ?? this.urlActual());

  protected elegir(evento: Event) {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;
    if (!archivo) return;
    this.liberarPrevia();
    this.archivo.set(archivo);
    this.urlPrevia.set(URL.createObjectURL(archivo));
    this.archivoCambiado.emit(archivo);
  }

  protected quitar(input: HTMLInputElement) {
    input.value = '';
    this.liberarPrevia();
    this.archivo.set(null);
    this.archivoCambiado.emit(null);
  }

  private liberarPrevia() {
    const url = this.urlPrevia();
    if (url) URL.revokeObjectURL(url);
    this.urlPrevia.set(null);
  }

  ngOnDestroy() {
    this.liberarPrevia();
  }
}
