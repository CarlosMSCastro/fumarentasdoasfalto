CREATE TYPE "public"."admin_secao" AS ENUM('encomendas', 'socios', 'utilizadores');--> statement-breakpoint
CREATE TABLE "admin_secao_vista" (
	"secao" "admin_secao" PRIMARY KEY NOT NULL,
	"vista_em" timestamp DEFAULT now() NOT NULL
);
