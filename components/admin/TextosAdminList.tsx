"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import type { TextoChave, SeccaoLegal, PaginaLegalId } from "@/lib/textos";
import {
  atualizarTextoAdmin,
  criarSeccaoLegalAdmin,
  atualizarSeccaoLegalAdmin,
  apagarSeccaoLegalAdmin,
} from "@/app/actions/admin-textos";
import { useConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Campo, CampoEditavel as CampoInput } from "@/components/admin/shared";

// Grupo (Homepage/Sobre/cada página legal) — fechado por defeito, mesmo
// padrão das outras áreas do admin (Fundadores/Eventos/Produtos, listas de
// <details> fechadas até se clicar). Título a laranja para dar destaque
// (pedido explícito, distingue-se do resto do texto branco/cinza).
function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <summary className="px-4 sm:px-5 py-3 cursor-pointer list-none text-base font-bold text-primary hover:bg-white/[0.03] transition-colors">
        {titulo}
      </summary>
      <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-white/10 flex flex-col gap-5">{children}</div>
    </details>
  );
}

type CampoDef = { chave: TextoChave; legenda: string; multiline?: boolean; maxLength?: number };

// Um "Editar" desbloqueia TODOS os campos deste bloco de uma vez (não um por
// campo) — mesmo espírito de Fundadores/Eventos/Produtos, onde editar uma
// entidade desbloqueia os seus campos todos juntos. "Homepage" por exemplo
// tem 2 blocos (Hero, Objetivos) dentro do mesmo Grupo — cada um com o seu
// próprio Editar independente.
// Exportado — reaproveitado por SocialsAdminPanel.tsx (mesmo mecanismo de
// edição de chave/valor, para os links de redes sociais).
export function BlocoTextoEditavel({
  titulo,
  campos,
  textos,
  isPending,
  startTransition,
}: {
  titulo: string;
  campos: CampoDef[];
  textos: Record<TextoChave, string>;
  isPending: boolean;
  startTransition: (fn: () => void | Promise<void>) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [erro, setErro] = useState<string | null>(null);

  const iniciarEdicao = () => {
    setErro(null);
    setValores(Object.fromEntries(campos.map((c) => [c.chave, textos[c.chave]])));
    setEditando(true);
  };

  const guardar = () => {
    setErro(null);
    startTransition(async () => {
      const resultados = await Promise.all(campos.map((c) => atualizarTextoAdmin(c.chave, valores[c.chave] ?? "")));
      const comErro = resultados.find((r) => r.error);
      if (comErro?.error) {
        setErro(comErro.error);
        return;
      }
      setEditando(false);
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-white/30">{titulo}</p>
      {editando ? (
        <>
          {campos.map((c) => (
            <CampoInput
              key={c.chave}
              legenda={c.legenda}
              value={valores[c.chave] ?? ""}
              onChange={(v) => setValores((prev) => ({ ...prev, [c.chave]: v }))}
              multiline={c.multiline}
              maxLength={c.maxLength}
            />
          ))}
          {erro && <p className="text-red-400 text-xs">{erro}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={guardar}
              className="rounded-full bg-primary hover:bg-[var(--primary-hover)] px-4 py-1.5 text-xs font-semibold text-white transition-all disabled:opacity-50 cursor-pointer"
            >
              Guardar
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setEditando(false)}
              className="rounded-full border border-white/15 px-4 py-1.5 text-xs font-semibold text-white/70 hover:text-white hover:border-white/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {campos.map((c) => (
              <Campo key={c.chave} legenda={c.legenda} valor={textos[c.chave]} />
            ))}
          </div>
          <button
            type="button"
            onClick={iniciarEdicao}
            className="self-start flex items-center gap-2 rounded-full border border-primary/50 text-primary hover:bg-primary/10 px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer"
          >
            <Pencil size={13} /> Editar
          </button>
        </>
      )}
    </div>
  );
}

