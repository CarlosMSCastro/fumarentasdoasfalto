CREATE TYPE "public"."comunicado_status" AS ENUM('sucesso', 'parcial', 'falhou');--> statement-breakpoint
CREATE TABLE "comunicado" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assunto" text NOT NULL,
	"corpo_texto" text NOT NULL,
	"corpo_html" text NOT NULL,
	"destinatarios_total" integer NOT NULL,
	"destinatarios_enviados" integer NOT NULL,
	"destinatarios_falhados" integer DEFAULT 0 NOT NULL,
	"destinatarios_invalidos" integer DEFAULT 0 NOT NULL,
	"destinatarios_emails" text[] NOT NULL,
	"status" "comunicado_status" NOT NULL,
	"enviado_por_id" uuid,
	"enviado_por_nome" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "comunicado" ADD CONSTRAINT "comunicado_enviado_por_id_user_id_fk" FOREIGN KEY ("enviado_por_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;