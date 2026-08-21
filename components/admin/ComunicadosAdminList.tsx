"use client";

import { useMemo, useState, useTransition } from "react";
import { Search, Send } from "lucide-react";
import type { SocioParaComunicado, ComunicadoHistorico } from "@/app/actions/admin-comunicados";
import { enviarComunicadoAdmin } from "@/app/actions/admin-comunicados";
import { formatarComunicadoHtml } from "@/lib/comunicado-formato";
import { useConfirmDialog } from "@/components/admin/ConfirmDialog";
import { classePill, classePillTodos } from "@/components/admin/shared";

type FiltroQuota = "todos" | "emDia" | "emAtraso";

const CLASSE_INPUT =
  "w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-colors";

const STATUS_INFO: Record<ComunicadoHistorico["status"], { label: string; classe: string }> = {
  sucesso: { label: "Enviado", classe: "bg-emerald-500/15 border-emerald-500/40 text-emerald-400" },
  parcial: { label: "Parcial", classe: "bg-amber-500/15 border-amber-500/40 text-amber-400" },
  falhou: { label: "Falhou", classe: "bg-red-500/15 border-red-500/40 text-red-400" },
};

function formatarData(data: Date): string {
  return new Date(data).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ComunicadosAdminList({
  socios,
  invalidosCount,
  historicoInicial,
}: {
  socios: SocioParaComunicado[];
  invalidosCount: number;
  historicoInicial: ComunicadoHistorico[];
}) {
  const { confirmar, host: dialogHost } = useConfirmDialog();

  const [pesquisa, setPesquisa] = useState("");
  const [filtroQuota, setFiltroQuota] = useState<FiltroQuota>("todos");
  // Por omissão, todos os sócios com email válido ficam selecionados — é um
  // envio para a associação toda, o caso comum é desmarcar alguns, não
  // marcar do zero.
  const [selecionados, setSelecionados] = useState<Set<string>>(() => new Set(socios.map((s) => s.email)));

  const [assunto, setAssunto] = useState("");
  const [corpo, setCorpo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [historico, setHistorico] = useState(historicoInicial);
  const [isPending, startTransition] = useTransition();

  const pesquisaNormalizada = pesquisa.trim().toLowerCase();

  const sociosFiltrados = useMemo(() => {
    return socios.filter((s) => {
      if (filtroQuota === "emDia" && !s.quotaEmDia) return false;
      if (filtroQuota === "emAtraso" && s.quotaEmDia) return false;
      if (pesquisaNormalizada && !`${s.nome} ${s.email}`.toLowerCase().includes(pesquisaNormalizada)) return false;
      return true;
    });
  }, [socios, filtroQuota, pesquisaNormalizada]);

  const alternar = (email: string) => {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  };

  // As duas ações abaixo só tocam no subconjunto atualmente visível
  // (filtrado/pesquisado) — não mexem na seleção de quem está fora do
  // filtro, para dar para combinar "selecionar todos os em atraso" com uma
  // escolha manual já feita antes.
  const selecionarVisiveis = () => {
    setSelecionados((prev) => new Set([...prev, ...sociosFiltrados.map((s) => s.email)]));
  };
  const limparVisiveis = () => {
    const visiveisEmails = new Set(sociosFiltrados.map((s) => s.email));
    setSelecionados((prev) => new Set([...prev].filter((email) => !visiveisEmails.has(email))));
  };

  const destinatariosFinal = useMemo(() => socios.filter((s) => selecionados.has(s.email)), [socios, selecionados]);
  const previewHtml = useMemo(() => formatarComunicadoHtml(corpo), [corpo]);

  const onEnviar = async () => {
    setErro(null);
    setSucesso(null);
    if (!assunto.trim() || !corpo.trim()) {
      setErro("Preenche o assunto e a mensagem.");
      return;
    }
    if (destinatariosFinal.length === 0) {
      setErro("Seleciona pelo menos um destinatário.");
      return;
    }

    const confirmado = await confirmar(
      `Enviar "${assunto.trim()}" para ${destinatariosFinal.length} sócio(s)?\n\nEsta ação não pode ser desfeita.`,
      "primary"
    );
    if (!confirmado) return;

    startTransition(async () => {
      const resultado = await enviarComunicadoAdmin({
        assunto: assunto.trim(),
        corpoTexto: corpo.trim(),
        destinatarios: destinatariosFinal.map((s) => s.email),
        invalidosCount,
      });
      if (resultado.error) {
        setErro(resultado.error);
        return;
      }
      setSucesso(
        resultado.falhados
          ? `Enviado a ${resultado.enviados} sócio(s) — ${resultado.falhados} falharam.`
          : `Enviado a ${resultado.enviados} sócio(s).`
      );
      setAssunto("");
      setCorpo("");
      if (resultado.novoHistorico) setHistorico((prev) => [resultado.novoHistorico!, ...prev]);
    });
  };

  return (
    <div className="flex flex-col gap-10">
      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-6 flex flex-col gap-5">
        <div>
          <h2 className="text-lg font-bold text-[#f8f0d9] mb-1">Novo comunicado</h2>
          {invalidosCount > 0 && (
            <p className="text-xs text-white/40">
              {invalidosCount} sócio(s) sem email registado no Quotagest — não vão receber este comunicado.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={assunto}
            onChange={(e) => setAssunto(e.target.value)}
            placeholder="Assunto"
            className={CLASSE_INPUT}
          />
          <div>
            <textarea
              value={corpo}
              onChange={(e) => setCorpo(e.target.value)}
              placeholder="Mensagem... usa **negrito** para destacar texto, e uma linha em branco para separar parágrafos."
              rows={6}
              className={CLASSE_INPUT}
            />
          </div>
          {corpo.trim() && (
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-white/40">Pré-visualização</span>
              <div
                className="mt-1 rounded-md border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white/85"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          )}
        </div>

        <div className="border-t border-white/10 pt-4 flex flex-col gap-3">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              placeholder="Pesquisar sócios por nome ou email..."
              className="w-full rounded-full border border-white/15 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-white/40 shrink-0">Quota</span>
            <button type="button" className={classePillTodos(filtroQuota === "todos")} onClick={() => setFiltroQuota("todos")}>
              Todos
            </button>
            <button type="button" className={classePill(filtroQuota === "emDia")} onClick={() => setFiltroQuota("emDia")}>
              Em dia
            </button>
            <button type="button" className={classePill(filtroQuota === "emAtraso")} onClick={() => setFiltroQuota("emAtraso")}>
              Em atraso
            </button>

            <span className="w-px h-4 bg-white/10 mx-0.5" />

            <button
              type="button"
              onClick={selecionarVisiveis}
              className="rounded-full border border-white/15 px-2.5 py-0.5 text-xs font-semibold text-white/70 hover:text-white hover:border-white/30 transition-all cursor-pointer"
            >
              Selecionar visíveis
            </button>
            <button
              type="button"
              onClick={limparVisiveis}
              className="rounded-full border border-white/15 px-2.5 py-0.5 text-xs font-semibold text-white/70 hover:text-white hover:border-white/30 transition-all cursor-pointer"
            >
              Limpar visíveis
            </button>

            <span className="text-xs text-white/50 ml-auto">{selecionados.size} selecionado(s)</span>
          </div>

          <ul className="max-h-64 overflow-y-auto flex flex-col gap-1 rounded-md border border-white/10 p-2">
            {sociosFiltrados.length === 0 && <li className="text-sm text-white/40 px-2 py-1">Nenhum sócio encontrado.</li>}
            {sociosFiltrados.map((s) => (
              <li key={s.id}>
                <label className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-white/[0.04] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selecionados.has(s.email)}
                    onChange={() => alternar(s.email)}
                    className="accent-primary"
                  />
                  <span className="text-sm text-white/90 truncate">{s.nome}</span>
                  <span className="text-xs text-white/40 truncate">{s.email}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>

        {erro && <p className="text-sm text-red-400">{erro}</p>}
        {sucesso && <p className="text-sm text-emerald-400">{sucesso}</p>}

        <div>
          <button
            type="button"
            disabled={isPending}
            onClick={onEnviar}
            className="flex items-center gap-2 rounded-full bg-primary hover:bg-[var(--primary-hover)] px-5 py-2 text-sm font-semibold text-white transition-all disabled:opacity-50 cursor-pointer"
          >
            <Send size={14} /> {isPending ? "A enviar..." : "Enviar comunicado"}
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-[#f8f0d9] mb-4">Histórico</h2>
        {historico.length === 0 ? (
          <p className="text-white/60 text-sm">Ainda não foi enviado nenhum comunicado.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {historico.map((c) => (
              <li
                key={c.id}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white/90 truncate">{c.assunto}</p>
                  <p className="text-xs text-white/40">
                    {formatarData(c.createdAt)} · {c.enviadoPorNome} · {c.destinatariosEnviados}/{c.destinatariosTotal} entregues
                  </p>
                </div>
                <span
                  className={`shrink-0 self-start sm:self-auto rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_INFO[c.status].classe}`}
                >
                  {STATUS_INFO[c.status].label}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {dialogHost}
    </div>
  );
}
