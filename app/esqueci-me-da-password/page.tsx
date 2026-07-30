"use client";
import Link from "next/link";
import { useActionState } from "react";
import { pedirResetPassword } from "@/app/actions/auth";
import AuthPageBackground from "@/components/AuthPageBackground";

export default function EsqueciMeDaPasswordPage() {
  const [state, action, pending] = useActionState(pedirResetPassword, undefined);

  return (
    <AuthPageBackground>
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-white/90 mb-8 text-center">Recuperar password</h1>
        {state?.success ? (
          <p className="text-white/70 text-center">
            Se existir uma conta com esse email, enviámos um link para a redefinires. Verifica a tua caixa de entrada.
          </p>
        ) : (
          <form action={action} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm text-white/70">Email</label>
              <input id="email" name="email" type="email" required autoComplete="email"
                className="rounded-md bg-white/5 border border-white/15 px-4 py-2.5 text-white focus:outline-none focus:border-primary" />
            </div>
            {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
            <button type="submit" disabled={pending}
              className="mt-2 rounded-full bg-primary px-6 py-3 font-semibold text-white hover:bg-[var(--primary-hover)] transition-all disabled:opacity-50 cursor-pointer">
              {pending ? "A enviar..." : "Enviar link"}
            </button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-white/60">
          <Link href="/login" className="text-primary hover:underline">Voltar ao login</Link>
        </p>
      </div>
    </AuthPageBackground>
  );
}
