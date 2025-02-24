ALTER TABLE "User" ADD COLUMN "address_line1" varchar(255);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "address_line2" varchar(255);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "city" varchar(100);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "state" varchar(100);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "postal_code" varchar(20);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "country" varchar(100);