import { Component, computed, input } from '@angular/core';

export interface BarraGrafico {
  etiqueta: string;
  valor: number;
}

/** Gráfico de barras horizontales, liviano y con los colores de la app. */
@Component({
  selector: 'app-grafico-barras',
  templateUrl: './grafico-barras.html',
  styleUrl: './grafico-barras.css',
})
export class GraficoBarras {
  datos = input<BarraGrafico[]>([]);
  /** Texto que acompaña al valor, ej: "entradas". */
  unidad = input('');
  vacio = input('Sin datos para el período.');

  protected maximo = computed(() => Math.max(1, ...this.datos().map((d) => d.valor)));

  protected ancho(valor: number): string {
    return `${Math.max(2, (valor / this.maximo()) * 100)}%`;
  }
}
