import { Component, computed, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { aIso, desdeIso, fechaLarga, hoy, lunesDe, sumarDias } from '../fechas';

interface DiaSelector {
  iso: string;
  numero: number;
  diaSemana: string;
  mes: string;
  esHoy: boolean;
}

const ATAJOS = [
  { etiqueta: 'Hoy', dias: 0 },
  { etiqueta: 'En 1 semana', dias: 7 },
  { etiqueta: 'En 2 semanas', dias: 14 },
  { etiqueta: 'En 1 mes', dias: 30 },
];

const DIAS_VISIBLES = 14;

/**
 * Selector de fecha propio (sin calendario desplegable):
 * atajos rápidos + dos semanas visibles que se recorren de a una semana.
 * Funciona con formularios reactivos (formControlName) y devuelve 'YYYY-MM-DD' o null.
 */
@Component({
  selector: 'app-selector-fecha',
  templateUrl: './selector-fecha.html',
  styleUrl: './selector-fecha.css',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SelectorFecha), multi: true },
  ],
})
export class SelectorFecha implements ControlValueAccessor {
  /** Muestra la opción para dejar la fecha vacía. */
  permitirVacio = input(false);
  /** Texto que se muestra cuando no hay fecha elegida. */
  textoVacio = input('Sin fecha');

  protected atajos = ATAJOS;
  protected valor = signal<string | null>(null);
  protected inicio = signal<Date>(lunesDe(hoy()));
  protected deshabilitado = signal(false);

  private onChange: (valor: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  protected dias = computed<DiaSelector[]>(() => {
    const hoyIso = aIso(hoy());
    return Array.from({ length: DIAS_VISIBLES }, (_, i) => {
      const d = sumarDias(this.inicio(), i);
      return {
        iso: aIso(d),
        numero: d.getDate(),
        diaSemana: d.toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', ''),
        mes: d.toLocaleDateString('es-AR', { month: 'short' }).replace('.', ''),
        esHoy: aIso(d) === hoyIso,
      };
    });
  });

  protected rango = computed(() => {
    const opciones: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    const desde = this.inicio().toLocaleDateString('es-AR', opciones);
    const hasta = sumarDias(this.inicio(), DIAS_VISIBLES - 1).toLocaleDateString('es-AR', opciones);
    return `${desde} – ${hasta}`;
  });

  protected textoValor = computed(() => {
    const v = this.valor();
    return v ? fechaLarga(desdeIso(v)) : this.textoVacio();
  });

  // ---------- ControlValueAccessor ----------
  writeValue(valor: string | null): void {
    const limpio = valor ? valor.slice(0, 10) : null;
    this.valor.set(limpio);
    if (limpio) this.inicio.set(lunesDe(desdeIso(limpio)));
  }

  registerOnChange(fn: (valor: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(deshabilitado: boolean): void {
    this.deshabilitado.set(deshabilitado);
  }

  // ---------- Acciones ----------
  protected mover(dias: number) {
    this.inicio.update((d) => sumarDias(d, dias));
  }

  protected elegir(iso: string | null) {
    if (this.deshabilitado()) return;
    this.valor.set(iso);
    this.onChange(iso);
    this.onTouched();
  }

  protected elegirEn(dias: number) {
    const d = sumarDias(hoy(), dias);
    this.inicio.set(lunesDe(d));
    this.elegir(aIso(d));
  }
}
