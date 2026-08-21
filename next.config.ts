import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.180", "192.168.1.*"],
  // Por omissão o Next limita o corpo de uma Server Action a 1MB — o upload
  // de foto de perfil (atualizarFoto) valida até 5MB no próprio código, por
  // isso o limite do framework tem de acompanhar, senão fotos de telemóvel
  // (facilmente >1MB) são rejeitadas pelo Next antes de chegarem ao código.
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  // Sem isto, o output file tracing da Vercel por vezes não copia o binário
  // nativo do sharp (@img/sharp-libvips-*) para a função serverless — dá
  // ERR_DLOPEN_FAILED em runtime mesmo com o pacote certo no
  // package-lock.json. lib/upload.ts usa sharp, e como o Next agrupa todos
  // os Server Actions de uma rota no mesmo chunk, isto derruba até ações
  // sem nada a ver com fotos (ex: logout em /perfil) só por partilharem o
  // chunk. Padrão documentado em node_modules/next/dist/docs/.../output.md.
  outputFileTracingIncludes: {
    "/*": ["node_modules/sharp/**/*", "node_modules/@img/**/*"],
  },
  images: {
    // Desligado de propósito — a otimização de imagens da Vercel fatura por
    // transformação (cada combinação única de imagem+largura+formato), e o
    // tier gratuito (5.000/mês) é fácil de esgotar com o volume de fotos
    // reais do site (eventos, produtos, fundadores, sócios). As imagens já
    // chegam pré-redimensionadas a um máximo de 1600px no upload (sharp, ver
    // lib/upload.ts), por isso o custo de as servir sem otimização adicional
    // é pequeno — a alternativa (deixar ligado) é um risco de fatura sem
    // limite superior garantido, o que não é aceitável aqui.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "platform-lookaside.fbsbx.com" },
      { protocol: "https", hostname: "graph.facebook.com" },
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "storage.quotagest.pt" },
    ],
  },
  async headers() {
    // Bloqueante (ver AUDIT.md #13) — testada primeiro em Report-Only sem
    // nenhuma violação em todas as páginas públicas, /perfil, /checkout e
    // /admin inteiro (autenticado como admin). Maps JS (script/tiles) e
    // Sentry Replay (worker) carregam de fora; Sentry client usa tunnelRoute
    // "/monitoring" (same-origin) — por isso não precisa de entrada própria
    // aqui. Login OAuth e pagamento Eupago não passam por aqui (são
    // navegação/redirecionamento HTTP e chamadas server-side, respetivamente
    // — nenhum dos dois é restringido por CSP).
    //
    // img-src precisa de uma entrada por domínio de imagem externo (avatares
    // OAuth, Vercel Blob, fotos do Quotagest) — a assunção original era que
    // todas passavam por /_next/image (same-origin), o que só era verdade
    // com a otimização de imagens ligada. Deixou de ser verdade quando
    // `images.unoptimized` foi ligado acima (2026-08-21, para eliminar risco
    // de fatura) — sem isto, o browser bloqueia essas imagens em silêncio
    // (nenhum erro na consola óbvio, só a imagem parte), confirmado em
    // produção logo a seguir a essa alteração: avatar na navbar, /perfil, e
    // todas as fotos no admin (fundadores/eventos/produtos/sócios).
    //
    // 'unsafe-inline' no script-src é necessário sem nonces: o Next injeta
    // os dados de hidratação RSC (self.__next_f.push(...)) via <script>
    // inline — sem isto a hidratação falha silenciosamente (sem nenhum erro
    // na consola), a app fica presa no fade-in inicial (app/template.tsx) e
    // parece "tudo preto". Confirmado por bisecção isolando cada diretiva
    // (2026-08-17). A alternativa correta (CSP com nonce, ver docs do Next)
    // obriga toda a app a renderização dinâmica — fora de escopo aqui. A
    // proteção XSS específica a scripts inline fica mais fraca, mas as
    // outras diretivas (img/connect/worker/frame-ancestors/object-src/etc.)
    // continuam estritas. 'unsafe-eval' só em dev (exigido pelo React para
    // reconstruir stack traces do servidor) — nunca em produção.
    const isDev = process.env.NODE_ENV === "development";
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://maps.googleapis.com`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://maps.gstatic.com https://maps.googleapis.com https://lh3.googleusercontent.com https://platform-lookaside.fbsbx.com https://graph.facebook.com https://*.public.blob.vercel-storage.com https://storage.quotagest.pt",
      "font-src 'self'",
      "connect-src 'self' https://maps.googleapis.com",
      "worker-src 'self' blob:",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "fumarentasdoasfalto",

  project: "sentry-copper-book",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
