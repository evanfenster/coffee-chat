import { tool } from 'ai';
import { z } from 'zod';
import { getCoffeeProducts } from '@/lib/coffee/coffee-fetcher';

export const getCoffeeOptions = tool({
  description: 'Get all coffee bean types that match the current filters for this chat.',
  parameters: z.object({
    chatId: z.string()
  }),
  execute: async ({ chatId }) => {
    return await getCoffeeProducts(chatId);
  },
}); 