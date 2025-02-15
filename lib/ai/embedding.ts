import OpenAI from 'openai';
import { db } from '../db/queries';
import { knowledgeEmbedding } from '../db/schema';
import { cosineDistance, desc, gt, sql } from 'drizzle-orm';

// Function to generate chunks from text
const generateChunks = (input: string): string[] => {
  // Split by newlines first to preserve markdown structure
  const sections = input.split(/\n\n+/);
  
  // Then split long sections by sentences
  const chunks: string[] = [];
  for (const section of sections) {
    if (section.length < 1000) {
      chunks.push(section);
    } else {
      // Split long sections by sentences
      const sentences = section.split(/(?<=[.!?])\s+/);
      let currentChunk = '';
      
      for (const sentence of sentences) {
        if ((currentChunk + sentence).length < 1000) {
          currentChunk += (currentChunk ? ' ' : '') + sentence;
        } else {
          if (currentChunk) chunks.push(currentChunk);
          currentChunk = sentence;
        }
      }
      if (currentChunk) chunks.push(currentChunk);
    }
  }
  
  return chunks.filter(chunk => chunk.trim().length > 0);
};

export interface EmbeddingResult {
  content: string;
  embedding: number[];
}

// Function to generate embeddings for multiple chunks
export async function generateEmbeddings(text: string): Promise<EmbeddingResult[]> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const chunks = generateChunks(text);
  
  const embeddings = await Promise.all(
    chunks.map(async (chunk) => {
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: chunk.replace(/\n/g, ' '),
      });
      
      return {
        content: chunk,
        embedding: response.data[0].embedding,
      };
    }),
  );
  
  return embeddings;
}

// Function to generate a single embedding
export async function generateEmbedding(text: string): Promise<number[]> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text.replace(/\n/g, ' '),
  });
  
  return response.data[0].embedding;
}

export interface SearchResult {
  content: string;
  similarity: number;
}

// Function to find relevant content
export async function findRelevantContent(query: string): Promise<SearchResult[]> {
  const queryEmbedding = await generateEmbedding(query);
  
  // Calculate cosine similarity and find relevant chunks
  const similarity = sql<number>`1 - (${cosineDistance(
    knowledgeEmbedding.embedding,
    queryEmbedding,
  )})`;
  
  const results = await db
    .select({
      content: knowledgeEmbedding.content,
      similarity,
    })
    .from(knowledgeEmbedding)
    .where(gt(similarity, 0.7)) // Only return reasonably similar results
    .orderBy(desc(similarity))
    .limit(5);
  
  return results;
} 