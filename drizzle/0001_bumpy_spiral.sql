CREATE TABLE "email_change_request" (
	"userId" uuid NOT NULL,
	"new_email" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "email_change_request_token_pk" PRIMARY KEY("token")
);
--> statement-breakpoint
ALTER TABLE "email_change_request" ADD CONSTRAINT "email_change_request_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;