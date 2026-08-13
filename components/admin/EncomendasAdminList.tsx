"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { ChevronDown, Trash2, CircleCheck, Truck, PackageCheck, Check, Search } from "lucide-react";
import type { orders, orderItems } from "@/lib/db/schema";
import { formatarPreco } from "@/lib/produtos";
import { apagarEncomendaAdmin, forcarPagoAdmin, marcarEnviadoAdmin } from "@/app/actions/admin";
import { useConfirmDialog } from "@/components/admin/ConfirmDialog";

export type EncomendaAdmin = typeof orders.$inferSelect & { items: (typeof orderItems.$inferSelect)[] };

const ESTADO_LABEL: Record<EncomendaAdmin["status"], string> = {
  pendente: "Pagamento pendente",
  pago: "Pago",
  enviado: "Enviado",
  cancelado: "Cancelado",
  expirado: "Expirado",
};

const ESTADO_CLASSE: Record<EncomendaAdmin["status"], string> = {
  pendente: "bg-yellow-400/15 text-yellow-400",
  pago: "bg-white/15 text-white/90",
  enviado: "bg-emerald-400/15 text-emerald-400",
  cancelado: "bg-red-400/15 text-red-400",
  expirado: "bg-red-400/15 text-red-400",
};

// width/height = dimensões reais dos ficheiros (mesmo padrão do
// CheckoutForm.tsx) — o tamanho visual é controlado via className (h-* w-auto),
// mantendo a proporção nativa de cada logo (Multibanco é vertical, MB WAY e
// Cartão são mais próximos de quadrado/horizontal).
const PAGAMENTO_LOGO: Record<string, { src: string; alt: string; width: number; height: number }> = {
  multibanco: { src: "/pagamento/Multibanco.png", alt: "Multibanco", width: 1920, height: 2268 },
  mbway: { src: "/pagamento/Mbway.png", alt: "MB WAY", width: 1280, height: 622 },
  cartao: { src: "/pagamento/card.webp", alt: "Cartão", width: 400, height: 400 },
};

