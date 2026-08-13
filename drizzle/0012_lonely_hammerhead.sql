CREATE TYPE "public"."objetivo_card_id" AS ENUM('encontros', 'restauracao', 'workshops');--> statement-breakpoint
CREATE TYPE "public"."pagina_legal" AS ENUM('termos', 'privacidade', 'cookies');--> statement-breakpoint
CREATE TABLE "conteudo_texto" (
	"chave" text PRIMARY KEY NOT NULL,
	"valor" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evento_foto" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evento_id" text NOT NULL,
	"url" text NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evento" (
	"id" text PRIMARY KEY NOT NULL,
	"titulo" text NOT NULL,
	"local" text NOT NULL,
	"data" text NOT NULL,
	"descricao" text DEFAULT '' NOT NULL,
	"destaque" boolean DEFAULT false NOT NULL,
	"mostrar" boolean DEFAULT true NOT NULL,
	"capa_url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fundador" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"cargo" text NOT NULL,
	"foto_url" text NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "objetivo_foto" (
	"card_id" "objetivo_card_id" PRIMARY KEY NOT NULL,
	"foto_url" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pagina_legal_seccao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pagina" "pagina_legal" NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	"subtitulo" text NOT NULL,
	"corpo" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "produto_foto" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"produto_id" uuid NOT NULL,
	"url" text NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "produto" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"categoria" text DEFAULT '' NOT NULL,
	"descricao" text DEFAULT '' NOT NULL,
	"preco_centimos" integer NOT NULL,
	"disponivel" boolean DEFAULT true NOT NULL,
	"capa_url" text NOT NULL,
	"cores" text[],
	"tamanhos" text[],
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "evento_foto" ADD CONSTRAINT "evento_foto_evento_id_evento_id_fk" FOREIGN KEY ("evento_id") REFERENCES "public"."evento"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produto_foto" ADD CONSTRAINT "produto_foto_produto_id_produto_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."produto"("id") ON DELETE cascade ON UPDATE no action;