"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { ChevronDown, Pencil, Trash2, ImagePlus, Star, Plus, X } from "lucide-react";
import type { Produto } from "@/lib/produtos";
import { formatarPreco } from "@/lib/preco";
import {
  criarProdutoAdmin,
  atualizarProdutoAdmin,
  definirDisponivelProdutoAdmin,
  adicionarFotoProdutoAdmin,
  apagarFotoProdutoAdmin,
  escolherCapaProdutoAdmin,
  apagarProdutoAdmin,
} from "@/app/actions/admin-produtos";
import { useConfirmDialog } from "@/components/admin/ConfirmDialog";

function Campo({ legenda, valor }: { legenda: string; valor: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-white/40">{legenda}</span>
      <span className="text-sm text-white/90 break-words">{valor}</span>
    </div>
  );
}

function CampoEditavel({
  legenda,
  value,
  onChange,
  multiline = false,
  type = "text",
  className = "",
}: {
  legenda: string;
  value: string;
  onChange: (valor: string) => void;
  multiline?: boolean;
  type?: string;
  className?: string;
}) {
  const classeCampo =
    "w-full rounded-md bg-white/5 border border-white/15 px-2.5 py-1.5 text-sm text-white/90 focus:outline-none focus:border-primary";
  return (
    <div className={`flex flex-col gap-1 min-w-0 ${className}`}>
      <label className="text-[11px] font-semibold uppercase tracking-widest text-white/40">{legenda}</label>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} className={classeCampo} />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={classeCampo} />
      )}
    </div>
  );
}

// Tag-input simples: escrever + Enter adiciona, × remove. Usado para as
// variantes de cor/tamanho — só aparece quando o checkbox correspondente
// está marcado.
function TagsInput({ valores, onChange }: { valores: string[]; onChange: (valores: string[]) => void }) {
  const [texto, setTexto] = useState("");

  const adicionar = () => {
    const v = texto.trim();
    if (v && !valores.includes(v)) onChange([...valores, v]);
    setTexto("");
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-md bg-white/5 border border-white/15 px-2 py-1.5 min-h-9">
      {valores.map((v) => (
        <span key={v} className="flex items-center gap-1 rounded-full bg-primary/20 text-primary text-xs font-semibold px-2 py-0.5">
          {v}
          <button type="button" onClick={() => onChange(valores.filter((x) => x !== v))} className="hover:text-white cursor-pointer">
            <X size={11} />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            adicionar();
          }
        }}
        placeholder="Escreve e Enter..."
        className="flex-1 min-w-24 bg-transparent text-sm text-white/90 placeholder:text-white/30 focus:outline-none py-0.5"
      />
    </div>
  );
}

function VariantesEditor({
  temCores,
  setTemCores,
  cores,
  setCores,
  temTamanhos,
  setTemTamanhos,
  tamanhos,
  setTamanhos,
}: {
  temCores: boolean;
  setTemCores: (v: boolean) => void;
  cores: string[];
  setCores: (v: string[]) => void;
  temTamanhos: boolean;
  setTemTamanhos: (v: boolean) => void;
  tamanhos: string[];
  setTamanhos: (v: string[]) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="flex flex-col gap-1.5">
        <label className="flex items-center gap-2 text-sm text-white/80 cursor-pointer">
          <input type="checkbox" checked={temCores} onChange={(e) => setTemCores(e.target.checked)} className="accent-primary cursor-pointer" />
          Tem cores?
        </label>
        {temCores && <TagsInput valores={cores} onChange={setCores} />}
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="flex items-center gap-2 text-sm text-white/80 cursor-pointer">
          <input type="checkbox" checked={temTamanhos} onChange={(e) => setTemTamanhos(e.target.checked)} className="accent-primary cursor-pointer" />
          Tem tamanhos?
        </label>
        {temTamanhos && <TagsInput valores={tamanhos} onChange={setTamanhos} />}
      </div>
    </div>
  );
}

type FormProduto = { nome: string; categoria: string; descricao: string; preco: string };

