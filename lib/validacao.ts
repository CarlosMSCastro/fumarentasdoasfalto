// Puro, sem dependências de BD — importável de client components e server
// actions por igual. Centraliza validações repetidas em vários ficheiros.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEMOVEL_MBWAY_RE = /^9\d{8}$/;

export function emailValido(email: string): boolean {
  return EMAIL_RE.test(email);
}

export function telemovelMbwayValido(telemovel: string): boolean {
  return TELEMOVEL_MBWAY_RE.test(telemovel);
}
