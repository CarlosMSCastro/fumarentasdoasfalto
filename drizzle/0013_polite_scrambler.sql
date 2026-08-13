CREATE TYPE "public"."quota_pagamento_status" AS ENUM('pendente', 'pago', 'cancelado', 'expirado');--> statement-breakpoint
CREATE TABLE "quota_pagamento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"quotagest_id" text NOT NULL,
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"valor_centimos" integer NOT NULL,
	"metodo_pagamento" "metodo_pagamento" NOT NULL,
	"status" "quota_pagamento_status" DEFAULT 'pendente' NOT NULL,
	"referencia_mb_entidade" text,
	"referencia_mb_numero" text,
	"telemovel_mbway" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"paid_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "quota_pagamento" ADD CONSTRAINT "quota_pagamento_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;