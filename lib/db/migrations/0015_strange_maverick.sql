CREATE TABLE IF NOT EXISTS "Order" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"productHandle" varchar(255) NOT NULL,
	"productName" varchar(255) NOT NULL,
	"price" varchar(50) NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"stripeSessionId" varchar(255) NOT NULL,
	"cardHolderId" varchar(255),
	"cardId" varchar(255),
	"errorDetails" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
