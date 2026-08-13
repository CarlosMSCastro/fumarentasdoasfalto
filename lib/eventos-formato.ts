// Funções puras (sem ligação à BD) usadas por componentes client
// (EventosTimeline.tsx, EventoConteudo.tsx) — separadas de lib/eventos.ts de
// propósito, porque esse tem "server-only" e um import de valor (não de
// tipo) destas funções a partir de um client component rebentava o build
// ("You're importing a module that depends on server-only").
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function mesDe(data: string): string {
  const partes = data.split("-");
  if (partes.length < 2) return "";
  return MESES[parseInt(partes[1]) - 1];
}

export function formatarDataCompleta(data: string): string {
  const partes = data.split("-");
  if (partes.length === 3) return `${partes[2]} ${MESES[parseInt(partes[1]) - 1]} ${partes[0]}`;
  if (partes.length === 2) return `${MESES[parseInt(partes[1]) - 1]} ${partes[0]}`;
  return partes[0];
}
