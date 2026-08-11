// Image importado como PdfImage: é o componente do @react-pdf/renderer (não
// suporta alt, não tem nada a ver com acessibilidade web), não o <Image> do
// Next.js — renomeado para não ser apanhado pela regra jsx-a11y/alt-text.
import { Document, Page, View, Text, Image as PdfImage, StyleSheet, renderToBuffer } from "@react-pdf/renderer";

const PRIMARY = "#ff6b00";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica", color: "#1a1a1a" },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 24, borderBottom: `2px solid ${PRIMARY}`, paddingBottom: 16 },
  logo: { width: 48, height: 48, marginRight: 12 },
  nomeAssociacao: { fontSize: 16, fontWeight: 700 },
  morada: { fontSize: 9, color: "#666666", marginTop: 2 },
  titulo: { fontSize: 14, fontWeight: 700, marginBottom: 4 },
  avisoFiscal: { fontSize: 9, color: "#999999", marginBottom: 20 },
  secao: { marginBottom: 16 },
  rotulo: { fontSize: 9, color: "#666666" },
  valor: { fontSize: 12, marginBottom: 8 },
  tabela: { marginTop: 4, borderTop: "1px solid #dddddd" },
  linha: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottom: "1px solid #eeeeee" },
  linhaTotal: { flexDirection: "row", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTop: "2px solid #1a1a1a" },
  totalTexto: { fontWeight: 700, fontSize: 13 },
  rodape: { position: "absolute", bottom: 40, left: 40, right: 40, fontSize: 9, color: "#999999", textAlign: "center" },
});

function formatar(centimos: number): string {
  return `${(centimos / 100).toFixed(2).replace(".", ",")} €`;
}

interface ReciboDados {
  id: string;
  nome: string;
  data: Date;
  itens: { nome: string; quantidade: number; precoCentimos: number }[];
  totalCentimos: number;
}

function ReciboDocumento({ dados, logo }: { dados: ReciboDados; logo?: Buffer }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {logo && <PdfImage src={logo} style={styles.logo} />}
          <View>
            <Text style={styles.nomeAssociacao}>Fumarentas do Asfalto</Text>
            <Text style={styles.morada}>Rua do Espírito Santo, 4760-485 Fradelos, Vila Nova de Famalicão</Text>
          </View>
        </View>

        <Text style={styles.titulo}>Recibo — Encomenda #{dados.id.slice(0, 8)}</Text>
        <Text style={styles.avisoFiscal}>Este documento não tem valor fiscal.</Text>

        <View style={styles.secao}>
          <Text style={styles.rotulo}>Cliente</Text>
          <Text style={styles.valor}>{dados.nome}</Text>
          <Text style={styles.rotulo}>Data</Text>
          <Text style={styles.valor}>
            {dados.data.toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" })}
          </Text>
        </View>

        <View style={styles.tabela}>
          {dados.itens.map((item, i) => (
            <View style={styles.linha} key={i}>
              <Text>
                {item.quantidade}× {item.nome}
              </Text>
              <Text>{formatar(item.precoCentimos * item.quantidade)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.linhaTotal}>
          <Text style={styles.totalTexto}>Total</Text>
          <Text style={styles.totalTexto}>{formatar(dados.totalCentimos)}</Text>
        </View>

        <Text style={styles.rodape}>Obrigado pela tua compra! — Fumarentas do Asfalto</Text>
      </Page>
    </Document>
  );
}

// Busca o logo por HTTP (não por filesystem) — o diretório public/ não fica
// garantidamente acessível por fs dentro da função serverless da Vercel;
// pedir pelo URL público é o mesmo caminho que os emails HTML já usam
// (ver lib/email.ts) e funciona sempre, independentemente de onde a função corre.
async function obterLogo(): Promise<Buffer | undefined> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/logo.png`);
    if (!res.ok) return undefined;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return undefined;
  }
}

export async function gerarReciboPdf(dados: ReciboDados): Promise<Buffer> {
  const logo = await obterLogo();
  return renderToBuffer(<ReciboDocumento dados={dados} logo={logo} />);
}
