"use client";

import { useMemo, useState, useTransition } from "react";
import { ChevronDown, Search, Pencil, Link2Off } from "lucide-react";
import type { users } from "@/lib/db/schema";
import type { QuotagestSocio } from "@/lib/quotagest";
import { atualizarUtilizadorAdmin, desvincularSocioAdmin, type AtualizarUtilizadorInput } from "@/app/actions/admin";
import { useConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Campo, CampoEditavel, classePill, classePillTodos } from "@/components/admin/shared";

// Nunca inclui passwordHash — a query em app/admin/(painel)/utilizadores/
// page.tsx já seleciona só os campos abaixo, de propósito, para essa coluna
// nunca sair da BD nem chegar perto do bundle do cliente.
export type UtilizadorAdmin = Omit<typeof users.$inferSelect, "passwordHash"> & {
  socio: QuotagestSocio | null;
};

type FiltroSocio = "todos" | "comSocio" | "semSocio";
type FiltroRole = "todos" | "admin" | "user";

function formatData(data: Date): string {
  return data.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" });
}

type FormUser = {
  nome: string;
  email: string;
  telefone: string;
  morada: string;
  codigoPostal: string;
  cidade: string;
};

export default function UtilizadoresAdminList({ utilizadores }: { utilizadores: UtilizadorAdmin[] }) {
  const { confirmar, host: dialogHost } = useConfirmDialog();
  const [pesquisa, setPesquisa] = useState("");
  const [filtroSocio, setFiltroSocio] = useState<FiltroSocio>("todos");
  const [filtroRole, setFiltroRole] = useState<FiltroRole>("todos");

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<FormUser | null>(null);
  const [erroEdicao, setErroEdicao] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const iniciarEdicao = (user: UtilizadorAdmin) => {
    setErroEdicao(null);
    setEditandoId(user.id);
    setForm({
      nome: user.name ?? "",
      email: user.email,
      telefone: user.phone ?? "",
      morada: user.addressLine ?? "",
      codigoPostal: user.postalCode ?? "",
      cidade: user.city ?? "",
    });
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setForm(null);
    setErroEdicao(null);
  };

  const guardarEdicao = (id: string) => {
    if (!form) return;
    setErroEdicao(null);
    startTransition(async () => {
      const dados: AtualizarUtilizadorInput = {
        nome: form.nome.trim(),
        email: form.email.trim(),
        telefone: form.telefone.trim() || null,
        morada: form.morada.trim() || null,
        codigoPostal: form.codigoPostal.trim() || null,
        cidade: form.cidade.trim() || null,
      };
      const resultado = await atualizarUtilizadorAdmin(id, dados);
      if (resultado.error) {
        setErroEdicao(resultado.error);
        return;
      }
      setEditandoId(null);
      setForm(null);
    });
  };

  const onDesvincularSocio = async (user: UtilizadorAdmin) => {
    if (!user.socio) return;
    const confirmado = await confirmar(
      `Desvincular "${user.socio.nome}" da conta de ${user.name || user.email}?\n\nA conta deixa de mostrar dados de sócio até seres ligada de novo (auto-match por email ou pesquisa manual no /perfil).`,
      "red"
    );
    if (!confirmado) return;
    startTransition(() => desvincularSocioAdmin(user.id));
  };

  const pesquisaNormalizada = pesquisa.trim().toLowerCase();

  const utilizadoresFiltrados = useMemo(() => {
    return utilizadores.filter((user) => {
      if (filtroSocio === "comSocio" && !user.socio) return false;
      if (filtroSocio === "semSocio" && user.socio) return false;
      if (filtroRole !== "todos" && user.role !== filtroRole) return false;
      if (pesquisaNormalizada) {
        const alvo = `${user.name ?? ""} ${user.email}`.toLowerCase();
        if (!alvo.includes(pesquisaNormalizada)) return false;
      }
      return true;
    });
  }, [utilizadores, filtroSocio, filtroRole, pesquisaNormalizada]);

  if (utilizadores.length === 0) {
    return <p className="text-white/60 text-base">Ainda não há utilizadores registados.</p>;
  }

  return (
    <div>
      <div className="relative mb-4 sm:mb-6">
        <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          placeholder="Pesquisar por nome ou email..."
          className="w-full rounded-full border border-white/15 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-colors"
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mb-8">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-white/40 shrink-0">Sócio</span>
        <button type="button" className={classePillTodos(filtroSocio === "todos")} onClick={() => setFiltroSocio("todos")}>
          Todos
        </button>
        <button type="button" className={classePill(filtroSocio === "comSocio")} onClick={() => setFiltroSocio("comSocio")}>
          Com sócio associado
        </button>
        <button type="button" className={classePill(filtroSocio === "semSocio")} onClick={() => setFiltroSocio("semSocio")}>
          Sem sócio associado
        </button>

        <span className="w-px h-4 bg-white/10 mx-0.5" />

        <span className="text-[11px] font-semibold uppercase tracking-wide text-white/40 shrink-0">Role</span>
        <button type="button" className={classePillTodos(filtroRole === "todos")} onClick={() => setFiltroRole("todos")}>
          Todos
        </button>
        <button type="button" className={classePill(filtroRole === "admin")} onClick={() => setFiltroRole("admin")}>
          Admin
        </button>
        <button type="button" className={classePill(filtroRole === "user")} onClick={() => setFiltroRole("user")}>
          Utilizador
        </button>
      </div>

      {utilizadoresFiltrados.length === 0 ? (
        <p className="text-white/60 text-base">Nenhum utilizador encontrado com estes filtros.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {utilizadoresFiltrados.map((user) => (
            <li key={user.id} className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
              <details className="group">
                <summary className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-2 sm:gap-x-6 sm:gap-y-3 px-4 sm:px-5 py-4 cursor-pointer list-none hover:bg-white/[0.03] transition-colors">
                  <div className="flex items-start justify-between gap-3 sm:contents">
                    <div className="min-w-0">
                      <p className="text-white/95 text-base font-semibold truncate">{user.name || "Sem nome"}</p>
                      <p className="text-white/50 text-sm truncate">{user.email}</p>
                    </div>
                    <ChevronDown size={18} className="sm:hidden shrink-0 mt-1 text-white/40 transition-transform group-open:rotate-180" />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 sm:shrink-0 sm:ml-auto">
                    {user.role === "admin" && (
                      <span className="text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full bg-primary/15 text-primary">
                        Admin
                      </span>
                    )}
                    {user.socio ? (
                      <span
                        className={`text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full ${
                          user.socio.quotaEmDia ? "bg-emerald-400/15 text-emerald-400" : "bg-red-400/15 text-red-400"
                        }`}
                      >
                        {user.socio.nome}
                      </span>
                    ) : (
                      <span className="text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full bg-white/10 text-white/50">
                        Sem sócio associado
                      </span>
                    )}
                    <ChevronDown size={18} className="hidden sm:block text-white/40 transition-transform group-open:rotate-180" />
                  </div>
                </summary>

                <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1 border-t border-white/10">
                  {editandoId === user.id && form ? (
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
                        <CampoEditavel legenda="Telefone" value={form.telefone} onChange={(v) => setForm({ ...form, telefone: v })} type="tel" />
                        <CampoEditavel
                          legenda="Morada"
                          value={form.morada}
                          onChange={(v) => setForm({ ...form, morada: v })}
                          className="col-span-2 sm:col-span-2"
                        />
                        <CampoEditavel legenda="Código postal" value={form.codigoPostal} onChange={(v) => setForm({ ...form, codigoPostal: v })} />
                        <CampoEditavel legenda="Cidade" value={form.cidade} onChange={(v) => setForm({ ...form, cidade: v })} />
                      </div>

                      {erroEdicao && <p className="text-sm text-red-400">{erroEdicao}</p>}

                      <div className="flex gap-2 sm:gap-3">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => guardarEdicao(user.id)}
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
                        <Campo legenda="Registado em" valor={formatData(user.createdAt)} />
                        <Campo legenda="Telefone" valor={user.phone || "—"} />
                        <Campo legenda="Morada" valor={user.addressLine ? `${user.addressLine}, ${user.postalCode} ${user.city}` : "—"} />
                        {user.socio && <Campo legenda="Estado da quota" valor={user.socio.quotaEmDia ? "Em dia" : "Em atraso"} />}
                      </div>
                      <div className="flex flex-wrap gap-2 sm:gap-3 pt-3 sm:pt-4">
                        <button
                          type="button"
                          onClick={() => iniciarEdicao(user)}
                          className="flex items-center gap-2 rounded-full border border-primary/50 text-primary hover:bg-primary/10 px-5 py-2 text-sm font-semibold transition-all cursor-pointer"
                        >
                          <Pencil size={14} /> Editar
                        </button>
                        {user.socio && (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => onDesvincularSocio(user)}
                            className="flex items-center gap-2 rounded-full border border-red-400/50 text-red-400 hover:bg-red-400/10 px-5 py-2 text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer"
                          >
                            <Link2Off size={14} /> Desvincular sócio
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
      {dialogHost}
    </div>
  );
}
