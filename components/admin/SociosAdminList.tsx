"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { ChevronDown, Search, Pencil } from "lucide-react";
import type { QuotagestSocio, AtualizarSocioInput } from "@/lib/quotagest";
import { formatarPreco } from "@/lib/preco";
import { atualizarSocioAdmin } from "@/app/actions/admin";
import { Campo, CampoEditavel, classePill, classePillTodos } from "@/components/admin/shared";

export type SocioAdmin = QuotagestSocio & { temConta: boolean };

type FiltroQuota = "todos" | "emDia" | "emAtraso";
// numeroSocio a null identifica os fundadores (ver comentário no tipo
// QuotagestSocio) — mais fiável do que comparar a string livre de `tipo`.
type FiltroTipo = "todos" | "fundador" | "efetivo";
type FiltroConta = "todos" | "comConta" | "semConta";

function getInitials(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length >= 2) return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  return nome.slice(0, 2).toUpperCase();
}

function formatData(data: string | null): string {
  if (!data) return "—";
  return new Date(`${data}T00:00:00`).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" });
}

type FormSocio = {
  nome: string;
  email: string;
  nif: string;
  telefone: string;
  telemovel: string;
  morada: string;
  codigoPostal: string;
  dataNascimento: string;
};

export default function SociosAdminList({ socios }: { socios: SocioAdmin[] }) {
  const [pesquisa, setPesquisa] = useState("");
  const [filtroQuota, setFiltroQuota] = useState<FiltroQuota>("todos");
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("todos");
  const [filtroConta, setFiltroConta] = useState<FiltroConta>("todos");

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<FormSocio | null>(null);
  const [erroEdicao, setErroEdicao] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const iniciarEdicao = (socio: SocioAdmin) => {
    setErroEdicao(null);
    setEditandoId(socio.id);
    setForm({
      nome: socio.nome,
      email: socio.email,
      nif: socio.nif,
      telefone: socio.telefone ?? "",
      telemovel: socio.telemovel ?? "",
      morada: socio.morada ?? "",
      codigoPostal: socio.codigoPostal ?? "",
      dataNascimento: socio.dataNascimento ?? "",
    });
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setForm(null);
    setErroEdicao(null);
  };

  // Envia sempre o conjunto completo de campos (não só os alterados) — ver
  // comentário em atualizarSocio (lib/quotagest.ts) sobre porquê.
  const guardarEdicao = (id: string) => {
    if (!form) return;
    setErroEdicao(null);
    startTransition(async () => {
      const dados: AtualizarSocioInput = {
        nome: form.nome.trim(),
        email: form.email.trim(),
        nif: form.nif.trim(),
        telefone: form.telefone.trim() || null,
        telemovel: form.telemovel.trim() || null,
        morada: form.morada.trim() || null,
        codigoPostal: form.codigoPostal.trim() || null,
        dataNascimento: form.dataNascimento || null,
      };
      const resultado = await atualizarSocioAdmin(id, dados);
      if (resultado.error) {
        setErroEdicao(resultado.error);
        return;
      }
      setEditandoId(null);
      setForm(null);
    });
  };

  const pesquisaNormalizada = pesquisa.trim().toLowerCase();

  const sociosFiltrados = useMemo(() => {
    return socios.filter((socio) => {
      if (filtroQuota === "emDia" && !socio.quotaEmDia) return false;
      if (filtroQuota === "emAtraso" && socio.quotaEmDia) return false;
      if (filtroTipo === "fundador" && socio.numeroSocio) return false;
      if (filtroTipo === "efetivo" && !socio.numeroSocio) return false;
      if (filtroConta === "comConta" && !socio.temConta) return false;
      if (filtroConta === "semConta" && socio.temConta) return false;
      if (pesquisaNormalizada) {
        const alvo = `${socio.nome} ${socio.email} ${socio.numeroSocio ?? ""} ${socio.nif}`.toLowerCase();
        if (!alvo.includes(pesquisaNormalizada)) return false;
      }
      return true;
    });
  }, [socios, filtroQuota, filtroTipo, filtroConta, pesquisaNormalizada]);

  if (socios.length === 0) {
    return <p className="text-white/60 text-base">Ainda não há sócios.</p>;
  }

  return (
    <div>
      <div className="relative mb-4 sm:mb-6">
        <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          placeholder="Pesquisar por nome, email, nº de sócio ou NIF..."
          className="w-full rounded-full border border-white/15 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-colors"
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mb-8">
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

        <span className="text-[11px] font-semibold uppercase tracking-wide text-white/40 shrink-0">Tipo</span>
        <button type="button" className={classePillTodos(filtroTipo === "todos")} onClick={() => setFiltroTipo("todos")}>
          Todos
        </button>
        <button type="button" className={classePill(filtroTipo === "fundador")} onClick={() => setFiltroTipo("fundador")}>
          Fundador
        </button>
        <button type="button" className={classePill(filtroTipo === "efetivo")} onClick={() => setFiltroTipo("efetivo")}>
          Efetivo
        </button>

        <span className="w-px h-4 bg-white/10 mx-0.5" />

        <span className="text-[11px] font-semibold uppercase tracking-wide text-white/40 shrink-0">Conta</span>
        <button type="button" className={classePillTodos(filtroConta === "todos")} onClick={() => setFiltroConta("todos")}>
          Todos
        </button>
        <button type="button" className={classePill(filtroConta === "comConta")} onClick={() => setFiltroConta("comConta")}>
          Tem conta
        </button>
        <button type="button" className={classePill(filtroConta === "semConta")} onClick={() => setFiltroConta("semConta")}>
          Sem conta
        </button>
      </div>

      {sociosFiltrados.length === 0 ? (
        <p className="text-white/60 text-base">Nenhum sócio encontrado com estes filtros.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {sociosFiltrados.map((socio) => (
            <li key={socio.id} className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
              <details className="group">
                <summary className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-2 sm:gap-x-6 sm:gap-y-3 px-4 sm:px-5 py-4 cursor-pointer list-none hover:bg-white/[0.03] transition-colors">
                  <div className="flex items-start justify-between gap-3 sm:contents">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="shrink-0 w-12 h-12 rounded-full overflow-hidden border border-white/15 bg-white/10 flex items-center justify-center">
                        {socio.fotografiaUrl ? (
                          <Image src={socio.fotografiaUrl} alt="" width={48} height={48} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white/50 text-sm font-bold">{getInitials(socio.nome)}</span>
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="text-white/95 text-base font-semibold truncate">{socio.nome}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {socio.numeroSocio ? (
                            <span className="text-sm font-extrabold text-primary drop-shadow-[0_0_6px_rgba(var(--primary-rgb),0.5)]">
                              Nº {socio.numeroSocio}
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                              Fundador
                            </span>
                          )}
                          <span className="text-white/40 text-sm">· Desde {formatData(socio.dataEntrada)}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronDown size={18} className="sm:hidden shrink-0 mt-1 text-white/40 transition-transform group-open:rotate-180" />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 sm:shrink-0 sm:ml-auto">
                    <span
                      className={`text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full ${
                        socio.temConta ? "bg-white/10 text-white/70" : "border border-dashed border-white/15 text-white/40"
                      }`}
                    >
                      {socio.temConta ? "Tem conta" : "Sem conta"}
                    </span>
                    <span
                      className={`text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full ${
                        socio.quotaEmDia ? "bg-emerald-400/15 text-emerald-400" : "bg-red-400/15 text-red-400"
                      }`}
                    >
                      {socio.quotaEmDia ? "Quota em dia" : `Em dívida — ${formatarPreco(socio.divida)}`}
                    </span>
                    <ChevronDown size={18} className="hidden sm:block text-white/40 transition-transform group-open:rotate-180" />
                  </div>
                </summary>

                <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1 border-t border-white/10">
                  {editandoId === socio.id && form ? (
                    <div className="flex flex-col gap-3 sm:gap-5 pt-3 sm:pt-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5">
                        <CampoEditavel legenda="Nome" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} required className="col-span-2" />
                        <CampoEditavel
                          legenda="Email"
                          value={form.email}
                          onChange={(v) => setForm({ ...form, email: v })}
                          type="email"
                          required
                          className="col-span-2"
                        />
                        <CampoEditavel legenda="NIF" value={form.nif} onChange={(v) => setForm({ ...form, nif: v })} />
                        <CampoEditavel legenda="Telefone" value={form.telefone} onChange={(v) => setForm({ ...form, telefone: v })} type="tel" />
                        <CampoEditavel legenda="Telemóvel" value={form.telemovel} onChange={(v) => setForm({ ...form, telemovel: v })} type="tel" />
                        <CampoEditavel
                          legenda="Data de nascimento"
                          value={form.dataNascimento}
                          onChange={(v) => setForm({ ...form, dataNascimento: v })}
                          type="date"
                        />
                        <CampoEditavel
                          legenda="Morada"
                          value={form.morada}
                          onChange={(v) => setForm({ ...form, morada: v })}
                          className="col-span-2 sm:col-span-3"
                        />
                        <CampoEditavel legenda="Código postal" value={form.codigoPostal} onChange={(v) => setForm({ ...form, codigoPostal: v })} />
                      </div>

                      {erroEdicao && <p className="text-sm text-red-400">{erroEdicao}</p>}

                      <div className="flex gap-2 sm:gap-3">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => guardarEdicao(socio.id)}
                          className="rounded-full bg-primary hover:bg-[var(--primary-hover)] px-5 py-2 text-sm font-semibold text-white transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {isPending ? "A guardar..." : "Guardar"}
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={cancelarEdicao}
                          className="rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-white/70 hover:text-white hover:border-white/30 transition-all disabled:opacity-50 cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5 pt-3 sm:pt-4">
                        <Campo legenda="Email" valor={socio.email} />
                        <Campo legenda="NIF" valor={socio.nif} />
                        <Campo legenda="Tipo" valor={socio.tipo} />
                        <Campo legenda="Estado" valor={socio.estado} />
                        {socio.grupoSanguineo && <Campo legenda="Grupo sanguíneo" valor={socio.grupoSanguineo} />}
                      </div>
                      <div className="pt-3 sm:pt-4">
                        <button
                          type="button"
                          onClick={() => iniciarEdicao(socio)}
                          className="flex items-center gap-2 rounded-full border border-primary/50 text-primary hover:bg-primary/10 px-5 py-2 text-sm font-semibold transition-all cursor-pointer"
                        >
                          <Pencil size={14} /> Editar
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
