"use client";
import Image from "next/image";
import { LogOut, ChevronDown } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { atualizarPerfil, alterarPassword, pedirAlteracaoEmail, atualizarFoto, procurarSocio, apagarConta } from "@/app/actions/perfil";
import { terminarSessao } from "@/app/actions/auth";
import { getHighResAvatarUrl } from "@/lib/avatar";
import SubmitButton from "@/components/SubmitButton";
import type { users, orders, orderItems } from "@/lib/db/schema";
import type { QuotagestSocio } from "@/lib/quotagest";
import { formatarPreco } from "@/lib/produtos";

type User = typeof users.$inferSelect;

export type Encomenda = typeof orders.$inferSelect & { items: (typeof orderItems.$inferSelect)[] };

const ESTADO_LABEL: Record<Encomenda["status"], string> = {
  pendente: "Pendente",
  pago: "Pago",
  enviado: "Enviado",
  cancelado: "Cancelado",
  expirado: "Expirado",
};

const ESTADO_CLASSE: Record<Encomenda["status"], string> = {
  pendente: "text-yellow-400",
  pago: "text-white/90",
  enviado: "text-emerald-400",
  cancelado: "text-red-400",
  expirado: "text-red-400",
};

function formatDataEncomenda(data: Date): string {
  return data.toLocaleDateString("pt-PT", { year: "numeric", month: "long", day: "numeric" });
}

function getInitials(name?: string | null, email?: string | null): string {
  const source = name?.trim() || email?.trim() || "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function formatDataEntrada(dataEntrada: string | null): string {
  if (!dataEntrada) return "—";
  return new Date(dataEntrada).toLocaleDateString("pt-PT", { year: "numeric", month: "long", day: "numeric" });
}

