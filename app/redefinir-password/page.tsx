"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { redefinirPassword } from "@/app/actions/auth";
import AuthPageBackground from "@/components/AuthPageBackground";

export default function RedefinirPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [state, action, pending] = useActionState(redefinirPassword, undefined);

  return (
    <AuthPageBackground>
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-white/90 mb-8 text-center">Nova password</h1>
        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="token" value={token} />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm text-white/70">Nova password</label>
            <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password"
              className="rounded-md bg-white/5 border border-white/15 px-4 py-2.5 text-white focus:outline-none focus:border-primary" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirmPassword" className="text-sm text-white/70">Confirmar password</label>
            <input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} autoComplete="new-password"
              className="rounded-md bg-white/5 border border-white/15 px-4 py-2.5 text-white focus:outline-none focus:border-primary" />
          </div>
          {!token && <p className="text-sm text-red-400">Link inválido — falta o token. Pede um novo link de recuperação.</p>}
          {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
          <button type="submit" disabled={pending || !token}
            className="mt-2 rounded-full bg-primary px-6 py-3 font-semibold text-white hover:bg-[var(--primary-hover)] transition-all disabled:opacity-50 cursor-pointer">
            {pending ? "A guardar..." : "Guardar nova password"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-white/60">
          <Link href="/login" className="text-primary hover:underline">Voltar ao login</Link>
        </p>
      </div>
    </AuthPageBackground>
  );
}
