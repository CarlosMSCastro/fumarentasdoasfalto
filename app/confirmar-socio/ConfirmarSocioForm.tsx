"use client";
import { useActionState } from "react";
import { confirmarLigacaoSocio } from "@/app/actions/perfil";
import SubmitButton from "@/components/SubmitButton";

export default function ConfirmarSocioForm({ token }: { token: string }) {
  const [state, action] = useActionState(confirmarLigacaoSocio, undefined);

  if (state?.success) {
    return <p className="text-primary text-center">Conta associada. Já podes voltar ao perfil.</p>;
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      <SubmitButton
        pendingText="A confirmar..."
        className="rounded-full bg-primary px-6 py-3 font-semibold text-white hover:bg-[var(--primary-hover)] transition-all cursor-pointer"
      >
        Confirmar associação
      </SubmitButton>
    </form>
  );
}
