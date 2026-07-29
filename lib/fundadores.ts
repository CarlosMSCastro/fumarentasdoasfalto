import fundadoresData from "@/data/fundadores.json";

export interface Fundador {
  nome: string;
  cargo: string;
  foto: string;
}

const fundadores = fundadoresData as Fundador[];

export function getFundadores(): Fundador[] {
  return fundadores;
}
