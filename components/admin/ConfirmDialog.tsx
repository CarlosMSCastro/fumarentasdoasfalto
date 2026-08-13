"use client";

import { useCallback, useRef, useState } from "react";
import { AlertDialog } from "radix-ui";

type Pedido =
  | { tipo: "confirm"; mensagem: string; variante: Variante; resolve: (ok: boolean) => void }
  | { tipo: "prompt"; mensagem: string; resolve: (valor: string | null) => void }
  // Pergunta de 3 vias (ex: "Tem código de rastreio?") — "sim"/"não" são as
  // duas respostas válidas que continuam o fluxo, "Cancelar" aborta tudo e
  // volta atrás (não é o mesmo que responder "não").
  | { tipo: "escolha"; mensagem: string; variante: Variante; resolve: (valor: "sim" | "nao" | null) => void };

type Variante = "primary" | "emerald" | "red";

const CLASSE_ACAO: Record<Variante, string> = {
  primary: "bg-primary hover:bg-[var(--primary-hover)]",
  emerald: "bg-emerald-500 hover:bg-emerald-600",
  red: "bg-red-500 hover:bg-red-600",
};

const CLASSE_BOTAO_NEUTRO =
  "rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/70 hover:text-white hover:border-white/30 transition-all cursor-pointer";

// Substitui window.confirm()/window.prompt() (popup nativo do browser, fora
// do visual do site) por um modal com o mesmo estilo do painel de admin.
// Devolve Promises de propósito — para os handlers continuarem a poder
// escrever-se como sequência linear com `await`, tal como faziam com os
// diálogos nativos, em vez de terem de gerir estado espalhado por vários
// callbacks.
export function useConfirmDialog() {
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [valorPrompt, setValorPrompt] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const confirmar = useCallback((mensagem: string, variante: Variante = "primary") => {
    return new Promise<boolean>((resolve) => setPedido({ tipo: "confirm", mensagem, variante, resolve }));
  }, []);

  const pedirTexto = useCallback((mensagem: string) => {
    setValorPrompt("");
    return new Promise<string | null>((resolve) => setPedido({ tipo: "prompt", mensagem, resolve }));
  }, []);

  const perguntar = useCallback((mensagem: string, variante: Variante = "primary") => {
    return new Promise<"sim" | "nao" | null>((resolve) => setPedido({ tipo: "escolha", mensagem, variante, resolve }));
  }, []);

  const fechar = (resultado: boolean | string | null) => {
    if (!pedido) return;
    if (pedido.tipo === "confirm") pedido.resolve(Boolean(resultado));
    else if (pedido.tipo === "prompt") pedido.resolve((resultado as string | null) ?? null);
    else pedido.resolve(resultado as "sim" | "nao" | null);
    setPedido(null);
  };

  const host = (
    <AlertDialog.Root open={pedido !== null} onOpenChange={(open) => !open && fechar(pedido?.tipo === "confirm" ? false : null)}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <AlertDialog.Content
          onOpenAutoFocus={(e) => {
            if (pedido?.tipo === "prompt") {
              e.preventDefault();
              inputRef.current?.focus();
            }
          }}
          className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-sm rounded-xl border border-white/10 bg-[#141414] p-6 shadow-xl data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
        >
          {pedido && (
            <>
              <AlertDialog.Title className="sr-only">Confirmação</AlertDialog.Title>
              <AlertDialog.Description className="text-white/90 text-sm whitespace-pre-line">{pedido.mensagem}</AlertDialog.Description>

              {pedido.tipo === "prompt" && (
                <input
                  ref={inputRef}
                  type="text"
                  value={valorPrompt}
                  onChange={(e) => setValorPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") fechar(valorPrompt.trim() || null);
                  }}
                  className="mt-4 w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                />
              )}

              {pedido.tipo === "escolha" ? (
                <div className="flex flex-wrap justify-end gap-2 mt-6">
                  <AlertDialog.Cancel asChild>
                    <button type="button" onClick={() => fechar(null)} className={CLASSE_BOTAO_NEUTRO}>
                      Cancelar
                    </button>
                  </AlertDialog.Cancel>
                  <AlertDialog.Action asChild>
                    <button type="button" onClick={() => fechar("nao")} className={CLASSE_BOTAO_NEUTRO}>
                      Não
                    </button>
                  </AlertDialog.Action>
                  <AlertDialog.Action asChild>
                    <button
                      type="button"
                      onClick={() => fechar("sim")}
                      className={`rounded-full px-4 py-2 text-sm font-semibold text-white transition-all cursor-pointer ${CLASSE_ACAO[pedido.variante]}`}
                    >
                      Sim
                    </button>
                  </AlertDialog.Action>
                </div>
              ) : (
                <div className="flex justify-end gap-3 mt-6">
                  <AlertDialog.Cancel asChild>
                    <button
                      type="button"
                      onClick={() => fechar(pedido.tipo === "confirm" ? false : null)}
                      className={CLASSE_BOTAO_NEUTRO}
                    >
                      Cancelar
                    </button>
                  </AlertDialog.Cancel>
                  <AlertDialog.Action asChild>
                    <button
                      type="button"
                      onClick={() => fechar(pedido.tipo === "confirm" ? true : valorPrompt.trim() || null)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold text-white transition-all cursor-pointer ${
                        CLASSE_ACAO[pedido.tipo === "confirm" ? pedido.variante : "primary"]
                      }`}
                    >
                      {pedido.tipo === "prompt" ? "Confirmar" : "Sim"}
                    </button>
                  </AlertDialog.Action>
                </div>
              )}
            </>
          )}
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );

  return { confirmar, pedirTexto, perguntar, host };
}