function SeccoesLegais({
  pagina,
  seccoes,
  isPending,
  startTransition,
}: {
  pagina: PaginaLegalId;
  seccoes: SeccaoLegal[];
  isPending: boolean;
  startTransition: (fn: () => void | Promise<void>) => void;
}) {
  const { confirmar, host: dialogHost } = useConfirmDialog();
  const [aAdicionar, setAAdicionar] = useState(false);
  const [novoSubtitulo, setNovoSubtitulo] = useState("");
  const [novoCorpo, setNovoCorpo] = useState("");
  const [erroNovo, setErroNovo] = useState<string | null>(null);

  const onApagarSeccao = async (seccao: SeccaoLegal) => {
    const confirmado = await confirmar(
      `Apagar a secção "${seccao.subtitulo || "(sem subtítulo)"}"? Esta ação não pode ser desfeita.`,
      "red"
    );
    if (!confirmado) return;
    startTransition(() => apagarSeccaoLegalAdmin(seccao.id));
  };

  const onAdicionar = () => {
    setErroNovo(null);
    startTransition(async () => {
      const resultado = await criarSeccaoLegalAdmin(pagina, { subtitulo: novoSubtitulo, corpo: novoCorpo });
      if (resultado.error) {
        setErroNovo(resultado.error);
        return;
      }
      setAAdicionar(false);
      setNovoSubtitulo("");
      setNovoCorpo("");
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {seccoes.map((seccao) => (
        <SeccaoLegalItem
          key={seccao.id}
          seccao={seccao}
          isPending={isPending}
          onGuardar={(dados) => atualizarSeccaoLegalAdmin(seccao.id, dados)}
          onApagar={() => onApagarSeccao(seccao)}
        />
      ))}

      {aAdicionar ? (
        <div className="rounded-lg border border-dashed border-white/20 p-3 flex flex-col gap-2">
          <input
            type="text"
            placeholder="Subtítulo (opcional)"
            value={novoSubtitulo}
            onChange={(e) => setNovoSubtitulo(e.target.value)}
            className="w-full rounded-md bg-white/5 border border-white/15 px-3 py-2 text-sm text-white/90 focus:outline-none focus:border-primary"
          />
          <textarea
            placeholder="Texto da secção"
            value={novoCorpo}
            onChange={(e) => setNovoCorpo(e.target.value)}
            rows={3}
            className="w-full rounded-md bg-white/5 border border-white/15 px-3 py-2 text-sm text-white/90 focus:outline-none focus:border-primary"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={onAdicionar}
              className="rounded-full bg-primary hover:bg-[var(--primary-hover)] px-4 py-1.5 text-xs font-semibold text-white transition-all disabled:opacity-50 cursor-pointer"
            >
              Adicionar
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setAAdicionar(false)}
              className="rounded-full border border-white/15 px-4 py-1.5 text-xs font-semibold text-white/70 hover:text-white hover:border-white/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              Cancelar
            </button>
            {erroNovo && <span className="text-red-400 text-xs">{erroNovo}</span>}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAAdicionar(true)}
          className="self-start flex items-center gap-2 rounded-full border border-primary/50 text-primary hover:bg-primary/10 px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer"
        >
          <Plus size={13} /> Adicionar secção
        </button>
      )}
      {dialogHost}
    </div>
  );
}

