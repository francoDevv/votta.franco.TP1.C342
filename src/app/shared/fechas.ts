/** Días antes del estreno en que abre la venta (preventa). */
export const DIAS_PREVENTA = 7;

/** Hoy a las 00:00, hora local. */
export function hoy(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** 'YYYY-MM-DD' → Date local (00:00). */
export function desdeIso(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Date → 'YYYY-MM-DD' (hora local). */
export function aIso(d: Date): string {
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

export function sumarDias(d: Date, dias: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + dias);
  return r;
}

/** Lunes de la semana de la fecha dada. */
export function lunesDe(d: Date): Date {
  const desplazamiento = (d.getDay() + 6) % 7;
  return sumarDias(d, -desplazamiento);
}

/** Ej: 15/10 */
export function fechaCorta(d: Date): string {
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
}

/** Ej: jueves 15 de octubre de 2026 */
export function fechaLarga(d: Date): string {
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

/** Fecha y hora en hora de Argentina. Ej: 04/10/2026 20:15 */
export function fechaHoraAr(iso: string): string {
  const d = new Date(iso);
  const zona = 'America/Argentina/Buenos_Aires';
  const fecha = d.toLocaleDateString('es-AR', { timeZone: zona, day: '2-digit', month: '2-digit', year: 'numeric' });
  const hora = d.toLocaleTimeString('es-AR', { timeZone: zona, hour: '2-digit', minute: '2-digit', hour12: false });
  return `${fecha} ${hora}`;
}