function formatDataHora(data: Date | string | null): string {
  if (!data) return "—";
  return new Date(data).toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// Texto do estado logístico — só fica acionável depois de pago (antes disso
// não faz sentido falar em enviar/combinar entrega de algo ainda não pago).
function textoEntrega(encomenda: EncomendaAdmin): string {
  const paraEnvio = encomenda.metodoEntrega === "envio";
  if (encomenda.status === "enviado") return paraEnvio ? "Enviado" : "Entregue";
  if (encomenda.status === "pago") return paraEnvio ? "É necessário enviar" : "Necessário combinar entrega";
  return paraEnvio ? "Envio" : "Levantamento";
}

// Bloco "legenda por cima" — pequena e discreta em cima, valor maior e claro
// por baixo. Reutilizado para todos os campos de detalhe do painel.
function Campo({ legenda, valor }: { legenda: string; valor: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-white/40">{legenda}</span>
      {/* break-words — sem isto, um email comprido não quebra (não tem
          espaços) e transborda por cima da célula ao lado no grid. */}
      <span className="text-sm text-white/90 break-words">{valor}</span>
    </div>
  );
}

function classePill(ativo: boolean): string {
  return `shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold transition-all cursor-pointer border whitespace-nowrap ${
    ativo
      ? "bg-primary border-primary text-white shadow-[0_0_10px_rgba(var(--primary-rgb),0.4)]"
      : "bg-white/5 border-white/15 text-white/70 hover:border-white/30 hover:text-white"
  }`;
}

// "Todos" tem borda tracejada quando inativo (distingue-se visualmente dos
// valores concretos) e fica preenchido a laranja quando ativo, tal como os
// outros — o destaque pedido é sobretudo notar-se que é a opção de "reset"
// (limpa a seleção do grupo todo).
function classePillTodos(ativo: boolean): string {
  return `shrink-0 rounded-full px-2 py-0.5 text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${
    ativo
      ? "bg-primary border-primary text-white shadow-[0_0_10px_rgba(var(--primary-rgb),0.4)]"
      : "border-dashed border-white/30 text-white/80 hover:border-white/50"
  }`;
}

function alternar<T>(conjunto: Set<T>, valor: T): Set<T> {
  const novo = new Set(conjunto);
  if (novo.has(valor)) novo.delete(valor);
  else novo.add(valor);
  return novo;
}

// "#" opcional no início (o painel mostra o nº de encomenda como "#a1b2c3d4")
// para que colar/escrever com ou sem cardinal encontre a mesma encomenda.
function correspondePesquisa(encomenda: EncomendaAdmin, termo: string): boolean {
  const termoId = termo.startsWith("#") ? termo.slice(1) : termo;
  return (
    encomenda.nome.toLowerCase().includes(termo) ||
    encomenda.email.toLowerCase().includes(termo) ||
    encomenda.telefone.toLowerCase().includes(termo) ||
    encomenda.id.toLowerCase().includes(termoId)
  );
}

// Dropdown de filtro para mobile — <details> nativo (sem estado React extra),
// o atributo "name" partilhado faz os 3 fecharem-se uns aos outros ao abrir
// um novo (comportamento nativo do HTML, sem JS). Substitui as pills em
// scroll horizontal, que o utilizador achou confusas no telemóvel.
function FiltroDropdown<T extends string>({
  label,
  opcoes,
  selecionados,
  onAlternar,
  onLimpar,
}: {
  label: string;
  opcoes: { valor: T; texto: string }[];
  selecionados: Set<T>;
  onAlternar: (valor: T) => void;
  onLimpar: () => void;
}) {
  return (
    <details name="filtro-mobile" className="group relative">
      <summary className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 cursor-pointer list-none whitespace-nowrap">
        {label}
        {selecionados.size > 0 && <span className="text-primary">({selecionados.size})</span>}
        <ChevronDown size={12} className="text-white/40 transition-transform group-open:rotate-180" />
      </summary>
      <div className="absolute z-20 mt-2 flex flex-col gap-0.5 rounded-lg border border-white/15 bg-[#141414] p-1.5 shadow-xl min-w-44 max-h-64 overflow-y-auto">
        <button
          type="button"
          onClick={onLimpar}
          className={`rounded-md px-3 py-2 text-sm text-left font-bold cursor-pointer ${
            selecionados.size === 0 ? "text-primary" : "text-white/60 hover:bg-white/5"
          }`}
        >
          Todos
        </button>
        {opcoes.map((opcao) => {
          const ativo = selecionados.has(opcao.valor);
          return (
            <button
              key={opcao.valor}
              type="button"
              onClick={() => onAlternar(opcao.valor)}
              className={`flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm text-left cursor-pointer ${
                ativo ? "bg-primary/15 text-primary font-semibold" : "text-white/70 hover:bg-white/5"
              }`}
            >
              {opcao.texto}
              {ativo && <Check size={14} />}
            </button>
          );
        })}
      </div>
    </details>
  );
}

export default function EncomendasAdminList({ encomendas }: { encomendas: EncomendaAdmin[] }) {
  const { confirmar, pedirTexto, perguntar, host: dialogHost } = useConfirmDialog();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Conjunto vazio = "Todos" (sem filtro aplicado nesse grupo) — permite
  // selecionar vários valores em simultâneo dentro do mesmo grupo.
  const [filtroEstados, setFiltroEstados] = useState<Set<EncomendaAdmin["status"]>>(new Set());
  const [filtroEntregas, setFiltroEntregas] = useState<Set<EncomendaAdmin["metodoEntrega"]>>(new Set());
  const [filtroProdutos, setFiltroProdutos] = useState<Set<string>>(new Set());
  const [pesquisa, setPesquisa] = useState("");

  // Produtos para o dropdown — derivados das próprias encomendas (não do
  // catálogo completo), para o filtro só mostrar o que já foi mesmo
  // comprado.
  const produtosDisponiveis = useMemo(() => {
    const mapa = new Map<string, string>();
    for (const encomenda of encomendas) {
      for (const item of encomenda.items) mapa.set(item.produtoId, item.nome);
    }
    return [...mapa.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [encomendas]);

  const pesquisaNormalizada = pesquisa.trim().toLowerCase();

  const encomendasFiltradas = useMemo(() => {
    return encomendas.filter((encomenda) => {
      if (filtroEstados.size > 0 && !filtroEstados.has(encomenda.status)) return false;
      if (filtroEntregas.size > 0 && !filtroEntregas.has(encomenda.metodoEntrega)) return false;
      if (filtroProdutos.size > 0 && !encomenda.items.some((item) => filtroProdutos.has(item.produtoId))) return false;
      if (pesquisaNormalizada && !correspondePesquisa(encomenda, pesquisaNormalizada)) return false;
      return true;
    });
  }, [encomendas, filtroEstados, filtroEntregas, filtroProdutos, pesquisaNormalizada]);

  // Número fixo por encomenda (a mais antiga de sempre é a #1), não a
  // posição na lista filtrada — senão o número mudava consoante o filtro
  // ativo, e a lista mostra-se mais recente primeiro, por isso a #1 aparece
  // lá em baixo.
  const numeroPorId = useMemo(() => {
    const porAntiguidade = [...encomendas].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const mapa = new Map<string, number>();
    porAntiguidade.forEach((encomenda, i) => mapa.set(encomenda.id, i + 1));
    return mapa;
  }, [encomendas]);

  const executar = (id: string, acao: () => Promise<void>) => {
    setErro(null);
    setPendingId(id);
    startTransition(async () => {
      try {
        await acao();
      } catch {
        setErro("Não foi possível completar a ação. Tenta outra vez.");
      } finally {
        setPendingId(null);
      }
    });
  };

  const onForcarPago = async (encomenda: EncomendaAdmin) => {
    const confirmado = await confirmar(
      `Forçar a encomenda #${encomenda.id.slice(0, 8)} para PAGO?\n\nIsto vai enviar ao cliente o email de confirmação com recibo, e a notificação interna, tal como aconteceria automaticamente. Não podes desfazer isto.`,
      "emerald"
    );
    if (!confirmado) return;
    executar(encomenda.id, () => forcarPagoAdmin(encomenda.id));
  };

  const onApagar = async (encomenda: EncomendaAdmin) => {
    const confirmado = await confirmar(
      `Apagar definitivamente a encomenda #${encomenda.id.slice(0, 8)}? Esta ação não pode ser desfeita.`,
      "red"
    );
    if (!confirmado) return;
    executar(encomenda.id, () => apagarEncomendaAdmin(encomenda.id));
  };

  const onMarcarEnviado = async (encomenda: EncomendaAdmin) => {
    const acao = encomenda.metodoEntrega === "envio" ? "ENVIADA" : "ENTREGUE";

    // Pergunta pelo rastreio antes da confirmação final (não depois), para
    // este poder aparecer já resumido nela — só faz sentido para envio
    // (levantamento em mão não tem). "Não" segue sem código; "Cancelar" é
    // diferente — aborta a ação toda, não marca a encomenda como enviada.
    let codigoRastreio: string | null = null;
    if (encomenda.metodoEntrega === "envio") {
      const temRastreio = await perguntar("Tem código de rastreio?");
      if (temRastreio === null) return;
      if (temRastreio === "sim") {
        codigoRastreio = await pedirTexto("Código de rastreio:");
      }
    }

    const confirmado = await confirmar(
      `Marcar a encomenda #${encomenda.id.slice(0, 8)} como ${acao}?` +
        (codigoRastreio ? `\n\nCódigo de rastreio: ${codigoRastreio}` : "")
    );
    if (!confirmado) return;

    executar(encomenda.id, () => marcarEnviadoAdmin(encomenda.id, codigoRastreio));
  };

  // Cada grupo devolve as pills de fresco em cada chamada — chamadas duas
  // vezes (bloco mobile e bloco desktop, ver return) para gerar duas árvores
  // de elementos independentes em vez de reutilizar a mesma instância.
  const pillsEstado = () => (
    <>
      <button type="button" className={classePillTodos(filtroEstados.size === 0)} onClick={() => setFiltroEstados(new Set())}>
        Todos
      </button>
      {Object.entries(ESTADO_LABEL).map(([valor, label]) => (
        <button
          key={valor}
          type="button"
          className={classePill(filtroEstados.has(valor as EncomendaAdmin["status"]))}
          onClick={() => setFiltroEstados((atual) => alternar(atual, valor as EncomendaAdmin["status"]))}
        >
          {label}
        </button>
      ))}
    </>
  );

  const pillsEntrega = () => (
    <>
      <button type="button" className={classePillTodos(filtroEntregas.size === 0)} onClick={() => setFiltroEntregas(new Set())}>
        Todos
      </button>
      <button type="button" className={classePill(filtroEntregas.has("envio"))} onClick={() => setFiltroEntregas((atual) => alternar(atual, "envio"))}>
        Envio
      </button>
      <button
        type="button"
        className={classePill(filtroEntregas.has("levantamento"))}
        onClick={() => setFiltroEntregas((atual) => alternar(atual, "levantamento"))}
      >
        Levantamento
      </button>
    </>
  );

  const pillsProduto = () => (
    <>
      <button type="button" className={classePillTodos(filtroProdutos.size === 0)} onClick={() => setFiltroProdutos(new Set())}>
        Todos
      </button>
      {produtosDisponiveis.map(([produtoId, nome]) => (
        <button
          key={produtoId}
          type="button"
          className={classePill(filtroProdutos.has(produtoId))}
          onClick={() => setFiltroProdutos((atual) => alternar(atual, produtoId))}
        >
          {nome}
        </button>
      ))}
    </>
  );

  if (encomendas.length === 0) {
    return <p className="text-white/60 text-base">Ainda não há encomendas.</p>;
  }

  return (
    <div>
      <div className="relative mb-4 sm:mb-6">
        <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          placeholder="Pesquisar por nome, email, telefone ou nº de encomenda..."
          className="w-full rounded-full border border-white/15 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-colors"
        />
      </div>

      {/* Mobile: 3 dropdowns compactos em vez de pills — cada um abre a
          lista de opções por cima do conteúdo em baixo. */}
      <div className="flex items-center gap-2 mb-6 sm:hidden">
        <FiltroDropdown
          label="Estado"
          opcoes={Object.entries(ESTADO_LABEL).map(([valor, texto]) => ({ valor: valor as EncomendaAdmin["status"], texto }))}
          selecionados={filtroEstados}
          onAlternar={(valor) => setFiltroEstados((atual) => alternar(atual, valor))}
          onLimpar={() => setFiltroEstados(new Set())}
        />
        <FiltroDropdown
          label="Entrega"
          opcoes={[
            { valor: "envio" as EncomendaAdmin["metodoEntrega"], texto: "Envio" },
            { valor: "levantamento" as EncomendaAdmin["metodoEntrega"], texto: "Levantamento" },
          ]}
          selecionados={filtroEntregas}
          onAlternar={(valor) => setFiltroEntregas((atual) => alternar(atual, valor))}
          onLimpar={() => setFiltroEntregas(new Set())}
        />
        {produtosDisponiveis.length > 0 && (
          <FiltroDropdown
            label="Produto"
            opcoes={produtosDisponiveis.map(([valor, texto]) => ({ valor, texto }))}
            selecionados={filtroProdutos}
            onAlternar={(valor) => setFiltroProdutos((atual) => alternar(atual, valor))}
            onLimpar={() => setFiltroProdutos(new Set())}
          />
        )}
      </div>

      {/* Desktop: tudo numa linha só, como já estava — ml para alinhar com
          o card das encomendas em baixo (não com o número de índice). */}
      {/* Sem ml a alinhar com o card (como estava antes) — a fila precisa da
          largura toda, igual à barra de pesquisa em cima, senão parte para
          uma segunda linha assim que há mais de um filtro de produto. */}
      <div className="hidden sm:flex sm:flex-wrap sm:items-center gap-1.5 mb-8">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-white/40 shrink-0">Estado</span>
        {pillsEstado()}

        <span className="w-px h-4 bg-white/10 mx-0.5" />

        <span className="text-[11px] font-semibold uppercase tracking-wide text-white/40 shrink-0">Entrega</span>
        {pillsEntrega()}

        {produtosDisponiveis.length > 0 && (
          <>
            <span className="w-px h-4 bg-white/10 mx-0.5" />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-white/40 shrink-0">Produto</span>
            {pillsProduto()}
          </>
        )}
      </div>

      {erro && <p className="text-base text-red-400 mb-4">{erro}</p>}
      {encomendasFiltradas.length === 0 ? (
        <p className="text-white/60 text-base">Nenhuma encomenda encontrada com estes filtros.</p>
      ) : (
      <ul className="flex flex-col gap-4">
        {encomendasFiltradas.map((encomenda) => {
          const aProcessar = isPending && pendingId === encomenda.id;
          const numero = numeroPorId.get(encomenda.id) ?? 0;
          return (
            <li key={encomenda.id} className="flex items-start gap-2 sm:gap-3">
              <span className="shrink-0 w-9 sm:w-16 pt-2.5 sm:pt-3 text-right text-lg sm:text-3xl font-extrabold text-primary drop-shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)] whitespace-nowrap">
                {String(numero).padStart(2, "0")}#
              </span>
              <div className="flex-1 min-w-0 rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
              <details className="group">
                <summary className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-2 sm:gap-x-6 sm:gap-y-3 px-4 sm:px-5 py-4 cursor-pointer list-none hover:bg-white/[0.03] transition-colors">
                  {/* No mobile, nome/data + seta ficam na mesma linha (sm:contents
                      "dissolve" este wrapper no desktop, onde a seta já vive lá
                      em baixo junto dos badges, como sempre esteve). */}
                  <div className="flex items-start justify-between gap-3 sm:contents">
                    <div className="min-w-0">
                      <p className="text-white/95 text-base font-semibold truncate">{encomenda.nome}</p>
                      <p className="text-white/50 text-sm">{formatDataHora(encomenda.createdAt)}</p>
                    </div>
                    <ChevronDown size={18} className="sm:hidden shrink-0 mt-1 text-white/40 transition-transform group-open:rotate-180" />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 sm:shrink-0 sm:ml-auto">
                    {PAGAMENTO_LOGO[encomenda.metodoPagamento] ? (
                      // Fundo claro atrás do logo — os PNGs (Multibanco/MB WAY) são
                      // pensados para um fundo claro, tal como no CheckoutForm.tsx.
                      <span className="flex items-center rounded-sm bg-[#f8f0d9] px-2 py-1">
                        <Image
                          src={PAGAMENTO_LOGO[encomenda.metodoPagamento].src}
                          alt={PAGAMENTO_LOGO[encomenda.metodoPagamento].alt}
                          width={PAGAMENTO_LOGO[encomenda.metodoPagamento].width}
                          height={PAGAMENTO_LOGO[encomenda.metodoPagamento].height}
                          className="h-5 w-auto object-contain"
                        />
                      </span>
                    ) : (
                      <span className="text-white/70 text-sm">{encomenda.metodoPagamento}</span>
                    )}
                    <span className="flex items-center gap-2">
                      <span
                        className={
                          encomenda.status === "pago"
                            ? "text-amber-400 text-sm font-semibold px-2.5 py-1 rounded-full bg-amber-400/10"
                            : "text-white/70 text-sm"
                        }
                      >
                        {textoEntrega(encomenda)}
                      </span>
                      {encomenda.status === "pago" && (
                        <button
                          type="button"
                          disabled={aProcessar}
                          onClick={(e) => {
                            e.preventDefault();
                            onMarcarEnviado(encomenda);
                          }}
                          className="flex items-center gap-1.5 rounded-full border border-primary/50 text-primary hover:bg-primary/10 px-3 py-1 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {encomenda.metodoEntrega === "envio" ? <Truck size={13} /> : <PackageCheck size={13} />}
                          {encomenda.metodoEntrega === "envio" ? "Marcar enviado" : "Marcar como entregue"}
                        </button>
                      )}
                    </span>
                    <span className="text-white/95 text-base font-bold">{formatarPreco(encomenda.totalCentimos / 100)}</span>
                    <span className={`text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full ${ESTADO_CLASSE[encomenda.status]}`}>
                      {ESTADO_LABEL[encomenda.status]}
                    </span>
                    <ChevronDown size={18} className="hidden sm:block text-white/40 transition-transform group-open:rotate-180" />
                  </div>
                </summary>

                <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1 flex flex-col gap-3 sm:gap-5 border-t border-white/10">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5 pt-3 sm:pt-4">
                    <Campo legenda="Email" valor={encomenda.email} />
                    <Campo legenda="Telefone" valor={encomenda.telefone} />
                    <Campo legenda="Data de pagamento" valor={formatDataHora(encomenda.paidAt)} />
                    <Campo legenda="Nº encomenda" valor={`#${encomenda.id.slice(0, 8)}`} />
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-white/40">Itens</span>
                    <ul className="flex flex-col gap-1 mt-1.5">
                      {encomenda.items.map((item) => (
                        <li key={item.id} className="text-white/80 text-sm">
                          {item.quantidade}× {item.nome}
                          {(item.cor || item.tamanho) && (
                            <span className="text-white/40"> · {[item.cor, item.tamanho].filter(Boolean).join(" · ")}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {encomenda.metodoEntrega === "envio" ? (
                    encomenda.moradaLinha && (
                      <Campo legenda="Morada de entrega" valor={`${encomenda.moradaLinha}, ${encomenda.codigoPostal} ${encomenda.cidade}`} />
                    )
                  ) : (
                    <Campo legenda="Entrega" valor="Levantamento em mão — combinar por telefone/email acima." />
                  )}

                  {encomenda.codigoRastreio && <Campo legenda="Código de rastreio" valor={encomenda.codigoRastreio} />}

                  {encomenda.metodoPagamento === "multibanco" && encomenda.referenciaMbEntidade && encomenda.referenciaMbNumero && (
                    <div className="grid grid-cols-2 gap-3 sm:gap-5">
                      <Campo legenda="Entidade" valor={encomenda.referenciaMbEntidade} />
                      <Campo legenda="Referência" valor={encomenda.referenciaMbNumero} />
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 sm:gap-3 pt-2 sm:pt-3 border-t border-white/10">
                    {encomenda.status !== "pago" && encomenda.status !== "enviado" && (
                      <button
                        type="button"
                        disabled={aProcessar}
                        onClick={() => onForcarPago(encomenda)}
                        className="flex items-center gap-2 rounded-full border border-emerald-400/50 text-emerald-400 hover:bg-emerald-400/10 px-5 py-2 text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer"
                      >
                        <CircleCheck size={16} /> Forçar pago
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={aProcessar}
                      onClick={() => onApagar(encomenda)}
                      className="flex items-center gap-2 rounded-full border border-red-400/50 text-red-400 hover:bg-red-400/10 px-5 py-2 text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <Trash2 size={16} /> Apagar
                    </button>
                  </div>
                </div>
              </details>
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
