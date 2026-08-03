"use client";
import { useActionState } from "react";
import { confirmarAlteracaoEmail } from "@/app/actions/auth";
import SubmitButton from "@/components/SubmitButton";

export default function ConfirmarEmailForm({ token }: { token: string }) {
  const [state, action] = useActionState(confirmarAlteracaoEmail, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      <SubmitButton
        pendingText="A confirmar..."
        className="rounded-full bg-primary px-6 py-3 font-semibold text-white hover:bg-[var(--primary-hover)] transition-all cursor-pointer"
      >
        Confirmar alteração
      </SubmitButton>
    </form>
  );
}
