"use client";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

interface SubmitButtonProps {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
}

// Mostra um spinner + desativa enquanto o form pai está a processar —
// useFormStatus lê o estado do <form> mais próximo automaticamente, por
// isso funciona com qualquer server action (login por password, OAuth,
// logout, etc.) sem precisar de useActionState em cada um.
export default function SubmitButton({ children, pendingText, className }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${className} disabled:opacity-60 disabled:cursor-not-allowed`}
    >
      {pending ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 size={18} className="animate-spin" />
          {pendingText ?? children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