export default function ProdutosAdminList({ produtos }: { produtos: Produto[] }) {
  const { confirmar, host: dialogHost } = useConfirmDialog();
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const addFotoRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<FormProduto | null>(null);
  const [editTemCores, setEditTemCores] = useState(false);
  const [editCores, setEditCores] = useState<string[]>([]);
  const [editTemTamanhos, setEditTemTamanhos] = useState(false);
  const [editTamanhos, setEditTamanhos] = useState<string[]>([]);

  const [aAdicionar, setAAdicionar] = useState(false);
  const [novoTemCores, setNovoTemCores] = useState(false);
  const [novoCores, setNovoCores] = useState<string[]>([]);
  const [novoTemTamanhos, setNovoTemTamanhos] = useState(false);
  const [novoTamanhos, setNovoTamanhos] = useState<string[]>([]);

  const iniciarEdicao = (produto: Produto) => {
    setErro(null);
    setEditandoId(produto.id);
    setForm({ nome: produto.nome, categoria: produto.categoria, descricao: produto.descricao, preco: produto.preco.toFixed(2) });
    setEditTemCores(!!produto.cores?.length);
    setEditCores(produto.cores ?? []);
    setEditTemTamanhos(!!produto.tamanhos?.length);
    setEditTamanhos(produto.tamanhos ?? []);
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setForm(null);
  };

  const guardarEdicao = (id: string) => {
    if (!form) return;
    const preco = Number(form.preco.replace(",", "."));
    setErro(null);
    startTransition(async () => {
      const resultado = await atualizarProdutoAdmin(id, {
        nome: form.nome,
        categoria: form.categoria,
        descricao: form.descricao,
        preco,
        cores: editTemCores ? editCores : null,
        tamanhos: editTemTamanhos ? editTamanhos : null,
      });
      if (resultado.error) {
        setErro(resultado.error);
        return;
      }
      setEditandoId(null);
      setForm(null);
    });
  };

  const onAlternarDisponivel = async (produto: Produto) => {
    const acao = produto.disponivel ? "marcar como esgotado" : "marcar como disponível";
    const confirmado = await confirmar(`Queres ${acao} "${produto.nome}"?`, "primary");
    if (!confirmado) return;
    startTransition(() => definirDisponivelProdutoAdmin(produto.id, !produto.disponivel));
  };

  const onAdicionarFoto = (id: string, ficheiro: File) => {
    const fd = new FormData();
    fd.set("foto", ficheiro);
    setErro(null);
    startTransition(async () => {
      const resultado = await adicionarFotoProdutoAdmin(id, fd);
      if (resultado.error) setErro(resultado.error);
    });
  };

  const onApagarFoto = async (produtoId: string, url: string) => {
    const confirmado = await confirmar("Apagar esta foto do produto?", "red");
    if (!confirmado) return;
    setErro(null);
    startTransition(async () => {
      const resultado = await apagarFotoProdutoAdmin(produtoId, url);
      if (resultado.error) setErro(resultado.error);
    });
  };

  const onEscolherCapa = (produtoId: string, url: string) => {
    setErro(null);
    startTransition(async () => {
      const resultado = await escolherCapaProdutoAdmin(produtoId, url);
      if (resultado.error) setErro(resultado.error);
    });
  };

  const onApagarProduto = async (produto: Produto) => {
    const confirmado = await confirmar(`Apagar o produto "${produto.nome}"? Esta ação não pode ser desfeita.`, "red");
    if (!confirmado) return;
    startTransition(() => apagarProdutoAdmin(produto.id));
  };

  const onCriar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const fd = new FormData(formEl);
    if (novoTemCores) fd.set("cores", JSON.stringify(novoCores));
    if (novoTemTamanhos) fd.set("tamanhos", JSON.stringify(novoTamanhos));
    setErro(null);
    startTransition(async () => {
      const resultado = await criarProdutoAdmin(fd);
      if (resultado.error) {
        setErro(resultado.error);
        return;
      }
      setAAdicionar(false);
      formEl.reset();
      setNovoTemCores(false);
      setNovoCores([]);
      setNovoTemTamanhos(false);
      setNovoTamanhos([]);
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
                <label className="text-[11px] font-semibold uppercase tracking-widest text-white/40">Nome</label>
                <input name="nome" type="text" required className="rounded-md bg-white/5 border border-white/15 px-2.5 py-1.5 text-sm text-white/90 focus:outline-none focus:border-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-white/40">Categoria</label>
                <input name="categoria" type="text" className="rounded-md bg-white/5 border border-white/15 px-2.5 py-1.5 text-sm text-white/90 focus:outline-none focus:border-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-white/40">Preço (€)</label>
                <input name="preco" type="text" required placeholder="5.00" className="rounded-md bg-white/5 border border-white/15 px-2.5 py-1.5 text-sm text-white/90 focus:outline-none focus:border-primary" />
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

            <VariantesEditor
              temCores={novoTemCores}
              setTemCores={setNovoTemCores}
              cores={novoCores}
              setCores={setNovoCores}
              temTamanhos={novoTemTamanhos}
              setTemTamanhos={setNovoTemTamanhos}
              tamanhos={novoTamanhos}
              setTamanhos={setNovoTamanhos}
            />

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
            <Plus size={16} /> Adicionar produto
          </button>
        )}
      </div>

      {produtos.length === 0 ? (
        <p className="text-white/60 text-base">Ainda não há produtos.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {produtos.map((produto) => {
            const editando = editandoId === produto.id;
            return (
              <li key={produto.id} className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
                <details className="group">
                  <summary className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-2 sm:gap-x-6 sm:gap-y-3 px-4 sm:px-5 py-4 cursor-pointer list-none hover:bg-white/[0.03] transition-colors">
                    <div className="flex items-start justify-between gap-3 sm:contents">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="shrink-0 w-12 h-12 rounded-md overflow-hidden border border-white/15 bg-white/10">
                          <Image src={produto.capaUrl} alt={produto.nome} width={48} height={48} className="w-full h-full object-cover" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-white/95 text-base font-semibold truncate">{produto.nome}</p>
                          <p className="text-white/50 text-sm truncate">{formatarPreco(produto.preco)}</p>
                        </div>
                      </div>
                      <ChevronDown size={18} className="sm:hidden shrink-0 mt-1 text-white/40 transition-transform group-open:rotate-180" />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 sm:shrink-0 sm:ml-auto">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={(e) => {
                          e.preventDefault();
                          onAlternarDisponivel(produto);
                        }}
                        className={`text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full transition-all disabled:opacity-50 cursor-pointer ${
                          produto.disponivel ? "bg-emerald-400/15 text-emerald-400 hover:bg-emerald-400/25" : "bg-red-400/15 text-red-400 hover:bg-red-400/25"
                        }`}
                      >
                        {produto.disponivel ? "Disponível" : "Esgotado"}
                      </button>
                      <ChevronDown size={18} className="hidden sm:block text-white/40 transition-transform group-open:rotate-180" />
                    </div>
                  </summary>

                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1 border-t border-white/10 flex flex-col gap-4">
                    {editando && form ? (
                      <div className="flex flex-col gap-3 sm:gap-4 pt-3 sm:pt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <CampoEditavel legenda="Nome" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} />
                          <CampoEditavel legenda="Categoria" value={form.categoria} onChange={(v) => setForm({ ...form, categoria: v })} />
                          <CampoEditavel legenda="Preço (€)" value={form.preco} onChange={(v) => setForm({ ...form, preco: v })} />
                        </div>
                        <CampoEditavel legenda="Descrição" value={form.descricao} onChange={(v) => setForm({ ...form, descricao: v })} multiline />

                        <VariantesEditor
                          temCores={editTemCores}
                          setTemCores={setEditTemCores}
                          cores={editCores}
                          setCores={setEditCores}
                          temTamanhos={editTemTamanhos}
                          setTemTamanhos={setEditTemTamanhos}
                          tamanhos={editTamanhos}
                          setTamanhos={setEditTamanhos}
                        />

                        <div className="flex gap-2 sm:gap-3">
                          <button type="button" disabled={isPending} onClick={() => guardarEdicao(produto.id)} className="rounded-full bg-primary hover:bg-[var(--primary-hover)] px-5 py-2 text-sm font-semibold text-white transition-all disabled:opacity-50 cursor-pointer">
                            Guardar
                          </button>
                          <button type="button" disabled={isPending} onClick={cancelarEdicao} className="rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-white/70 hover:text-white hover:border-white/30 transition-all disabled:opacity-50 cursor-pointer">
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5 pt-3 sm:pt-4">
                          <Campo legenda="Categoria" valor={produto.categoria || "—"} />
                          <Campo legenda="Descrição" valor={produto.descricao || "—"} />
                          <Campo legenda="Cores" valor={produto.cores?.length ? produto.cores.join(", ") : "—"} />
                          <Campo legenda="Tamanhos" valor={produto.tamanhos?.length ? produto.tamanhos.join(", ") : "—"} />
                        </div>
                        <button
                          type="button"
                          onClick={() => iniciarEdicao(produto)}
                          className="self-start flex items-center gap-2 rounded-full border border-primary/50 text-primary hover:bg-primary/10 px-5 py-2 text-sm font-semibold transition-all cursor-pointer"
                        >
                          <Pencil size={14} /> Editar
                        </button>
                      </>
                    )}

                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-white/40">Fotos</span>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-2">
                        {produto.fotos.map((url, i) => {
                          const ehCapa = url === produto.capaUrl;
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
                                    onClick={() => onEscolherCapa(produto.id, url)}
                                    className="flex items-center justify-center w-7 h-7 rounded-full bg-white/90 text-black hover:bg-white transition-all disabled:opacity-50 cursor-pointer"
                                  >
                                    <Star size={13} />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  disabled={isPending}
                                  title="Apagar foto"
                                  onClick={() => onApagarFoto(produto.id, url)}
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
                            addFotoRefs.current[produto.id] = el;
                          }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const ficheiro = e.target.files?.[0];
                            e.target.value = "";
                            if (ficheiro) onAdicionarFoto(produto.id, ficheiro);
                          }}
                        />
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => addFotoRefs.current[produto.id]?.click()}
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
                      onClick={() => onApagarProduto(produto)}
                      className="self-start flex items-center gap-2 rounded-full border border-red-400/50 text-red-400 hover:bg-red-400/10 px-5 py-2 text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer mt-1"
                    >
                      <Trash2 size={14} /> Apagar produto
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
