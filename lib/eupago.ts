// Integração com o Eupago — ainda NÃO configurada. Falta:
//   1. Uma SubEntidade nova no Eupago, específica para a Loja (separada da
//      que o QuotaGuest usa para as quotas dos sócios), com o callback a
//      apontar para /api/pagamentos/eupago-callback.
//   2. As credenciais dessa SubEntidade (Client ID / Client Secret / Chave /
//      Entidade / SubEntidade) nas variáveis de ambiente abaixo.
//   3. Confirmar na documentação real da API do Eupago o formato exato dos
//      pedidos/respostas de cada método — os esqueletos abaixo ainda não
//      foram validados contra a API real, só têm a forma que vamos
//      preencher assim que houver acesso.
//
// Este ficheiro existe para isolar tudo isto num único sítio: o resto do
// código (server actions, checkout) já pode chamar estas funções, e o dia
// em que as credenciais chegarem só se mexe aqui dentro.

interface CredenciaisEupago {
  clientId: string;
  clientSecret: string;
  chave: string;
  entidade: string;
  subEntidade: string;
}

function lerCredenciais(): CredenciaisEupago {
  const { EUPAGO_CLIENT_ID, EUPAGO_CLIENT_SECRET, EUPAGO_CHAVE, EUPAGO_ENTIDADE, EUPAGO_SUBENTIDADE } = process.env;
  if (!EUPAGO_CLIENT_ID || !EUPAGO_CLIENT_SECRET || !EUPAGO_CHAVE || !EUPAGO_ENTIDADE || !EUPAGO_SUBENTIDADE) {
    throw new Error(
      "Pagamentos ainda não estão configurados (faltam as credenciais EUPAGO_* no ambiente). Ver lib/eupago.ts."
    );
  }
  return {
    clientId: EUPAGO_CLIENT_ID,
    clientSecret: EUPAGO_CLIENT_SECRET,
    chave: EUPAGO_CHAVE,
    entidade: EUPAGO_ENTIDADE,
    subEntidade: EUPAGO_SUBENTIDADE,
  };
}

export interface PedidoPagamento {
  identificador: string; // referência interna nossa (id da encomenda) — usada para ligar o callback à encomenda
  valor: number; // euros
  descricao: string;
}

export interface ReferenciaMultibanco {
  entidade: string;
  referencia: string;
  valor: number;
  validade?: string;
}

export interface PedidoMbway {
  referencia: string;
}

// TODO: preencher a chamada real assim que tivermos a SubEntidade da Loja e a documentação da API.
export async function gerarReferenciaMultibanco(pedido: PedidoPagamento): Promise<ReferenciaMultibanco> {
  lerCredenciais();
  throw new Error(`gerarReferenciaMultibanco: integração Eupago por implementar (pedido ${pedido.identificador}).`);
}

// TODO: preencher a chamada real (pedido "push" para o telemóvel do cliente).
export async function pedirPagamentoMbway(pedido: PedidoPagamento & { telemovel: string }): Promise<PedidoMbway> {
  lerCredenciais();
  throw new Error(`pedirPagamentoMbway: integração Eupago por implementar (pedido ${pedido.identificador}).`);
}

// TODO: preencher — normalmente devolve um URL de checkout alojado pelo Eupago para redirecionar o cliente.
export async function gerarLinkPagamentoCartao(pedido: PedidoPagamento): Promise<{ url: string }> {
  lerCredenciais();
  throw new Error(`gerarLinkPagamentoCartao: integração Eupago por implementar (pedido ${pedido.identificador}).`);
}
