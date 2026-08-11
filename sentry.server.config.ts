// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://1fc8e0a0271c06d0dfc1a7f5fe716a39@o4511893502689280.ingest.de.sentry.io/4511893506424912",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Restrito face ao default do wizard: os Server Actions deste site enviam
  // passwords no corpo do pedido (login/registo/alterar password), e alguns
  // URLs têm tokens sensíveis na query string (reset de password, confirmar
  // email/sócio) — por isso desligamos cookies, corpo do pedido, variáveis
  // da stack e query params. userInfo fica ligado (saber que utilizador foi
  // afetado é útil e de baixo risco).
  dataCollection: {
    userInfo: true,
    cookies: false,
    httpHeaders: { request: false, response: false },
    httpBodies: [],
    urlQueryParams: false,
    databaseQueryData: false,
    stackFrameVariables: false,
  },
});
