CREATE TABLE IF NOT EXISTS "SystemSettings" (
	"key" varchar(255) PRIMARY KEY NOT NULL,
	"value" json NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
