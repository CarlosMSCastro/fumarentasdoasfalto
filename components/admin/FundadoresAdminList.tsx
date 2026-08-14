"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Pencil, Trash2, ImageUp, Plus } from "lucide-react";
import type { Fundador } from "@/lib/fundadores";
import { criarFundadorAdmin, atualizarFundadorAdmin, trocarFotoFundadorAdmin, apagarFundadorAdmin } from "@/app/actions/admin-fundadores";
import { useConfirmDialog } from "@/components/admin/ConfirmDialog";
import { CampoEditavel } from "@/components/admin/shared";

export default function FundadoresAdminList({ fundadores }: { fundadores: Fundador[] }) {
  const { confirmar, host: dialogHost } = useConfirmDialog();
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<{ nome: string; cargo: string } | null>(null);

  const [aAdicionar, setAAdicionar] = useState(false);

  const iniciarEdicao = (fundador: Fundador) => {
    setErro(null);
    setEditandoId(fundador.id);
    setForm({ nome: fundador.nome, cargo: fundador.cargo });
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setForm(null);
  };

  const guardarEdicao = (id: string) => {
    if (!form) return;
    setErro(null);
    startTransition(async () => {
      const resultado = await atualizarFundadorAdmin(id, form);
      if (resultado.error) {
        setErro(resultado.error);
        return;
      }
      setEditandoId(null);
      setForm(null);
    });
  };

  const onTrocarFoto = (id: string, ficheiro: File) => {
    const fd = new FormData();
    fd.set("foto", ficheiro);
    setErro(null);
    startTransition(async () => {
      const resultado = await trocarFotoFundadorAdmin(id, fd);
      if (resultado.error) setErro(resultado.error);
    });
  };

  const onApagar = async (fundador: Fundador) => {
    const confirmado = await confirmar(`Apagar "${fundador.nome}"? Esta ação não pode ser desfeita.`, "red");
    if (!confirmado) return;
    startTransition(() => apagarFundadorAdmin(fundador.id));
  };

  const onCriar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const fd = new FormData(formEl);
    setErro(null);
    startTransition(async () => {
      const resultado = await criarFundadorAdmin(fd);
      if (resultado.error) {
        setErro(resultado.error);
        return;
      }
      setAAdicionar(false);
      formEl.reset();
    });
  };

  return (
    <div>
      {erro && <p className="text-sm text-red-400 mb-4">{erro}</p>}

      <div className="mb-6">
        {aAdicionar ? (
          <form onSubmit={onCriar} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex flex-col gap-3 sm:gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-white/40">Nome</label>
                <input
                  name="nome"
                  type="text"
                  required
                  className="rounded-md bg-white/5 border border-white/15 px-2.5 py-1.5 text-sm text-white/90 focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-white/40">Cargo</label>
                <input
                  name="cargo"
                  type="text"
                  required
                  className="rounded-md bg-white/5 border border-white/15 px-2.5 py-1.5 text-sm text-white/90 focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-white/40">Foto</label>
              <input name="foto" type="file" accept="image/*" required className="text-sm text-white/70" />
            </div>
            <div className="flex gap-2 sm:gap-3">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-full bg-primary hover:bg-[var(--primary-hover)] px-5 py-2 text-sm font-semibold text-white transition-all disabled:opacity-50 cursor-pointer"
              >
                {isPending ? "A adicionar..." : "Adicionar"}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => setAAdicionar(false)}
                className="rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-white/70 hover:text-white hover:border-white/30 transition-all disabled:opacity-50 cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAAdicionar(true)}
            className="flex items-center gap-2 rounded-full border border-primary/50 text-primary hover:bg-primary/10 px-5 py-2 text-sm font-semibold transition-all cursor-pointer"
          >
            <Plus size={16} /> Adicionar fundador
          </button>
        )}
      </div>

      {fundadores.length === 0 ? (
        <p className="text-white/60 text-base">Ainda não há fundadores.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {fundadores.map((fundador) => {
            const editando = editandoId === fundador.id;
            return (
              <li key={fundador.id} className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <div className="relative shrink-0">
                  <span className="block w-14 h-14 rounded-full overflow-hidden border border-white/15 bg-white/10">
                    <Image src={fundador.fotoUrl} alt={fundador.nome} width={56} height={56} className="w-full h-full object-cover" />
                  </span>
                  <input
                    ref={(el) => {
                      fileInputRefs.current[fundador.id] = el;
                    }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const ficheiro = e.target.files?.[0];
                      e.target.value = "";
                      if (ficheiro) onTrocarFoto(fundador.id, ficheiro);
                    }}
                  />
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => fileInputRefs.current[fundador.id]?.click()}
                    title="Trocar foto"
                    className="absolute -bottom-1 -right-1 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white shadow-md hover:bg-[var(--primary-hover)] transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <ImageUp size={12} />
                  </button>
                </div>

                {editando && form ? (
                  <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <CampoEditavel legenda="Nome" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} />
                    <CampoEditavel legenda="Cargo" value={form.cargo} onChange={(v) => setForm({ ...form, cargo: v })} />
                  </div>
                ) : (
                  <div className="flex-1 min-w-0">
                    <p className="text-white/95 font-semibold truncate">{fundador.nome}</p>
                    <p className="text-white/50 text-sm truncate">{fundador.cargo}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 shrink-0">
                  {editando ? (
                    <>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => guardarEdicao(fundador.id)}
                        className="rounded-full bg-primary hover:bg-[var(--primary-hover)] px-4 py-1.5 text-xs font-semibold text-white transition-all disabled:opacity-50 cursor-pointer"
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={cancelarEdicao}
                        className="rounded-full border border-white/15 px-4 py-1.5 text-xs font-semibold text-white/70 hover:text-white hover:border-white/30 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => iniciarEdicao(fundador)}
                        className="flex items-center justify-center w-8 h-8 rounded-full border border-primary/50 text-primary hover:bg-primary/10 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => onApagar(fundador)}
                        className="flex items-center justify-center w-8 h-8 rounded-full border border-red-400/50 text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {dialogHost}
    </div>
  );
}
