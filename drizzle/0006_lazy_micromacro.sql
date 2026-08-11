CREATE TYPE "public"."metodo_entrega" AS ENUM('envio', 'levantamento');--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "metodo_entrega" "metodo_entrega" DEFAULT 'envio' NOT NULL;