export function formatGuarani(value: number): string {
  return `Gs. ${value.toLocaleString('es-PY')}`;
}

export function formatGuaraniShort(value: number): string {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    const formatted = millions % 1 === 0 ? millions.toString() : millions.toFixed(1);
    return `${formatted} milhões`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)} mil`;
  }
  return value.toString();
}

export function formatDatePT(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const months = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
  ];
  return `${String(d.getDate()).padStart(2, '0')} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
}

export function formatDateES(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];
  return `${String(d.getDate()).padStart(2, '0')} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
}

export function validateCedulaPY(cedula: string): boolean {
  const cleaned = cedula.replace(/\D/g, '');
  return cleaned.length >= 6 && cleaned.length <= 9;
}

export function validatePhonePY(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 9 && cleaned.length <= 15;
}

export function normalizePhonePY(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('595')) return `+${cleaned}`;
  if (cleaned.startsWith('0')) return `+595${cleaned.substring(1)}`;
  return `+595${cleaned}`;
}

export function generateTicketNumber(lastNumber: number): number {
  return lastNumber + 1;
}

export function calculateAvailable(maxCoupons: number, sold: number): number {
  return Math.max(0, maxCoupons - sold);
}

export function parseCSVNumbers(csvRow: string): number[] {
  return csvRow
    .split(/[,;|\s]+/)
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n) && n > 0 && n <= 99);
}
