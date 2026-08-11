ALTER TABLE "order" ADD COLUMN "idempotency_key" text;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_idempotency_key_unique" UNIQUE("idempotency_key");