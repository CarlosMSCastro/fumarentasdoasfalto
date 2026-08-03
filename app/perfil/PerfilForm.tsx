"use client";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { useActionState } from "react";
import { atualizarPerfil } from "@/app/actions/perfil";
import { terminarSessao } from "@/app/actions/auth";
import { getHighResAvatarUrl } from "@/lib/avatar";
import type { users } from "@/lib/db/schema";

type User = typeof users.$inferSelect;

function getInitials(name?: string | null, email?: string | null): string {
  const source = name?.trim() || email?.trim() || "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export default function PerfilForm({ user }: { user: User }) {
  const [state, action, pending] = useActionState(atualizarPerfil, undefined);
  const initials = getInitials(user.name, user.email);

  return (
    <div className="w-full max-w-6xl pt-16 md:pt-28">
      <div className="grid grid-cols-1 md:grid-cols-[0.8fr_1fr_1.3fr] gap-10">
        <div className="md:pt-30">
          <h2 className="text-base uppercase tracking-widest text-primary font-bold mb-3">Histórico de encomendas</h2>
          <p className="text-white/60 text-base">Ainda não tens encomendas.</p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <span className="relative shrink-0 w-20 h-20 rounded-full overflow-hidden border border-white/20">
              {user.image ? (
                <Image src={getHighResAvatarUrl(user.image)!} alt="" fill sizes="80px" className="object-cover" />
              ) : (
                <span className="w-full h-full flex items-center justify-center bg-white/10 text-white text-2xl font-bold">
                  {initials}
                </span>
              )}
            </span>
            <div className="min-w-0">
              <h1 className="text-3xl font-bold text-[#f8f0d9] truncate">{user.name || "A tua conta"}</h1>
              <p className="text-white/60 text-base truncate">{user.email}</p>
            </div>
          </div>

          <div className="mt-2 pt-4 border-t border-white/10">
            <h2 className="text-base uppercase tracking-widest text-primary font-bold mb-3">Sócio</h2>
            <dl className="space-y-2 text-base">
              <div className="flex justify-between gap-4">
                <dt className="text-white/60">Sócio desde</dt>
                <dd className="text-white/90">—</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-white/60">Estado da quota</dt>
                <dd className="text-white/90">—</dd>
              </div>
            </dl>
            <p className="text-sm text-white/40 italic mt-3">Ligação ao Quotaguest ainda por fazer.</p>
          </div>
        </div>

        <form action={action} className="flex flex-col gap-4 md:pt-30">
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
          <button type="submit" disabled={pending}
            className="self-start rounded-full bg-primary px-6 py-3 font-semibold text-white hover:bg-[var(--primary-hover)] transition-all disabled:opacity-50 cursor-pointer">
            {pending ? "A guardar..." : "Guardar morada"}
          </button>
        </form>
      </div>

      <form action={terminarSessao} className="mt-10 flex justify-end">
        <button type="submit"
          className="flex items-center gap-2 rounded-full bg-red-500 border border-red-500 px-6 py-3 font-bold uppercase tracking-widest text-sm text-white hover:bg-red-600 hover:border-red-600 transition-all cursor-pointer">
          <LogOut size={18} strokeWidth={2.5} />
          Logout
        </button>
      </form>
    </div>
  );
}
