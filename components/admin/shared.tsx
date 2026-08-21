"use client";

import { useId } from "react";

// Partilhado por todas as listas do /admin (Encomendas, Sócios, Utilizadores,
// Fundadores, Eventos, Produtos, Textos) — antes cada ficheiro tinha a sua
// própria cópia quase idêntica destes 4 componentes/funções.

export function Campo({ legenda, valor, className = "" }: { legenda: string; valor: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1 min-w-0 ${className}`}>
      <span className="text-[11px] font-semibold uppercase tracking-widest text-white/40">{legenda}</span>
      {/* whitespace-pre-line preserva quebras de linha (texto legal
          multi-parágrafo) — sem efeito em valores de uma linha só. */}
      <span className="text-sm text-white/90 break-words whitespace-pre-line">{valor}</span>
    </div>
  );
}

export function CampoEditavel({
  legenda,
  value,
  onChange,
  type = "text",
  required = false,
  multiline = false,
  rows = 3,
  maxLength,
  className = "",
}: {
  legenda: string;
  value: string;
  onChange: (valor: string) => void;
  type?: string;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  className?: string;
}) {
  // useId() em vez de derivar de `legenda` — estes campos aparecem repetidos
  // dentro de listas (uma linha por sócio/produto/etc.), um id fixo tipo
  // "nome" colidiria em toda a página e o label deixava de apontar para o
  // input certo.
  const id = useId();
  const classeCampo =
    "w-full rounded-md bg-white/5 border border-white/15 px-2.5 py-1.5 text-sm text-white/90 focus:outline-none focus:border-primary";
  return (
    <div className={`flex flex-col gap-1 min-w-0 ${className}`}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
          {legenda}
        </label>
        {maxLength !== undefined && (
          <span className="text-[10px] text-white/30 tabular-nums shrink-0">
            {value.length}/{maxLength}
          </span>
        )}
      </div>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          maxLength={maxLength}
          className={classeCampo}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          className={classeCampo}
        />
      )}
    </div>
  );
}

export function classePill(ativo: boolean): string {
  return `shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold transition-all cursor-pointer border whitespace-nowrap ${
    ativo
      ? "bg-primary border-primary text-white shadow-[0_0_10px_rgba(var(--primary-rgb),0.4)]"
      : "bg-white/5 border-white/15 text-white/70 hover:border-white/30 hover:text-white"
  }`;
}

// "Todos" tem borda tracejada quando inativo (distingue-se visualmente dos
// valores concretos) e fica preenchido a laranja quando ativo, tal como os
// outros — o destaque é sobretudo notar-se que é a opção de "reset" (limpa a
// seleção do grupo todo).
export function classePillTodos(ativo: boolean): string {
  return `shrink-0 rounded-full px-2 py-0.5 text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${
    ativo
      ? "bg-primary border-primary text-white shadow-[0_0_10px_rgba(var(--primary-rgb),0.4)]"
      : "border-dashed border-white/30 text-white/80 hover:border-white/50"
  }`;
}
