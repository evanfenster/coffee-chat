ALTER TABLE "User" ADD COLUMN "stoaId" varchar(64);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "firstName" varchar(64);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "lastName" varchar(64);--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN IF EXISTS "stripe_cardholder_id";--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN IF EXISTS "stripe_customer_id";--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN IF EXISTS "address_line1";--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN IF EXISTS "address_line2";--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN IF EXISTS "city";--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN IF EXISTS "state";--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN IF EXISTS "postal_code";--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN IF EXISTS "country";