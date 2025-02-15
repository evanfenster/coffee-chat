-- Enable pgvector extension first
CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "KnowledgeEmbedding" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resourceId" uuid NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(1536) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "KnowledgeResource" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"filePath" text NOT NULL,
	"fileHash" varchar(64) NOT NULL,
	"content" text NOT NULL,
	CONSTRAINT "KnowledgeResource_fileHash_unique" UNIQUE("fileHash")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "KnowledgeEmbedding" ADD CONSTRAINT "KnowledgeEmbedding_resourceId_KnowledgeResource_id_fk" FOREIGN KEY ("resourceId") REFERENCES "public"."KnowledgeResource"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "embedding_idx" ON "KnowledgeEmbedding" USING hnsw ("embedding" vector_cosine_ops);