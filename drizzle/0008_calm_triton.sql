ALTER TYPE "public"."order_status" ADD VALUE 'reembolsado';--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "eupago_trid" text;--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "refunded_at" timestamp;