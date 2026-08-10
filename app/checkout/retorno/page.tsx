import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import AuthPageBackground from "@/components/AuthPageBackground";

// Destino do successUrl/failUrl do pagamento por cartão (ver
// gerarLinkPagamentoCartao em lib/eupago.ts). O estado aqui é só para UX
// imediata do lado do cliente — quem confirma mesmo o pagamento é o
// callback do Eupago (app/api/pagamentos/eupago-callback), que é quem
// efetivamente marca a encomenda como paga e dispara o email de
// confirmação.
export default async function RetornoCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado } = await searchParams;
  const sucesso = estado === "sucesso";

  return (
    <AuthPageBackground>
      <div className="flex flex-col items-center justify-center gap-4 text-center px-4 max-w-sm">
        {sucesso ? (
          <>
            <CheckCircle2 className="text-primary" size={48} strokeWidth={1.5} />
            <h1 className="text-[#f8f0d9] text-xl md:text-2xl font-bold">Pagamento em confirmação</h1>
            <p className="text-white/70 text-sm">
              Assim que o pagamento for confirmado, recebes um email e a encomenda passa a &ldquo;paga&rdquo; no teu perfil.
            </p>
          </>
        ) : (
          <>
            <XCircle className="text-red-400" size={48} strokeWidth={1.5} />
            <h1 className="text-[#f8f0d9] text-xl md:text-2xl font-bold">Pagamento não concluído</h1>
            <p className="text-white/70 text-sm">A encomenda ficou registada, mas o pagamento não foi concluído. Podes tentar novamente.</p>
          </>
        )}
        <Link href="/" className="text-primary text-sm font-semibold hover:underline">
          Voltar ao início
        </Link>
      </div>
    </AuthPageBackground>
  );
}
