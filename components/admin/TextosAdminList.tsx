"use client";

import { useState, useTransition } from "react";
import { Trash2, Plus } from "lucide-react";
import type { TextoChave, SeccaoLegal, PaginaLegalId } from "@/lib/textos";
import {
  atualizarTextoAdmin,
  criarSeccaoLegalAdmin,
  atualizarSeccaoLegalAdmin,
  apagarSeccaoLegalAdmin,
} from "@/app/actions/admin-textos";
import { useConfirmDialog } from "@/components/admin/ConfirmDialog";

function CampoTexto({
  legenda,
  valorInicial,
  onGuardar,
  multiline = false,
  isPending,
}: {
  legenda: string;
  valorInicial: string;
  onGuardar: (valor: string) => Promise<{ error?: string }>;
  multiline?: boolean;
  isPending: boolean;
}) {
  const [valor, setValor] = useState(valorInicial);
  const [erro, setErro] = useState<string | null>(null);

  const guardar = async () => {
    setErro(null);
    const resultado = await onGuardar(valor);
    if (resultado.error) setErro(resultado.error);
  };

  const classeCampo =
    "w-full rounded-md bg-white/5 border border-white/15 px-3 py-2 text-sm text-white/90 focus:outline-none focus:border-primary";

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-widest text-white/40">{legenda}</label>
      {multiline ? (
        <textarea value={valor} onChange={(e) => setValor(e.target.value)} rows={3} className={classeCampo} />
      ) : (
        <input type="text" value={valor} onChange={(e) => setValor(e.target.value)} className={classeCampo} />
      )}
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={guardar}
          className="self-start rounded-full bg-primary hover:bg-[var(--primary-hover)] px-4 py-1.5 text-xs font-semibold text-white transition-all disabled:opacity-50 cursor-pointer"
        >
          Guardar
        </button>
        {erro && <span className="text-red-400 text-xs">{erro}</span>}
      </div>
    </div>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden" open>
      <summary className="px-4 sm:px-5 py-3 cursor-pointer list-none text-base font-bold text-white/90 hover:bg-white/[0.03] transition-colors">
        {titulo}
      </summary>
      <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-white/10 flex flex-col gap-4">{children}</div>
    </details>
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

  const onGuardarSeccao = async (id: string, dados: { subtitulo: string; corpo: string }) => {
    return atualizarSeccaoLegalAdmin(id, dados);
  };

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
          onGuardar={(dados) => onGuardarSeccao(seccao.id, dados)}
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
  const [subtitulo, setSubtitulo] = useState(seccao.subtitulo);
  const [corpo, setCorpo] = useState(seccao.corpo);
  const [erro, setErro] = useState<string | null>(null);

  const guardar = async () => {
    setErro(null);
    const resultado = await onGuardar({ subtitulo, corpo });
    if (resultado.error) setErro(resultado.error);
  };

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
          onClick={onApagar}
          className="flex items-center justify-center w-7 h-7 rounded-full border border-red-400/50 text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-50 cursor-pointer"
        >
          <Trash2 size={13} />
        </button>
        {erro && <span className="text-red-400 text-xs">{erro}</span>}
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

  // Envolve a chamada normal (que devolve uma Promise) numa startTransition,
  // mas continua a devolver o resultado ao CampoTexto para este poder
  // mostrar o erro — startTransition não devolve o valor do callback, por
  // isso a chamada em si fica fora dele (só o isPending é que é global).
  const guardarTexto = (chave: TextoChave) => async (valor: string) => {
    return new Promise<{ error?: string }>((resolve) => {
      startTransition(async () => {
        resolve(await atualizarTextoAdmin(chave, valor));
      });
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Grupo titulo="Homepage">
        <CampoTexto legenda="Hero — label" valorInicial={textos["home.hero.label"]} onGuardar={guardarTexto("home.hero.label")} isPending={isPending} />
        <CampoTexto legenda="Hero — título" valorInicial={textos["home.hero.titulo"]} onGuardar={guardarTexto("home.hero.titulo")} isPending={isPending} />
        <CampoTexto
          legenda="Hero — descrição"
          valorInicial={textos["home.hero.descricao"]}
          onGuardar={guardarTexto("home.hero.descricao")}
          multiline
          isPending={isPending}
        />
        <CampoTexto
          legenda="Objetivos — label"
          valorInicial={textos["home.objetivos.label"]}
          onGuardar={guardarTexto("home.objetivos.label")}
          isPending={isPending}
        />
        <CampoTexto
          legenda="Objetivos — título"
          valorInicial={textos["home.objetivos.titulo"]}
          onGuardar={guardarTexto("home.objetivos.titulo")}
          isPending={isPending}
        />
        <CampoTexto
          legenda="Objetivos — descrição"
          valorInicial={textos["home.objetivos.descricao"]}
          onGuardar={guardarTexto("home.objetivos.descricao")}
          multiline
          isPending={isPending}
        />
      </Grupo>

      <Grupo titulo="Sobre">
        <CampoTexto legenda="Label" valorInicial={textos["sobre.label"]} onGuardar={guardarTexto("sobre.label")} isPending={isPending} />
        <CampoTexto legenda="Título" valorInicial={textos["sobre.titulo"]} onGuardar={guardarTexto("sobre.titulo")} isPending={isPending} />
        <CampoTexto
          legenda="Parágrafo 1"
          valorInicial={textos["sobre.paragrafo1"]}
          onGuardar={guardarTexto("sobre.paragrafo1")}
          multiline
          isPending={isPending}
        />
        <CampoTexto
          legenda="Parágrafo 2"
          valorInicial={textos["sobre.paragrafo2"]}
          onGuardar={guardarTexto("sobre.paragrafo2")}
          multiline
          isPending={isPending}
        />
        <CampoTexto
          legenda="Parágrafo 3"
          valorInicial={textos["sobre.paragrafo3"]}
          onGuardar={guardarTexto("sobre.paragrafo3")}
          multiline
          isPending={isPending}
        />
      </Grupo>

      <Grupo titulo="Termos e Condições">
        <CampoTexto
          legenda="Título da página"
          valorInicial={textos["legal.termos.titulo"]}
          onGuardar={guardarTexto("legal.termos.titulo")}
          isPending={isPending}
        />
        <SeccoesLegais pagina="termos" seccoes={seccoesTermos} isPending={isPending} startTransition={startTransition} />
      </Grupo>

      <Grupo titulo="Política de Privacidade">
        <CampoTexto
          legenda="Título da página"
          valorInicial={textos["legal.privacidade.titulo"]}
          onGuardar={guardarTexto("legal.privacidade.titulo")}
          isPending={isPending}
        />
        <SeccoesLegais pagina="privacidade" seccoes={seccoesPrivacidade} isPending={isPending} startTransition={startTransition} />
      </Grupo>

      <Grupo titulo="Política de Cookies">
        <CampoTexto
          legenda="Título da página"
          valorInicial={textos["legal.cookies.titulo"]}
          onGuardar={guardarTexto("legal.cookies.titulo")}
          isPending={isPending}
        />
        <SeccoesLegais pagina="cookies" seccoes={seccoesCookies} isPending={isPending} startTransition={startTransition} />
      </Grupo>
    </div>
  );
}
