import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SalasService, Butaca } from '../../services/salas.service';

interface FilaAgrupada {
  fila: string;
  tipo: string;
  columnas: Butaca[][]; // 3 columnas, cada una con sus butacas en orden
}

@Component({
  selector: 'app-sala-mapa',
  imports: [],
  templateUrl: './sala-mapa.html',
  styleUrl: './sala-mapa.css',
})
export class SalaMapa implements OnInit {
  private salasService = inject(SalasService);
  private route = inject(ActivatedRoute);

  butacas = signal<Butaca[]>([]);
  cargando = signal(true);

  filas = computed<FilaAgrupada[]>(() => {
    const porFila = new Map<string, Butaca[]>();
    for (const b of this.butacas()) {
      if (!porFila.has(b.fila)) porFila.set(b.fila, []);
      porFila.get(b.fila)!.push(b);
    }

    return Array.from(porFila.entries()).map(([fila, butacasFila]) => ({
      fila,
      tipo: butacasFila[0].tipo,
      columnas: [1, 2, 3].map((col) =>
        butacasFila.filter((b) => b.columna === col).sort((a, b) => a.numero - b.numero)
      ),
    }));
  });

  async ngOnInit() {
    const salaId = Number(this.route.snapshot.paramMap.get('id'));
    this.butacas.set(await this.salasService.listarButacas(salaId));
    this.cargando.set(false);
  }
}