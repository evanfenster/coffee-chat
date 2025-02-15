import { tool } from 'ai';
import { findRelevantContent, type SearchResult } from '../embedding';
import { z } from 'zod';

export function createGetKnowledgeTool() {
  return tool({
    description: 'Search the knowledge base for relevant information to answer the user\'s question',
    parameters: z.object({
      query: z.string().describe('The search query to find relevant information'),
    }),
    execute: async ({ query }) => {
      const results = await findRelevantContent(query);
      
      if (results.length === 0) {
        return { found: false, message: 'No relevant information found.' };
      }
      
      return {
        found: true,
        results: results.map((r: SearchResult) => ({
          content: r.content,
          relevance: r.similarity,
        })),
      };
    },
  });
} 