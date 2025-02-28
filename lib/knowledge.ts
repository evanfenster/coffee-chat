import { createHash } from 'crypto';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { db } from './db/queries';
import { knowledgeResource, knowledgeEmbedding, systemSettings } from './db/schema';
import { generateEmbeddings } from './ai/embedding';
import { eq, not, inArray } from 'drizzle-orm';

export async function initializeKnowledgeBase() {
  try {
    // Check if knowledge base has already been initialized
    const settings = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, 'knowledge_base_initialized'))
      .limit(1);

    // Only return if we have the flag AND it's set to true
    if (settings.length > 0 && settings[0].value === true) {
      return;
    }

    console.log('Initializing knowledge base...');
    
    const KNOWLEDGE_DIR = join(process.cwd(), 'knowledge');
    
    // Get all .md files in the knowledge directory
    const files = readdirSync(KNOWLEDGE_DIR).filter(file => file.endsWith('.md'));
    console.log(`Found ${files.length} markdown files`);
    
    // Get the file paths of all current files
    const currentFilePaths = files.map(file => join(KNOWLEDGE_DIR, file));
    
    // Get all existing resources
    const existingResources = await db
      .select({
        id: knowledgeResource.id,
        filePath: knowledgeResource.filePath,
        fileHash: knowledgeResource.fileHash
      })
      .from(knowledgeResource);
    
    // Find resources to delete (files that no longer exist)
    const resourcesToDelete = existingResources.filter(
      resource => !currentFilePaths.includes(resource.filePath)
    );
    
    // Delete removed files from the database
    if (resourcesToDelete.length > 0) {
      const resourceIds = resourcesToDelete.map(r => r.id);
      console.log(`Deleting ${resourcesToDelete.length} removed files from knowledge base`);
      
      // Delete associated embeddings (cascade will handle this, but being explicit)
      await db
        .delete(knowledgeEmbedding)
        .where(inArray(knowledgeEmbedding.resourceId, resourceIds));
      
      // Delete the resources
      await db
        .delete(knowledgeResource)
        .where(inArray(knowledgeResource.id, resourceIds));
    }
    
    // Process current files
    for (const file of files) {
      const filePath = join(KNOWLEDGE_DIR, file);
      const content = readFileSync(filePath, 'utf-8');
      
      // Create a hash of the file content
      const fileHash = createHash('sha256').update(content).digest('hex');
      
      // Check if this exact file content already exists
      const existing = await db
        .select()
        .from(knowledgeResource)
        .where(eq(knowledgeResource.fileHash, fileHash))
        .limit(1);
      
      if (existing.length > 0) {
        console.log(`File unchanged, skipping: ${file}`);
        continue;
      }
      
      // If we get here, either the file is new or its content has changed
      console.log(`Processing file: ${file}`);
      
      try {
        // Delete old version if it exists (by file path)
        await db
          .delete(knowledgeResource)
          .where(eq(knowledgeResource.filePath, filePath));
        
        // Create the new resource
        const [resource] = await db
          .insert(knowledgeResource)
          .values({
            filePath,
            fileHash,
            content,
          })
          .returning();
        
        // Generate and store embeddings
        const embeddings = await generateEmbeddings(content);
        
        await db.insert(knowledgeEmbedding).values(
          embeddings.map(({ content, embedding }) => ({
            resourceId: resource.id,
            content,
            embedding,
          })),
        );
        
        console.log(`Successfully processed: ${file}`);
      } catch (error) {
        console.error(`Error processing ${file}:`, error);
      }
    }
    
    // Mark knowledge base as initialized
    await db
      .insert(systemSettings)
      .values({
        key: 'knowledge_base_initialized',
        value: true,
      })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: {
          value: true,
          updatedAt: new Date(),
        },
      });
    
    console.log('Knowledge base initialization complete');
  } catch (error) {
    console.error('Error initializing knowledge base:', error);
    throw error;
  }
} 