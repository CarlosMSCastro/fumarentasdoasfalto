"use client";
import Link from "next/link";
import { useActionState } from "react";
import { entrar, entrarComGoogle, entrarComFacebook } from "@/app/actions/auth";
import GoogleIcon from "@/components/GoogleIcon";
import FacebookLoginIcon from "@/components/FacebookLoginIcon";
import AuthPageBackground from "@/components/AuthPageBackground";
import SubmitButton from "@/components/SubmitButton";

export default function LoginPage() {
  const [state, action] = useActionState(entrar, undefined);

  return (
    <AuthPageBackground>
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-[#f8f0d9] mb-8 pt-20 md:pt-0 text-center">Entrar</h1>
        <div className="flex flex-col gap-3">
          <form action={entrarComGoogle}>
            <SubmitButton
              pendingText="A continuar..."
              className="w-full flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-2.5 font-semibold text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <GoogleIcon />
              Continuar com Google
            </SubmitButton>
          </form>
          <form action={entrarComFacebook}>
            <SubmitButton
              pendingText="A continuar..."
              className="w-full flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-2.5 font-semibold text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <FacebookLoginIcon />
              Continuar com Facebook
            </SubmitButton>
          </form>
        </div>
        <div className="flex items-center gap-3 my-6">
          <div className="h-px flex-1 bg-white/15" />
          <span className="text-xs text-white/40 uppercase tracking-widest">ou</span>
          <div className="h-px flex-1 bg-white/15" />
        </div>
        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm text-white/70">Email</label>
            <input id="email" name="email" type="email" required autoComplete="email"
              className="rounded-md bg-white/5 border border-white/15 px-4 py-2.5 text-white focus:outline-none focus:border-primary" />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm text-white/70">Password</label>
              <Link href="/esqueci-me-da-password" className="text-xs text-primary hover:underline">Esqueceste-te da password?</Link>
            </div>
            <input id="password" name="password" type="password" required autoComplete="current-password"
              className="rounded-md bg-white/5 border border-white/15 px-4 py-2.5 text-white focus:outline-none focus:border-primary" />
          </div>
          {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
          <SubmitButton
            pendingText="A entrar..."
            className="mt-2 rounded-full bg-primary px-6 py-3 font-semibold text-white hover:bg-[var(--primary-hover)] transition-all cursor-pointer"
          >
            Entrar
          </SubmitButton>
        </form>
        <p className="mt-6 text-center text-sm text-white/60">
          Ainda não tens conta? <Link href="/registo" className="text-primary hover:underline">Regista-te</Link>
        </p>
      </div>
    </AuthPageBackground>
  );
}
