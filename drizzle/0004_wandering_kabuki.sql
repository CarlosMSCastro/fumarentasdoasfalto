CREATE TABLE "socio_link_request" (
	"userId" uuid NOT NULL,
	"quotagest_id" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "socio_link_request_token_pk" PRIMARY KEY("token")
);
--> statement-breakpoint
ALTER TABLE "socio_link_request" ADD CONSTRAINT "socio_link_request_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;