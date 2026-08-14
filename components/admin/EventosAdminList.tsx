"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { ChevronDown, Pencil, Trash2, ImagePlus, Star, Plus } from "lucide-react";
import type { Evento } from "@/lib/eventos";
import {
  criarEventoAdmin,
  atualizarEventoAdmin,
  definirMostrarEventoAdmin,
  adicionarFotoEventoAdmin,
  apagarFotoEventoAdmin,
  escolherCapaEventoAdmin,
  apagarEventoAdmin,
} from "@/app/actions/admin-eventos";
import { useConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Campo, CampoEditavel } from "@/components/admin/shared";


type FormEvento = { titulo: string; local: string; data: string; descricao: string };

export default function EventosAdminList({ eventos }: { eventos: Evento[] }) {
  const { confirmar, host: dialogHost } = useConfirmDialog();
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const addFotoRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<FormEvento | null>(null);

  const [aAdicionar, setAAdicionar] = useState(false);

  const iniciarEdicao = (evento: Evento) => {
    setErro(null);
    setEditandoId(evento.id);
    setForm({ titulo: evento.titulo, local: evento.local, data: evento.data, descricao: evento.descricao });
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setForm(null);
  };

  const guardarEdicao = (id: string) => {
    if (!form) return;
    setErro(null);
    startTransition(async () => {
      const resultado = await atualizarEventoAdmin(id, form);
      if (resultado.error) {
        setErro(resultado.error);
        return;
      }
      setEditandoId(null);
      setForm(null);
    });
  };

  const onAlternarMostrar = async (evento: Evento) => {
    const acao = evento.mostrar ? "esconder" : "voltar a mostrar";
    const confirmado = await confirmar(
      `Queres ${acao} o evento "${evento.titulo}"?${evento.mostrar ? "\n\nDeixa de aparecer na timeline e na própria página do evento." : ""}`,
      "primary"
    );
    if (!confirmado) return;
    startTransition(() => definirMostrarEventoAdmin(evento.id, !evento.mostrar));
  };

  const onAdicionarFoto = (id: string, ficheiro: File) => {
    const fd = new FormData();
    fd.set("foto", ficheiro);
    setErro(null);
    startTransition(async () => {
      const resultado = await adicionarFotoEventoAdmin(id, fd);
      if (resultado.error) setErro(resultado.error);
    });
  };

  const onApagarFoto = async (eventoId: string, url: string) => {
    const confirmado = await confirmar("Apagar esta foto do evento?", "red");
    if (!confirmado) return;
    setErro(null);
    startTransition(async () => {
      const resultado = await apagarFotoEventoAdmin(eventoId, url);
      if (resultado.error) setErro(resultado.error);
    });
  };

  const onEscolherCapa = (eventoId: string, url: string) => {
    setErro(null);
    startTransition(async () => {
      const resultado = await escolherCapaEventoAdmin(eventoId, url);
      if (resultado.error) setErro(resultado.error);
    });
  };

  const onApagarEvento = async (evento: Evento) => {
    const confirmado = await confirmar(`Apagar o evento "${evento.titulo}"? Esta ação não pode ser desfeita.`, "red");
    if (!confirmado) return;
    startTransition(() => apagarEventoAdmin(evento.id));
  };

  const onCriar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const fd = new FormData(formEl);
    setErro(null);
    startTransition(async () => {
      const resultado = await criarEventoAdmin(fd);
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
          <form onSubmit={onCriar} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-white/40">Título</label>
                <input name="titulo" type="text" required className="rounded-md bg-white/5 border border-white/15 px-2.5 py-1.5 text-sm text-white/90 focus:outline-none focus:border-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-white/40">Local</label>
                <input name="local" type="text" required className="rounded-md bg-white/5 border border-white/15 px-2.5 py-1.5 text-sm text-white/90 focus:outline-none focus:border-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-white/40">Data (AAAA-MM-DD)</label>
                <input name="data" type="text" required placeholder="2026-08-13" className="rounded-md bg-white/5 border border-white/15 px-2.5 py-1.5 text-sm text-white/90 focus:outline-none focus:border-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-white/40">Foto (capa inicial)</label>
                <input name="foto" type="file" accept="image/*" required className="text-sm text-white/70" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-white/40">Descrição</label>
              <textarea name="descricao" rows={2} className="rounded-md bg-white/5 border border-white/15 px-2.5 py-1.5 text-sm text-white/90 focus:outline-none focus:border-primary" />
            </div>
            <div className="flex gap-2 sm:gap-3">
              <button type="submit" disabled={isPending} className="rounded-full bg-primary hover:bg-[var(--primary-hover)] px-5 py-2 text-sm font-semibold text-white transition-all disabled:opacity-50 cursor-pointer">
                {isPending ? "A adicionar..." : "Adicionar"}
              </button>
              <button type="button" disabled={isPending} onClick={() => setAAdicionar(false)} className="rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-white/70 hover:text-white hover:border-white/30 transition-all disabled:opacity-50 cursor-pointer">
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <button type="button" onClick={() => setAAdicionar(true)} className="flex items-center gap-2 rounded-full border border-primary/50 text-primary hover:bg-primary/10 px-5 py-2 text-sm font-semibold transition-all cursor-pointer">
            <Plus size={16} /> Adicionar evento
          </button>
        )}
      </div>

      {eventos.length === 0 ? (
        <p className="text-white/60 text-base">Ainda não há eventos.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {eventos.map((evento) => {
            const editando = editandoId === evento.id;
            return (
              <li key={evento.id} className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
                <details className="group">
                  <summary className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-2 sm:gap-x-6 sm:gap-y-3 px-4 sm:px-5 py-4 cursor-pointer list-none hover:bg-white/[0.03] transition-colors">
                    <div className="flex items-start justify-between gap-3 sm:contents">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="shrink-0 w-12 h-12 rounded-md overflow-hidden border border-white/15 bg-white/10">
                          <Image src={evento.capaUrl} alt={evento.titulo} width={48} height={48} className="w-full h-full object-cover" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-white/95 text-base font-semibold truncate">{evento.titulo}</p>
                          <p className="text-white/50 text-sm truncate">
                            {evento.local} · {evento.data}
                          </p>
                        </div>
                      </div>
                      <ChevronDown size={18} className="sm:hidden shrink-0 mt-1 text-white/40 transition-transform group-open:rotate-180" />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 sm:shrink-0 sm:ml-auto">
                      {evento.destaque && (
                        <span className="text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full bg-primary/15 text-primary">Destaque</span>
                      )}
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={(e) => {
                          e.preventDefault();
                          onAlternarMostrar(evento);
                        }}
                        className={`text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full transition-all disabled:opacity-50 cursor-pointer ${
                          evento.mostrar ? "bg-emerald-400/15 text-emerald-400 hover:bg-emerald-400/25" : "bg-red-400/15 text-red-400 hover:bg-red-400/25"
                        }`}
                      >
                        {evento.mostrar ? "Visível" : "Escondido"}
                      </button>
                      <ChevronDown size={18} className="hidden sm:block text-white/40 transition-transform group-open:rotate-180" />
                    </div>
                  </summary>

                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1 border-t border-white/10 flex flex-col gap-4">
                    {editando && form ? (
                      <div className="flex flex-col gap-3 sm:gap-4 pt-3 sm:pt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <CampoEditavel legenda="Título" value={form.titulo} onChange={(v) => setForm({ ...form, titulo: v })} />
                          <CampoEditavel legenda="Local" value={form.local} onChange={(v) => setForm({ ...form, local: v })} />
                          <CampoEditavel legenda="Data" value={form.data} onChange={(v) => setForm({ ...form, data: v })} />
                        </div>
                        <CampoEditavel legenda="Descrição" value={form.descricao} onChange={(v) => setForm({ ...form, descricao: v })} multiline />
                        <div className="flex gap-2 sm:gap-3">
                          <button type="button" disabled={isPending} onClick={() => guardarEdicao(evento.id)} className="rounded-full bg-primary hover:bg-[var(--primary-hover)] px-5 py-2 text-sm font-semibold text-white transition-all disabled:opacity-50 cursor-pointer">
                            Guardar
                          </button>
                          <button type="button" disabled={isPending} onClick={cancelarEdicao} className="rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-white/70 hover:text-white hover:border-white/30 transition-all disabled:opacity-50 cursor-pointer">
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5 pt-3 sm:pt-4">
                          <Campo legenda="Local" valor={evento.local} />
                          <Campo legenda="Data" valor={evento.data} />
                          <Campo legenda="Descrição" valor={evento.descricao || "—"} />
                        </div>
                        <button
                          type="button"
                          onClick={() => iniciarEdicao(evento)}
                          className="self-start flex items-center gap-2 rounded-full border border-primary/50 text-primary hover:bg-primary/10 px-5 py-2 text-sm font-semibold transition-all cursor-pointer"
                        >
                          <Pencil size={14} /> Editar
                        </button>
                      </>
                    )}

                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-white/40">Fotos</span>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-2">
                        {evento.fotos.map((url, i) => {
                          const ehCapa = url === evento.capaUrl;
                          return (
                            <div key={url + i} className="relative aspect-square rounded-md overflow-hidden border border-white/15 group/foto">
                              <Image src={url} alt="" fill sizes="100px" className="object-cover" />
                              {ehCapa && (
                                <span className="absolute top-1 left-1 flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white" title="Foto de capa">
                                  <Star size={11} fill="currentColor" />
                                </span>
                              )}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/foto:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                                {!ehCapa && (
                                  <button
                                    type="button"
                                    disabled={isPending}
                                    title="Usar como capa"
                                    aria-label="Usar como capa"
                                    onClick={() => onEscolherCapa(evento.id, url)}
                                    className="flex items-center justify-center w-7 h-7 rounded-full bg-white/90 text-black hover:bg-white transition-all disabled:opacity-50 cursor-pointer"
                                  >
                                    <Star size={13} />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  disabled={isPending}
                                  title="Apagar foto"
                                  aria-label="Apagar foto"
                                  onClick={() => onApagarFoto(evento.id, url)}
                                  className="flex items-center justify-center w-7 h-7 rounded-full bg-red-500/90 text-white hover:bg-red-500 transition-all disabled:opacity-50 cursor-pointer"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        <input
                          ref={(el) => {
                            addFotoRefs.current[evento.id] = el;
                          }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const ficheiro = e.target.files?.[0];
                            e.target.value = "";
                            if (ficheiro) onAdicionarFoto(evento.id, ficheiro);
                          }}
                        />
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => addFotoRefs.current[evento.id]?.click()}
                          className="aspect-square rounded-md border border-dashed border-white/25 text-white/50 hover:text-white hover:border-white/40 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center"
                          title="Adicionar foto"
                        >
                          <ImagePlus size={20} />
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => onApagarEvento(evento)}
                      className="self-start flex items-center gap-2 rounded-full border border-red-400/50 text-red-400 hover:bg-red-400/10 px-5 py-2 text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer mt-1"
                    >
                      <Trash2 size={14} /> Apagar evento
                    </button>
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      )}
      {dialogHost}
    </div>
  );
}
