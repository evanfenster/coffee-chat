CREATE TABLE IF NOT EXISTS "coffeefilters" (
	"chatId" uuid NOT NULL,
	"filters" json NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "coffeefilters" ADD CONSTRAINT "coffeefilters_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
