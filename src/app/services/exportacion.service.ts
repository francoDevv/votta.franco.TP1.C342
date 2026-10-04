import { Injectable } from '@angular/core';
import { FilaFacturacion, TotalesFacturacion } from './reportes.service';
import { desdeIso } from '../shared/fechas';

const COLUMNAS = ['Fecha', 'Compras', 'Entradas vendidas', 'Cobrado', 'Pasado a crédito'];

function fechaCorta(iso: string): string {
  return desdeIso(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function pesos(n: number): string {
  return '$' + n.toLocaleString('es-AR', { maximumFractionDigits: 2 });
}

function nombreArchivo(desde: string, hasta: string, extension: string): string {
  return `facturacion_${desde}_a_${hasta}.${extension}`;
}

function descargar(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Exporta el reporte de facturación a PDF y a Excel (mail del 10/03).
 * Las librerías se cargan recién al exportar, para no agrandar la carga inicial de la app.
 */
@Injectable({ providedIn: 'root' })
export class ExportacionService {
  async facturacionPdf(filas: FilaFacturacion[], totales: TotalesFacturacion, desde: string, hasta: string) {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Cine Fran · Reporte de facturación', 14, 20);
    doc.setFontSize(11);
    doc.text(`Período: ${fechaCorta(desde)} al ${fechaCorta(hasta)}`, 14, 28);
    doc.text(`Generado: ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}`, 14, 34);

    autoTable(doc, {
      startY: 42,
      head: [COLUMNAS],
      body: filas.map((f) => [
        fechaCorta(f.fecha),
        f.compras,
        f.entradas_vendidas,
        pesos(f.cobrado),
        pesos(f.pasado_a_credito),
      ]),
      foot: [[
        'Total',
        totales.compras,
        totales.entradas_vendidas,
        pesos(totales.cobrado),
        pesos(totales.pasado_a_credito),
      ]],
      headStyles: { fillColor: [178, 34, 52] },
      footStyles: { fillColor: [40, 30, 28], textColor: 255 },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
      styles: { fontSize: 10 },
    });

    const y = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(9);
    doc.text(
      'Cobrado: dinero efectivamente ingresado (después de cupones y crédito). Incluye compras canceladas,',
      14, y
    );
    doc.text('porque el importe se devuelve como crédito y no en dinero.', 14, y + 5);

    doc.save(nombreArchivo(desde, hasta, 'pdf'));
  }

  async facturacionExcel(filas: FilaFacturacion[], totales: TotalesFacturacion, desde: string, hasta: string) {
    const { default: ExcelJS } = await import('exceljs');

    const libro = new ExcelJS.Workbook();
    libro.creator = 'Cine Fran';
    const hoja = libro.addWorksheet('Facturación');

    hoja.addRow(['Cine Fran · Reporte de facturación']).font = { bold: true, size: 14 };
    hoja.addRow([`Período: ${fechaCorta(desde)} al ${fechaCorta(hasta)}`]);
    hoja.addRow([]);

    const encabezado = hoja.addRow(COLUMNAS);
    encabezado.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    encabezado.eachCell((celda) => {
      celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB22234' } };
    });

    for (const f of filas) {
      hoja.addRow([desdeIso(f.fecha), f.compras, f.entradas_vendidas, f.cobrado, f.pasado_a_credito]);
    }

    const total = hoja.addRow([
      'Total', totales.compras, totales.entradas_vendidas, totales.cobrado, totales.pasado_a_credito,
    ]);
    total.font = { bold: true };

    hoja.getColumn(1).numFmt = 'dd/mm/yyyy';
    hoja.getColumn(4).numFmt = '"$"#,##0.00';
    hoja.getColumn(5).numFmt = '"$"#,##0.00';
    hoja.columns.forEach((columna, i) => (columna.width = i === 0 ? 14 : 20));

    const buffer = await libro.xlsx.writeBuffer();
    descargar(
      new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      nombreArchivo(desde, hasta, 'xlsx')
    );
  }
}