// Mesmo padrão fixo→Editar→Guardar dos blocos acima, aplicado a cada secção
// legal (subtítulo+corpo juntos, um "Editar" só) — Apagar fica sempre
// visível em modo de leitura, à parte do Editar, mesmo espírito de
// Fundadores/Eventos/Produtos.
function SeccaoLegalItem({
  seccao,
  isPending,
  onGuardar,
  onApagar,
}: {
  seccao: SeccaoLegal;
  isPending: boolean;
  onGuardar: (dados: { subtitulo: string; corpo: string }) => Promise<{ error?: string }>;
  onApagar: () => void;
}) {
  const [editando, setEditando] = useState(false);
  const [subtitulo, setSubtitulo] = useState(seccao.subtitulo);
  const [corpo, setCorpo] = useState(seccao.corpo);
  const [erro, setErro] = useState<string | null>(null);

  const iniciarEdicao = () => {
    setErro(null);
    setSubtitulo(seccao.subtitulo);
    setCorpo(seccao.corpo);
    setEditando(true);
  };

  const guardar = async () => {
    setErro(null);
    const resultado = await onGuardar({ subtitulo, corpo });
    if (resultado.error) {
      setErro(resultado.error);
      return;
    }
    setEditando(false);
  };

  if (editando) {
    return (
      <div className="rounded-lg border border-white/10 p-3 flex flex-col gap-2">
        <input
          type="text"
          placeholder="Subtítulo (opcional)"
          value={subtitulo}
          onChange={(e) => setSubtitulo(e.target.value)}
          className="w-full rounded-md bg-white/5 border border-white/15 px-3 py-2 text-sm text-white/90 focus:outline-none focus:border-primary"
        />
        <textarea
          value={corpo}
          onChange={(e) => setCorpo(e.target.value)}
          rows={3}
          className="w-full rounded-md bg-white/5 border border-white/15 px-3 py-2 text-sm text-white/90 focus:outline-none focus:border-primary"
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={guardar}
            className="rounded-full bg-primary hover:bg-[var(--primary-hover)] px-4 py-1.5 text-xs font-semibold text-white transition-all disabled:opacity-50 cursor-pointer"
          >
            Guardar
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setEditando(false)}
            className="rounded-full border border-white/15 px-4 py-1.5 text-xs font-semibold text-white/70 hover:text-white hover:border-white/30 transition-all disabled:opacity-50 cursor-pointer"
          >
            Cancelar
          </button>
          {erro && <span className="text-red-400 text-xs">{erro}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-white/10 p-3 flex flex-col gap-2">
      <Campo legenda={seccao.subtitulo ? "Subtítulo" : "Subtítulo (nenhum)"} valor={seccao.subtitulo || "—"} />
      <Campo legenda="Texto" valor={seccao.corpo} />
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={iniciarEdicao}
          className="flex items-center gap-1.5 rounded-full border border-primary/50 text-primary hover:bg-primary/10 px-4 py-1.5 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
        >
          <Pencil size={12} /> Editar
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={onApagar}
          aria-label={seccao.subtitulo ? `Apagar secção "${seccao.subtitulo}"` : "Apagar secção"}
          className="flex items-center justify-center w-7 h-7 rounded-full border border-red-400/50 text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-50 cursor-pointer"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

export default function TextosAdminList({
  textos,
  seccoesTermos,
  seccoesPrivacidade,
  seccoesCookies,
}: {
  textos: Record<TextoChave, string>;
  seccoesTermos: SeccaoLegal[];
  seccoesPrivacidade: SeccaoLegal[];
  seccoesCookies: SeccaoLegal[];
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      <Grupo titulo="Homepage">
        <BlocoTextoEditavel
          titulo="Hero"
          textos={textos}
          isPending={isPending}
          startTransition={startTransition}
          campos={[
            // Limites de caracteres nestes 3 campos (e nos 5 do bloco "Sobre"
            // mais abaixo) são de propósito — esta secção usa h-dvh fixo (não
            // cresce como Loja/Fundadores, decisão explícita do utilizador
            // 2026-08-21 de manter o Hero sempre "num ecrã só", sem scroll
            // interno nem a secção a esticar). Valores calibrados por medição
            // real no site (ver memória pos-lancamento-roadmap): com o texto
            // atual sobra ~390-700px de margem mesmo em ecrãs baixos — os
            // limites ficam a ~2x o comprimento atual, generosos mas com
            // garantia de nunca estourar essa margem.
            { chave: "home.hero.label", legenda: "Label", maxLength: 40 },
            { chave: "home.hero.titulo", legenda: "Título", maxLength: 40 },
            { chave: "home.hero.descricao", legenda: "Descrição", multiline: true, maxLength: 250 },
          ]}
        />
        <BlocoTextoEditavel
          titulo="Objetivos"
          textos={textos}
          isPending={isPending}
          startTransition={startTransition}
          campos={[
            { chave: "home.objetivos.label", legenda: "Label" },
            { chave: "home.objetivos.titulo", legenda: "Título" },
            { chave: "home.objetivos.descricao", legenda: "Descrição", multiline: true },
          ]}
        />
      </Grupo>

      <Grupo titulo="Sobre">
        <BlocoTextoEditavel
          titulo="Texto"
          textos={textos}
          isPending={isPending}
          startTransition={startTransition}
          campos={[
            // Ver nota sobre limites de caracteres no bloco "Hero" acima —
            // mesma razão, mesma calibração por medição real.
            { chave: "sobre.label", legenda: "Label", maxLength: 40 },
            { chave: "sobre.titulo", legenda: "Título", maxLength: 40 },
            { chave: "sobre.paragrafo1", legenda: "Parágrafo 1", multiline: true, maxLength: 250 },
            { chave: "sobre.paragrafo2", legenda: "Parágrafo 2", multiline: true, maxLength: 700 },
            { chave: "sobre.paragrafo3", legenda: "Parágrafo 3", multiline: true, maxLength: 350 },
          ]}
        />
      </Grupo>

      <Grupo titulo="Termos e Condições">
        <BlocoTextoEditavel
          titulo="Título da página"
          textos={textos}
          isPending={isPending}
          startTransition={startTransition}
          campos={[{ chave: "legal.termos.titulo", legenda: "Título" }]}
        />
        <SeccoesLegais pagina="termos" seccoes={seccoesTermos} isPending={isPending} startTransition={startTransition} />
      </Grupo>

      <Grupo titulo="Política de Privacidade">
        <BlocoTextoEditavel
          titulo="Título da página"
          textos={textos}
          isPending={isPending}
          startTransition={startTransition}
          campos={[{ chave: "legal.privacidade.titulo", legenda: "Título" }]}
        />
        <SeccoesLegais pagina="privacidade" seccoes={seccoesPrivacidade} isPending={isPending} startTransition={startTransition} />
      </Grupo>

      <Grupo titulo="Política de Cookies">
        <BlocoTextoEditavel
          titulo="Título da página"
          textos={textos}
          isPending={isPending}
          startTransition={startTransition}
          campos={[{ chave: "legal.cookies.titulo", legenda: "Título" }]}
        />
        <SeccoesLegais pagina="cookies" seccoes={seccoesCookies} isPending={isPending} startTransition={startTransition} />
      </Grupo>
    </div>
  );
}
