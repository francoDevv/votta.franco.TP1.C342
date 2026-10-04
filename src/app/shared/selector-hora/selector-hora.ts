import { Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Selector de hora propio: grilla de horarios cada 30 minutos.
 * Un clic elige la hora, sin desplegables ni ruedas. Devuelve 'HH:MM'.
 */
@Component({
  selector: 'app-selector-hora',
  templateUrl: './selector-hora.html',
  styleUrl: './selector-hora.css',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SelectorHora), multi: true },
  ],
})
export class SelectorHora implements ControlValueAccessor {
  /** Primera y última hora de la grilla (horario de funciones del cine). */
  desde = input(10);
  hasta = input(23);

  protected valor = signal<string | null>(null);
  protected deshabilitado = signal(false);

  private onChange: (valor: string) => void = () => {};
  private onTouched: () => void = () => {};

  protected horas(): string[] {
    const lista: string[] = [];
    for (let h = this.desde(); h <= this.hasta(); h++) {
      const hh = String(h).padStart(2, '0');
      lista.push(`${hh}:00`, `${hh}:30`);
    }
    return lista;
  }

  writeValue(valor: string | null): void {
    this.valor.set(valor ? valor.slice(0, 5) : null);
  }

  registerOnChange(fn: (valor: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(deshabilitado: boolean): void {
    this.deshabilitado.set(deshabilitado);
  }

  protected elegir(hora: string) {
    if (this.deshabilitado()) return;
    this.valor.set(hora);
    this.onChange(hora);
    this.onTouched();
  }
}