export default function PerfilForm({ user, socio, encomendas }: { user: User; socio: QuotagestSocio | null; encomendas: Encomenda[] }) {
  const [state, action] = useActionState(atualizarPerfil, undefined);
  const [passwordState, passwordAction] = useActionState(alterarPassword, undefined);
  const [emailState, emailAction] = useActionState(pedirAlteracaoEmail, undefined);
  const [socioState, socioAction] = useActionState(procurarSocio, undefined);
  const [fotoState, fotoAction] = useActionState(atualizarFoto, undefined);
  const [apagarState, apagarAction] = useActionState(apagarConta, undefined);
  const [apagarConfirmacao, setApagarConfirmacao] = useState("");
  const initials = getInitials(user.name, user.email);
  const { update: updateSession } = useSession();

  // O JWT da sessão fica preso à foto do login (ver auth.ts) — depois de um
  // upload bem sucedido é preciso forçar o refresh para o Navbar deixar de
  // mostrar a foto/iniciais antigas.
  useEffect(() => {
    if (fotoState?.success) {
      updateSession();
    }
  }, [fotoState, updateSession]);

  return (
    <div className="w-full max-w-6xl pt-16 md:pt-28">
      {/* Cabeçalho — foto/nome/email centrados, a ocupar a largura toda por
          cima das 3 colunas (em vez de preso dentro da coluna esquerda). O
          border-b substitui os border-t que cada coluna tinha antes. */}
      <div className="flex flex-col items-center text-center gap-2 pb-6 border-b border-white/10">
        <span className="group/avatar relative shrink-0 w-20 h-20 rounded-full overflow-hidden border border-white/20">
          {user.image ? (
            <Image src={getHighResAvatarUrl(user.image)!} alt="" fill sizes="80px" className="object-cover" />
          ) : (
            <>
              <span className="w-full h-full flex items-center justify-center bg-white/10 text-white text-2xl font-bold">
                {initials}
              </span>
              <label
                htmlFor="foto-upload"
                className="absolute inset-0 flex items-center justify-center text-center px-1 bg-black/75 text-white text-[10px] font-semibold uppercase tracking-wide opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer"
              >
                Carregar foto
              </label>
              <form action={fotoAction}>
                <input
                  id="foto-upload"
                  name="foto"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.currentTarget.form?.requestSubmit()}
                />
              </form>
            </>
          )}
        </span>
        <div>
          <h1 className="text-3xl font-bold text-[#f8f0d9]">{user.name || "A tua conta"}</h1>
          <p className="text-white/60 text-base">{user.email}</p>
          {fotoState?.error && <p className="text-sm text-red-400 mt-1">{fotoState.error}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[0.8fr_1fr_1.3fr] gap-10 items-start pt-8">
        {/* Coluna 1 — Área do Sócio */}
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-base uppercase tracking-widest text-primary font-bold mb-3">Área do Sócio</h2>
            {socio ? (
              <dl className="space-y-2 text-base">
                <div className="flex justify-between gap-4">
                  <dt className="text-white/60">{socio.numeroSocio ? "Número de sócio" : "Categoria"}</dt>
                  <dd className="text-white/90">{socio.numeroSocio ? `Nº ${socio.numeroSocio}` : "Sócio Fundador"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-white/60">Sócio desde</dt>
                  <dd className="text-white/90">{formatDataEntrada(socio.dataEntrada)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-white/60">Estado</dt>
                  <dd className="text-white/90">{socio.estado}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-white/60">NIF</dt>
                  <dd className="text-white/90">{socio.nif}</dd>
                </div>
                {socio.grupoSanguineo && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-white/60">Grupo sanguíneo</dt>
                    <dd className="text-white/90">{socio.grupoSanguineo}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <dt className="text-white/60">Estado da quota</dt>
                  <dd className={socio.quotaEmDia ? "text-white/90" : "text-red-400"}>
                    {socio.quotaEmDia ? "Em dia" : `Em atraso — ${formatarPreco(socio.divida)}`}
                  </dd>
                </div>
              </dl>
            ) : null}
            {socio && !socio.quotaEmDia && (
              <details className="group mt-3">
                <summary className="text-sm font-semibold text-primary/80 hover:text-primary cursor-pointer list-none flex items-center gap-1.5 w-fit">
                  Ver referência de pagamento
                  <ChevronDown size={16} className="transition-transform group-open:rotate-180" />
                </summary>
                {socio.referenciaPendente ? (
                  <div className="text-sm text-white/70 space-y-1 border-t border-white/10 pt-2 mt-2">
                    <p>Referente a <span className="text-white/90 font-semibold">{socio.referenciaPendente.descricao}</span></p>
                    <p>Entidade <span className="text-white/90 font-semibold">{socio.referenciaPendente.entidade}</span></p>
                    <p>Referência <span className="text-white/90 font-semibold">{socio.referenciaPendente.referencia}</span></p>
                    <p>Valor <span className="text-white/90 font-semibold">{formatarPreco(socio.referenciaPendente.valor)}</span></p>
                  </div>
                ) : (
                  <p className="text-sm text-white/40 italic border-t border-white/10 pt-2 mt-2">
                    Ainda não há referência de pagamento gerada para {socio.descricoesPendentes.join(", ") || "esta cota"}. Contacta a associação.
                  </p>
                )}
                <p className="text-xs text-white/40 italic border-t border-white/10 pt-2 mt-2">
                  Depois de pagares, pode demorar até 48 horas até o site regularizar a tua situação.
                </p>
              </details>
            )}
            {!socio && (
              <div>
                <p className="text-sm text-white/40 italic">
                  Não encontrámos uma inscrição de sócio associada a este email.
                </p>
                <details className="group mt-2">
                  <summary className="text-sm text-primary/80 hover:text-primary cursor-pointer list-none underline underline-offset-2 w-fit">
                    És sócio e não aparece?
                  </summary>
                  <form action={socioAction} className="flex flex-col gap-3 mt-3">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="codigoOuNif" className="text-base text-white/70">Número de sócio ou NIF</label>
                      <input id="codigoOuNif" name="codigoOuNif" type="text" required
                        className="rounded-md bg-white/5 border border-white/15 px-4 py-2.5 text-white focus:outline-none focus:border-primary" />
                    </div>
                    {socioState?.error && <p className="text-sm text-red-400">{socioState.error}</p>}
                    {socioState?.success && (
                      <p className="text-sm text-primary">
                        Enviámos um email de confirmação para o endereço registado nesse sócio. Confirma lá a associação.
                      </p>
                    )}
                    <SubmitButton
                      pendingText="A procurar..."
                      className="self-start rounded-full bg-primary px-6 py-3 font-semibold text-white hover:bg-[var(--primary-hover)] transition-all cursor-pointer"
                    >
                      Procurar
                    </SubmitButton>
                  </form>
                </details>
              </div>
            )}
          </div>
        </div>

        {/* Coluna 2 — Ações da conta (colapsáveis) + Histórico de encomendas por baixo. */}
        <div className="flex flex-col gap-4">
          {user.passwordHash && (
            <details className="group">
              <summary className="text-base uppercase tracking-widest text-primary font-bold cursor-pointer list-none flex items-center justify-between">
                Alterar password
                <ChevronDown size={18} className="transition-transform group-open:rotate-180" />
              </summary>
              <form action={passwordAction} className="flex flex-col gap-4 mt-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="passwordAtual" className="text-base text-white/70">Password atual</label>
                <input id="passwordAtual" name="passwordAtual" type="password" required autoComplete="current-password"
                  className="rounded-md bg-white/5 border border-white/15 px-4 py-2.5 text-white focus:outline-none focus:border-primary" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="novaPassword" className="text-base text-white/70">Nova password</label>
                <input id="novaPassword" name="novaPassword" type="password" required minLength={8} autoComplete="new-password"
                  className="rounded-md bg-white/5 border border-white/15 px-4 py-2.5 text-white focus:outline-none focus:border-primary" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="confirmarPassword" className="text-base text-white/70">Confirmar nova password</label>
                <input id="confirmarPassword" name="confirmarPassword" type="password" required minLength={8} autoComplete="new-password"
                  className="rounded-md bg-white/5 border border-white/15 px-4 py-2.5 text-white focus:outline-none focus:border-primary" />
              </div>
              {passwordState?.error && <p className="text-sm text-red-400">{passwordState.error}</p>}
              {passwordState?.success && <p className="text-sm text-primary">Password alterada.</p>}
              <SubmitButton
                pendingText="A guardar..."
                className="self-start rounded-full bg-primary px-6 py-3 font-semibold text-white hover:bg-[var(--primary-hover)] transition-all cursor-pointer"
              >
                Alterar password
              </SubmitButton>
              </form>
            </details>
          )}

          <details className="group">
            <summary className="text-base uppercase tracking-widest text-primary font-bold cursor-pointer list-none flex items-center justify-between">
              Alterar email
              <ChevronDown size={18} className="transition-transform group-open:rotate-180" />
            </summary>
            <form action={emailAction} className="flex flex-col gap-4 mt-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="novoEmail" className="text-base text-white/70">Novo email</label>
                <input id="novoEmail" name="novoEmail" type="email" required autoComplete="email"
                  className="rounded-md bg-white/5 border border-white/15 px-4 py-2.5 text-white focus:outline-none focus:border-primary" />
              </div>
              {emailState?.error && <p className="text-sm text-red-400">{emailState.error}</p>}
              {emailState?.success && <p className="text-sm text-primary">Enviámos um link de confirmação para o novo email.</p>}
              <SubmitButton
                pendingText="A enviar..."
                className="self-start rounded-full bg-primary px-6 py-3 font-semibold text-white hover:bg-[var(--primary-hover)] transition-all cursor-pointer"
              >
                Alterar email
              </SubmitButton>
            </form>
          </details>

          <details className="group">
            <summary className="text-base uppercase tracking-widest text-red-400 font-bold cursor-pointer list-none flex items-center justify-between">
              Apagar conta
              <ChevronDown size={18} className="transition-transform group-open:rotate-180" />
            </summary>
            <form action={apagarAction} className="flex flex-col gap-4 mt-4">
              <p className="text-sm text-white/60">
                Ação permanente — não pode ser desfeita. A tua conta e dados pessoais são apagados; encomendas já feitas
                ficam guardadas para o registo da associação, sem ligação à tua conta.
              </p>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="confirmacao" className="text-base text-white/70">
                  Escreve <span className="font-bold text-white/90">APAGAR</span> para confirmares
                </label>
                <input
                  id="confirmacao"
                  name="confirmacao"
                  type="text"
                  autoComplete="off"
                  value={apagarConfirmacao}
                  onChange={(e) => setApagarConfirmacao(e.target.value)}
                  className="rounded-md bg-white/5 border border-white/15 px-4 py-2.5 text-white focus:outline-none focus:border-red-400"
                />
              </div>
              {apagarState?.error && <p className="text-sm text-red-400">{apagarState.error}</p>}
              <SubmitButton
                pendingText="A apagar..."
                disabled={apagarConfirmacao !== "APAGAR"}
                className="self-start rounded-full bg-red-500 border border-red-500 px-6 py-3 font-semibold text-white hover:bg-red-600 hover:border-red-600 transition-all cursor-pointer"
              >
                Apagar conta
              </SubmitButton>
            </form>
          </details>

          <div className="mt-2 pt-4 border-t border-white/10">
            <h2 className="text-base uppercase tracking-widest text-primary font-bold mb-3">Histórico de encomendas</h2>
            {encomendas.length === 0 ? (
              <p className="text-white/60 text-base">Ainda não tens encomendas.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-white/10">
                {encomendas.map((encomenda) => (
                  <li key={encomenda.id}>
                    <details className="group">
                      <summary className="flex items-center justify-between gap-2 py-2.5 cursor-pointer list-none">
                        <div className="min-w-0">
                          <p className="text-white/90 text-sm">{formatDataEncomenda(encomenda.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-xs font-bold uppercase tracking-wide ${ESTADO_CLASSE[encomenda.status]}`}>
                            {ESTADO_LABEL[encomenda.status]}
                          </span>
                          <ChevronDown size={16} className="text-white/40 transition-transform group-open:rotate-180" />
                        </div>
                      </summary>
                      <div className="pb-3 text-sm">
                        <ul className="flex flex-col gap-0.5">
                          {encomenda.items.map((item) => (
                            <li key={item.id} className="text-white/70 text-xs">
                              {item.quantidade}× {item.nome}
                              {(item.cor || item.tamanho) && (
                                <span className="text-white/40"> · {[item.cor, item.tamanho].filter(Boolean).join(" · ")}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10 text-white/90 font-bold text-sm">
                          <span>Total</span>
                          <span>{formatarPreco(encomenda.totalCentimos / 100)}</span>
                        </div>
                        <p className="text-xs text-white/50 mt-1">
                          {encomenda.metodoEntrega === "levantamento" ? "Levantamento em mão" : "Envio"}
                        </p>
                        {encomenda.metodoPagamento === "multibanco" && encomenda.referenciaMbEntidade && encomenda.referenciaMbNumero && (
                          <div className="mt-2 pt-2 border-t border-white/10 text-xs text-white/70 space-y-0.5">
                            <p>Entidade <span className="text-white/90 font-semibold">{encomenda.referenciaMbEntidade}</span></p>
                            <p>Referência <span className="text-white/90 font-semibold">{encomenda.referenciaMbNumero}</span></p>
                          </div>
                        )}
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Coluna 3 — Morada, inalterada. */}
        <div>
        <form action={action} className="flex flex-col gap-4">
          <h2 className="text-base uppercase tracking-widest text-primary font-bold">Morada</h2>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="phone" className="text-base text-white/70">Telefone</label>
            <input id="phone" name="phone" type="tel" defaultValue={user.phone ?? ""}
              className="rounded-md bg-white/5 border border-white/15 px-4 py-2.5 text-white focus:outline-none focus:border-primary" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="addressLine" className="text-base text-white/70">Morada</label>
            <input id="addressLine" name="addressLine" type="text" defaultValue={user.addressLine ?? ""}
              className="rounded-md bg-white/5 border border-white/15 px-4 py-2.5 text-white focus:outline-none focus:border-primary" />
          </div>
          <div className="grid grid-cols-[7rem_1fr] gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="postalCode" className="text-base text-white/70">Código postal</label>
              <input id="postalCode" name="postalCode" type="text" defaultValue={user.postalCode ?? ""}
                className="rounded-md bg-white/5 border border-white/15 px-4 py-2.5 text-white focus:outline-none focus:border-primary" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="city" className="text-base text-white/70">Cidade</label>
              <input id="city" name="city" type="text" defaultValue={user.city ?? ""}
                className="rounded-md bg-white/5 border border-white/15 px-4 py-2.5 text-white focus:outline-none focus:border-primary" />
            </div>
          </div>
          {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
          {state?.success && <p className="text-sm text-primary">Morada atualizada.</p>}
          <p className="text-sm text-white/50 italic">* A morada será automaticamente usada para futuras encomendas.</p>
          <SubmitButton
            pendingText="A guardar..."
            className="self-start rounded-full bg-primary px-6 py-3 font-semibold text-white hover:bg-[var(--primary-hover)] transition-all cursor-pointer"
          >
            Guardar morada
          </SubmitButton>
        </form>

        {/* Desktop: preso dentro da coluna da Morada, não é afetado pelos
            accordions da coluna do meio (items-start no grid). */}
        <form action={terminarSessao} className="hidden md:flex justify-end mt-6">
          <SubmitButton
            pendingText="A sair..."
            className="flex items-center gap-2 rounded-full bg-red-500 border border-red-500 px-6 py-3 font-bold uppercase tracking-widest text-sm text-white hover:bg-red-600 hover:border-red-600 transition-all cursor-pointer"
          >
            <LogOut size={18} strokeWidth={2.5} />
            Logout
          </SubmitButton>
        </form>
        </div>

        {/* Mobile: fora do grid, no fundo do ecrã, depois de todas as colunas. */}
        <form action={terminarSessao} className="md:hidden order-[10000] flex justify-center mt-6">
          <SubmitButton
            pendingText="A sair..."
            className="flex items-center gap-2 rounded-full bg-red-500 border border-red-500 px-6 py-3 font-bold uppercase tracking-widest text-sm text-white hover:bg-red-600 hover:border-red-600 transition-all cursor-pointer"
          >
            <LogOut size={18} strokeWidth={2.5} />
            Logout
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
