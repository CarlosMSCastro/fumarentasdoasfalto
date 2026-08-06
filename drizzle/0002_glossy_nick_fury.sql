CREATE TYPE "public"."metodo_pagamento" AS ENUM('multibanco', 'mbway', 'cartao');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pendente', 'pago', 'cancelado', 'expirado');--> statement-breakpoint
CREATE TABLE "order_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"orderId" uuid NOT NULL,
	"produto_id" text NOT NULL,
	"nome" text NOT NULL,
	"preco_centimos" integer NOT NULL,
	"quantidade" integer NOT NULL,
	"cor" text,
	"tamanho" text
);
--> statement-breakpoint
CREATE TABLE "order" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid,
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"telefone" text NOT NULL,
	"morada_linha" text,
	"codigo_postal" text,
	"cidade" text,
	"metodo_pagamento" "metodo_pagamento" NOT NULL,
	"status" "order_status" DEFAULT 'pendente' NOT NULL,
	"subtotal_centimos" integer NOT NULL,
	"portes_centimos" integer NOT NULL,
	"total_centimos" integer NOT NULL,
	"referencia_mb_entidade" text,
	"referencia_mb_numero" text,
	"eupago_identificador" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"paid_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_orderId_order_id_fk" FOREIGN KEY ("orderId") REFERENCES "public"."order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;