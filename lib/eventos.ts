import eventosData from "@/data/eventos.json";

export interface Evento {
  id: string;
  titulo: string;
  local: string;
  data: string;
  descricao: string;
  destaque: boolean;
  pasta: string;
  capa: string;
  fotos: string[];
}

const eventos = eventosData as Evento[];

export function getEventos(): Evento[] {
  return eventos;
}

export function getEventoById(id: string): Evento | undefined {
  return eventos.find((ev) => ev.id === id);
}

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
